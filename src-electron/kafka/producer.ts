import * as instance from './kafka-instance';
import {Server} from 'socket.io';
import {Producer, ProducerRecord} from 'kafkajs';
import * as executionArtifactCatalog from '../nedb/execution-artifact-catalog';
import {IBrokerKafkaInstance} from 'app/src-electron/interfaces/broker/IBrokerKafkaInstance';
import {Events} from '../enums/Events';
import * as executionWorkbookCatalog from '../nedb/execution-workbook-catalog';
import {WorkBookActions} from '../enums/WorkBookActions';
import {IExecutionArtifact} from '../interfaces/executions/IExecutionArtifact';
import Timeout = NodeJS.Timeout;
import {
  replaceDynamicVariables,
  replaceInternalVariables,
} from '../environment/variables';
import {IProducedEvent} from '../interfaces/workbooks/IProducedEvent';
import {SchemaRegistry} from '@plasmido/plasmido-schema-registry';

const PLASMIDO_NODE_PRODUCER = 'PLASMIDO_NODE:producer';
const DEFAULT_PRODUCER_STOP_CHECK_TIME_OUT = 500; // TODO move it to configuration

const setProducer = (brokerKafkaInstance: IBrokerKafkaInstance) => {
  const serverInstance = instance.getInstance(brokerKafkaInstance);
  return serverInstance.producer();
};

const shouldStopWorkbook = async (workbookUUID: string) => {
  const executionWorkbook = await executionWorkbookCatalog.findOneByWorkBookUUID(workbookUUID);
  return executionWorkbook.action === WorkBookActions.STOP;
};

const checkArtifactStop = async (interval: Timeout,
                                 producer: Producer,
                                 workbookUUID: string,
                                 executionArtifactId: string,
                                 artifactUUID: string,
                                 brokerKafkaInstance: IBrokerKafkaInstance,
                                 io: Server) => {
  const shouldStopProducer = await shouldStopWorkbook(workbookUUID);
  if (shouldStopProducer) {
    clearInterval(interval);
    await stopProducer(workbookUUID, artifactUUID, io, producer);
    return true;
  }
  return false;
};

const startCheckingProducerStop = (producer: Producer,
                                   workbookUUID: string,
                                   executionArtifactId: string,
                                   artifactUUID: string,
                                   brokerKafkaInstance: IBrokerKafkaInstance,
                                   io: Server) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const interval = setInterval(async () =>
      checkArtifactStop(interval, producer, workbookUUID, executionArtifactId, artifactUUID, brokerKafkaInstance, io),
    DEFAULT_PRODUCER_STOP_CHECK_TIME_OUT);
};


const sendAndEmit = async (artifactUUID: string,
                           producer: Producer,
                           messagePayload: ProducerRecord,
                           io: Server,
                           message: string | undefined) => {
  const send = await producer.send(messagePayload);
  io.sockets.emit(Events.PLASMIDO_OUTPUT_PRODUCER_PRODUCED_EVENT, {
    message: message,
    artifactUUID: artifactUUID
  } as IProducedEvent);
  return send;
};

const prepareMessage = async (index: number,
                              schemaRegistry: SchemaRegistry | undefined,
                              message: string | undefined,
                              schemaId: number | undefined) => {


  message = replaceInternalVariables(message || '', [{variable: '$p_index', value: index.toString()}]);
  message = replaceDynamicVariables(message || '');
  // replaceUserVariables(message || '', []);

  if (schemaRegistry) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const payload = JSON.parse(message || '{}');
    const encodedMessage = await schemaRegistry.encode(schemaId || 0, payload);
    return [{value: encodedMessage}];
  } else {
    return [{value: message}];
  }
};

const sentMessage = async (artifactUUID: string,
                           schemaRegistry: SchemaRegistry | undefined,
                           workbookUUID: string,
                           schemaId: number | undefined,
                           repeat: number,
                           topic: string,
                           message: string | undefined,
                           producer: Producer,
                           io: Server) => {
  const shouldStopProducer = await shouldStopWorkbook(workbookUUID);
  let index = 0;
  while (index < repeat && !shouldStopProducer) {
    const formattedMessage = await prepareMessage(index, schemaRegistry, message, schemaId);
    const messagePayload = {
      topic: topic,
      messages: formattedMessage
    } as ProducerRecord;
    await sendAndEmit(artifactUUID, producer, messagePayload, io, message);
    index++;
  }
};

const stopProducer = async (workbookUUID: string, artifactUUID: string, io: Server, producer: Producer) => {
  await executionArtifactCatalog.updateArtifactStatusToStopped(workbookUUID, artifactUUID, io);
  await producer.disconnect();
};

const subscribeTo = async (schemaRegistry: SchemaRegistry | undefined,
                           schemaId: number | undefined,
                           repeat: number,
                           producer: Producer,
                           topic: string,
                           message: string | undefined,
                           workbookUUID: string,
                           artifactUUID: string,
                           io: Server) => {
  await producer.connect();
  await sentMessage(artifactUUID, schemaRegistry, workbookUUID, schemaId, repeat, topic, message, producer, io);
  await stopProducer(workbookUUID, artifactUUID, io, producer);
};

const subscribeToGlobalErrors = (workbookUUID: string, artifactUUID: string, producer: Producer, io: Server) => {
  const errorTypes = ['unhandledRejection', 'uncaughtException'];
  errorTypes.forEach(type => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.on(type, async (error) => {
      try {
        console.error(PLASMIDO_NODE_PRODUCER, ':subscribeToGlobalErrors:ERROR:', error, workbookUUID, artifactUUID, producer);
        await stopProducer(workbookUUID, artifactUUID, io, producer);
      } catch (_) {
      }
    });
  });
};

export const produce = (schemaRegistry: SchemaRegistry | undefined,
                        executionArtifact: IExecutionArtifact,
                        schemaId: number | undefined,
                        repeat: number,
                        workbookUUID: string,
                        artifactUUID: string,
                        brokerKafkaInstance: IBrokerKafkaInstance,
                        topic: string,
                        message: string | undefined,
                        io: Server) => {
  const producer = setProducer(brokerKafkaInstance);
  subscribeTo(schemaRegistry, schemaId, repeat, producer, topic, message, workbookUUID, artifactUUID, io)
    .catch(error => {
      void (async () => {
        console.error(PLASMIDO_NODE_PRODUCER, ':produce:ERROR:', error, workbookUUID, artifactUUID, brokerKafkaInstance, topic, message);
        await executionArtifactCatalog.updateArtifactStatusToStopped(workbookUUID, artifactUUID, io);
        console.info(PLASMIDO_NODE_PRODUCER, ':produce:ERROR:Updated artifact to stopped:', error, workbookUUID, artifactUUID, brokerKafkaInstance, topic, message);
      })();
    });
  subscribeToGlobalErrors(workbookUUID, artifactUUID, producer, io);
  startCheckingProducerStop(producer, workbookUUID, executionArtifact._id, artifactUUID, brokerKafkaInstance, io);
};
