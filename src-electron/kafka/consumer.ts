import * as instance from './kafka-instance';
import {Events} from '../enums/Events';
import * as executionWorkbookCatalog from '../nedb/execution-workbook-catalog';
import * as executionArtifactCatalog from '../nedb/execution-artifact-catalog';
import {Server} from 'socket.io';
import {Consumer} from 'kafkajs';
import {WorkBookActions} from '../enums/WorkBookActions';
import {IConsumedEvent} from '../interfaces/IConsumedEvent';
import {IBrokerKafkaInstance} from '../interfaces/broker/IBrokerKafkaInstance';
import {deleteConsumerGroup} from './admin';
import {IExecutionArtifact} from 'app/src-electron/interfaces/executions/IExecutionArtifact';
import Timeout = NodeJS.Timeout;
import {SchemaRegistry} from '@plasmido/plasmido-schema-registry';

const PLASMIDO_NODE_CONSUMER = 'PLASMIDO_NODE:consumer';

const DEFAULT_CONSUMER_STOP_CHECK_TIME_OUT = 500; // TODO move it to configuration

// TODO generate random group ids?
const getGroupId = (executionArtifactId: string) => `PLASMIDO-${executionArtifactId}`;

const setConsumer = (executionArtifact:IExecutionArtifact, artifactUUID: string, brokerKafkaInstance: IBrokerKafkaInstance) => {
  const serverInstance = instance.getInstance(brokerKafkaInstance);
  return serverInstance.consumer({groupId: getGroupId(executionArtifact._id)});
};

const consumerRun = async (schemaRegistry: SchemaRegistry | undefined,
                           consumer: Consumer,
                           io: Server,
                           artifactUUID: string) => {
  await consumer.run({
    // eslint-disable-next-line @typescript-eslint/require-await
    eachMessage: async (eachMessagePayload) => {
      let avroDecodedMessage = '';
      if (schemaRegistry) {
        const { topic, partition, message } = eachMessagePayload;
        if (message) {
          if (message.value instanceof Buffer) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const result = await schemaRegistry.decode(message.value);
            avroDecodedMessage = JSON.stringify(result); // todo any?
          }
        }
      }
      io.sockets.emit(Events.PLASMIDO_OUTPUT_CONSUMER_CONSUMED_EVENT, {
        eachMessagePayload: eachMessagePayload,
        artifactUUID: artifactUUID,
        avroDecodedMessage: avroDecodedMessage
      } as IConsumedEvent);
    },
  });
};

const subscribeTo = async (schemaRegistry: SchemaRegistry | undefined,
                           consumer: Consumer,
                           topic: string,
                           workbookUUID: string,
                           artifactUUID: string,
                           io: Server) => {
  await consumer.connect();
  await consumer.subscribe({topic, fromBeginning: true}); // TODO configure from...
  return consumerRun(schemaRegistry, consumer, io, artifactUUID);
};

const shouldStopWorkbook = async (workbookUUID: string) => {
  const executionWorkbook = await executionWorkbookCatalog.findOneByWorkBookUUID(workbookUUID);
  return executionWorkbook.action === WorkBookActions.STOP;
};

const stopConsumer = async (workbookUUID: string, executionArtifactId:string, artifactUUID: string, io: Server, consumer: Consumer, brokerKafkaInstance: IBrokerKafkaInstance) => {
  await executionArtifactCatalog.updateArtifactStatusToStopped(workbookUUID, artifactUUID, io);
  // const group = await consumer.describeGroup();
  const groupId = getGroupId(executionArtifactId);
  await consumer.stop();
  // await consumer.disconnect(); // todo is not needed? https://github.com/tulios/kafkajs/blob/d8fd93e7ce8e4675e3bb9b13d7a1e55a1e0f6bbf/src/admin/__tests__/deleteGroups.spec.js
  void await deleteConsumerGroup(brokerKafkaInstance, groupId);
};

const checkArtifactStop = async (interval: Timeout,
                                 consumer: Consumer,
                                 workbookUUID: string,
                                 executionArtifactId:string,
                                 artifactUUID: string,
                                 brokerKafkaInstance: IBrokerKafkaInstance,
                                 io: Server) => {
  const shouldStopConsumer = await shouldStopWorkbook(workbookUUID);
  if (shouldStopConsumer) {
    clearInterval(interval);
    await stopConsumer(workbookUUID, executionArtifactId, artifactUUID, io, consumer, brokerKafkaInstance);
  }
};

const subscribeToGlobalErrors = (workbookUUID: string, executionArtifactId:string, artifactUUID: string, consumer: Consumer, brokerKafkaInstance: IBrokerKafkaInstance, io: Server) => {
  const errorTypes = ['unhandledRejection', 'uncaughtException'];
  errorTypes.forEach(type => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.on(type, async error => {
      try {
        console.error(PLASMIDO_NODE_CONSUMER, ':subscribeToGlobalErrors:ERROR:', error, workbookUUID, artifactUUID, consumer);
        await stopConsumer(workbookUUID, executionArtifactId, artifactUUID, io, consumer, brokerKafkaInstance);
      } catch (_) {
      }
    });
  });
};

const startCheckingConsumerStop = (consumer: Consumer,
                                   workbookUUID: string,
                                   executionArtifactId:string,
                                   artifactUUID: string,
                                   brokerKafkaInstance: IBrokerKafkaInstance,
                                   io: Server) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const interval = setInterval(async () =>
    checkArtifactStop(interval, consumer, workbookUUID, executionArtifactId, artifactUUID, brokerKafkaInstance, io),
    DEFAULT_CONSUMER_STOP_CHECK_TIME_OUT);
};

export const consume = (schemaRegistry: SchemaRegistry | undefined,
                        executionArtifact:IExecutionArtifact,
                        workbookUUID: string,
                        artifactUUID: string,
                        brokerKafkaInstance: IBrokerKafkaInstance,
                        topic: string,
                        io: Server) => {
  const consumer = setConsumer(executionArtifact, artifactUUID, brokerKafkaInstance);
  subscribeTo(schemaRegistry, consumer, topic, workbookUUID, artifactUUID, io)
    .catch(error => {
      void (async () => {
        console.error(PLASMIDO_NODE_CONSUMER, ':consume:ERROR:', error, workbookUUID, artifactUUID, brokerKafkaInstance, topic);
        await executionArtifactCatalog.updateArtifactStatusToStopped(workbookUUID, artifactUUID, io);
        console.error(PLASMIDO_NODE_CONSUMER, ':consume:ERROR:Updated artifact to stopped:', error, workbookUUID, artifactUUID, brokerKafkaInstance, topic);
      })();
    });
  subscribeToGlobalErrors(workbookUUID, executionArtifact._id, artifactUUID, consumer, brokerKafkaInstance, io);
  startCheckingConsumerStop(consumer, workbookUUID, executionArtifact._id, artifactUUID, brokerKafkaInstance, io);
};
