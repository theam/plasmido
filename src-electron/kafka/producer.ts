import * as instance from './kafka-instance';
import {Server} from 'socket.io';
import {Message, Producer, ProducerRecord} from 'kafkajs';
import * as executionArtifactCatalog from '../nedb/execution-artifact-catalog';
import {IBrokerKafkaInstance} from 'app/src-electron/interfaces/broker/IBrokerKafkaInstance';
import {Events} from '../enums/Events';
import * as executionWorkbookCatalog from '../nedb/execution-workbook-catalog';
import {WorkBookActions} from '../enums/WorkBookActions';
import {IExecutionArtifact} from '../interfaces/executions/IExecutionArtifact';
import {
  replaceDynamicVariables,
  replaceInternalVariables,
  replaceUserVariables,
} from '../environment/variables';
import {SchemaRegistry} from '@theagilemonkeys/plasmido-schema-registry';
import {IArtifact} from 'app/src-electron/interfaces/workbooks/IArtifact';
import Timeout = NodeJS.Timeout;
import {IProducedEventElement} from 'app/src-electron/interfaces/IProducedEventElement';
import {Replaceable} from 'app/src-electron/interfaces/environment/Replaceable';

const PLASMIDO_NODE_PRODUCER = 'PLASMIDO_NODE:producer';
const DEFAULT_PRODUCER_STOP_CHECK_TIME_OUT = 500;

const setProducer = (brokerKafkaInstance: IBrokerKafkaInstance) => {
  const serverInstance = instance.getInstance(brokerKafkaInstance);
  return serverInstance.producer();
};

const shouldStopWorkbook = async (workbookUUID: string) => {
  const executionWorkbook = await executionWorkbookCatalog.findOneByWorkBookUUID(workbookUUID);
  if (executionWorkbook === undefined) {
    return true;
  }
  return executionWorkbook?.action === WorkBookActions.STOP;
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
                           io: Server) => {
  const send = await producer.send(messagePayload);
  io.sockets.emit(Events.PLASMIDO_OUTPUT_PRODUCER_PRODUCED_EVENT, {
    size: messagePayload.messages?.length,
    artifactUUID: artifactUUID
  } as IProducedEventElement);
  return send;
};

const prepareValue = (value: string, index: number, userVariables: Array<Replaceable>) => {
  let newValue = replaceInternalVariables(value || '', [{variable: '$p_index', value: index.toString()}]);
  newValue = replaceDynamicVariables(newValue || '');
  return replaceUserVariables(newValue || '', userVariables);
};

const prepareMessage = async (index: number,
                              schemaRegistry: SchemaRegistry | undefined,
                              artifact: IArtifact,
                              userVariables: Array<Replaceable>) => {
  const {payload: payload, payloadSchema: schema, headers: headers} = artifact;
  const value = prepareValue(payload || '', index, userVariables);
  const preparedHeaders = {...headers};
  for (const headersKey in headers) {
    const headerValue = headers[headersKey];
    if (typeof headerValue === 'string') {
      preparedHeaders[headersKey] = prepareValue(headerValue, index, userVariables);
    }
  }

  if (schemaRegistry) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const preparedPayload = JSON.parse(value || '{}');
    const encodedMessage = await schemaRegistry.encode(schema.schemaId || 0, preparedPayload);
    return {value: encodedMessage, headers: preparedHeaders} as Message;
  } else {
    return {value: value, headers: preparedHeaders} as Message;
  }
};

const sentMessage = async (schemaRegistry: SchemaRegistry | undefined,
                           workbookUUID: string,
                           producer: Producer,
                           artifact: IArtifact,
                           io: Server,
                           userVariables: Array<Replaceable>) => {
  const shouldStopProducer = await shouldStopWorkbook(workbookUUID);
  const repeat = parseInt(String(artifact.repeatTimes)) || 0;
  let index = 0;
  let batchIndex = 0;
  const messages: Message[] = [];
  const batchSize = parseInt(String(artifact.batchSize));
  if (batchSize > repeat) {
    artifact.batchSize = repeat;
  }
  while (index < repeat && !shouldStopProducer) {
    const formattedMessage = await prepareMessage(index, schemaRegistry, artifact, userVariables);
    messages.push(formattedMessage);
    index++;
    batchIndex++;
    if ((batchIndex >= batchSize) || index === repeat) {
      batchIndex = 0;
      const messagePayload = {
        topic: artifact.topicName,
        messages: messages,
      } as ProducerRecord;
      await sendAndEmit(artifact.uuid, producer, messagePayload, io);
      messages.length = 0;
    }
  }
};

const stopProducer = async (workbookUUID: string, artifactUUID: string, io: Server, producer: Producer) => {
  await executionArtifactCatalog.updateArtifactStatusToStopped(workbookUUID, artifactUUID, io);
  await producer.disconnect();
};

const subscribeTo = async (schemaRegistry: SchemaRegistry | undefined,
                           producer: Producer,
                           workbookUUID: string,
                           artifact: IArtifact,
                           io: Server,
                           userVariables: Array<Replaceable>) => {
  await producer.connect();
  await sentMessage(schemaRegistry, workbookUUID, producer, artifact, io, userVariables);
  await stopProducer(workbookUUID, artifact.uuid, io, producer);
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
                        workbookUUID: string,
                        brokerKafkaInstance: IBrokerKafkaInstance,
                        artifact: IArtifact,
                        io: Server,
                        userVariables: Array<Replaceable>) => {
  const producer = setProducer(brokerKafkaInstance);
  const {uuid: artifactUUID, topicName: topic, payload: message} = artifact;
  subscribeTo(schemaRegistry, producer, workbookUUID, artifact, io, userVariables)
    .catch(error => {
      void (async () => {
        console.error(PLASMIDO_NODE_PRODUCER, ':produce:ERROR:', error, workbookUUID, artifactUUID, brokerKafkaInstance, topic, message);
        await executionArtifactCatalog.updateArtifactStatusToStopped(workbookUUID, artifactUUID, io);
        console.info(PLASMIDO_NODE_PRODUCER, ':produce:ERROR:Updated artifact to stopped:', error, workbookUUID, artifactUUID, brokerKafkaInstance, topic, message);
      })();
    });
  subscribeToGlobalErrors(workbookUUID, artifactUUID, producer, io);
  startCheckingProducerStop(producer, workbookUUID, executionArtifact._id, artifactUUID, brokerKafkaInstance, io);
  return producer;
};
