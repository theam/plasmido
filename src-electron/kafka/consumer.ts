import * as instance from './kafka-instance'
import {cloneDeep} from 'lodash'
import {Events} from '../enums/Events'
import * as executionWorkbookCatalog from '../nedb/execution-workbook-catalog'
import * as executionArtifactCatalog from '../nedb/execution-artifact-catalog'
import * as executionConsumedCatalog from '../nedb/execution-consumed-catalog'
import {Server} from 'socket.io'
import {Consumer, ConsumerSubscribeTopic, IHeaders, KafkaMessage} from 'kafkajs'
import {WorkBookActions} from '../enums/WorkBookActions'
import {IConsumedEvent} from '../interfaces/IConsumedEvent'
import {IBrokerKafkaInstance} from '../interfaces/broker/IBrokerKafkaInstance'
import {deleteConsumerGroups, listGroups, setOffsetsToTimestamp} from './admin'
import {IExecutionArtifact} from 'app/src-electron/interfaces/executions/IExecutionArtifact'
import {SchemaRegistry} from '@theagilemonkeys/plasmido-schema-registry'
import {IConsumedEventElement} from '../interfaces/IConsumedEventElement'
import {IArtifact} from '../interfaces/workbooks/IArtifact'
import {ConsumeFromType} from '../enums/ConsumeFromType'
import Timeout = NodeJS.Timeout;

const PLASMIDO_NODE_CONSUMER = 'PLASMIDO_NODE:consumer'

const DEFAULT_CONSUMER_STOP_CHECK_TIME_OUT = 500

const getGroupId = (executionArtifactId: string) => `PLASMIDO-${executionArtifactId}`

const setConsumer = (executionArtifact: IExecutionArtifact,
                     brokerKafkaInstance: IBrokerKafkaInstance) => {
  const serverInstance = instance.getInstance(brokerKafkaInstance)
  return serverInstance.consumer({groupId: getGroupId(executionArtifact._id)})
}

const decodeMessage = async (message: KafkaMessage,
                             schemaRegistry: SchemaRegistry | undefined) => {
  let plainMessage = ''
  if (message && message.value && message.value instanceof Buffer) {
    if (schemaRegistry) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await schemaRegistry.decode(message.value)
      plainMessage = JSON.stringify(result)
    } else {
      plainMessage = new TextDecoder().decode(message.value)
    }
  }
  return plainMessage
}

const decodedHeaders = (message: KafkaMessage) => {
  let plainHeaders: IHeaders = {}
  if (message && message.headers) {
    const headers = message.headers
    plainHeaders = cloneDeep(headers)
    Object.keys(headers).forEach((key: keyof IHeaders) => {
      const value = headers[key] || ''
      if (value instanceof Buffer) {
        plainHeaders[key] = new TextDecoder().decode(value)
      } else {
        plainHeaders[key] = value
      }
    })
  }
  return plainHeaders
}


const consumerRun = (schemaRegistry: SchemaRegistry | undefined,
                     consumer: Consumer,
                     io: Server,
                     artifact: IArtifact) => {
  void consumer.run({
    eachMessage: async (eachMessagePayload) => {
      const {message: message} = eachMessagePayload
      const plainMessage = await decodeMessage(message, schemaRegistry)
      const plainHeaders = decodedHeaders(message)
      const consumed = {
        eachMessagePayload: eachMessagePayload,
        artifactUUID: artifact.uuid,
        plainMessage: plainMessage,
        plainHeaders: plainHeaders
      } as IConsumedEvent

      await executionConsumedCatalog.insert(consumed)
      io.sockets.emit(Events.PLASMIDO_OUTPUT_CONSUMER_CONSUMED_EVENT, {artifactUUID: artifact.uuid} as IConsumedEventElement)
    },
  })
}

const subscribeTo = async (schemaRegistry: SchemaRegistry | undefined,
                           consumer: Consumer,
                           workbookUUID: string,
                           artifact: IArtifact,
                           executionArtifact: IExecutionArtifact,
                           brokerKafkaInstance: IBrokerKafkaInstance,
                           startAt: number,
                           io: Server) => {
  await consumer.connect()
  const {topicName: topic, consumeFrom: from} = artifact
  const subscribeOptions = {topic: topic} as ConsumerSubscribeTopic
  subscribeOptions.fromBeginning = from === ConsumeFromType.BEGINNING
  await consumer.subscribe(subscribeOptions)
  if (!subscribeOptions.fromBeginning) {
    await setOffsetsToTimestamp(topic, brokerKafkaInstance, getGroupId(executionArtifact._id), startAt)
  }
  return consumerRun(schemaRegistry, consumer, io, artifact)
}

const shouldStopWorkbook = async (workbookUUID: string) => {
  const executionWorkbook = await executionWorkbookCatalog.findOneByWorkBookUUID(workbookUUID)
  if (executionWorkbook === undefined) {
    return true
  }
  return executionWorkbook?.action === WorkBookActions.STOP
}

const stopConsumer = async (workbookUUID: string, executionArtifactId: string, artifact: IArtifact, io: Server, consumer: Consumer, brokerKafkaInstance: IBrokerKafkaInstance) => {
  await executionArtifactCatalog.updateArtifactStatusToStopped(workbookUUID, artifact.uuid, io)
  const groupId = getGroupId(executionArtifactId)
  await consumer.stop()
  await consumer.disconnect()
  const groups = await listGroups(brokerKafkaInstance)
  await deleteConsumerGroups(brokerKafkaInstance, [groupId])
}

const checkArtifactStop = async (interval: Timeout,
                                 consumer: Consumer,
                                 workbookUUID: string,
                                 executionArtifactId: string,
                                 artifact: IArtifact,
                                 brokerKafkaInstance: IBrokerKafkaInstance,
                                 io: Server) => {
  const shouldStopConsumer = await shouldStopWorkbook(workbookUUID)
  if (shouldStopConsumer) {
    clearInterval(interval)
    await stopConsumer(workbookUUID, executionArtifactId, artifact, io, consumer, brokerKafkaInstance)
  }
}

const subscribeToGlobalErrors = (workbookUUID: string, executionArtifactId: string, artifact: IArtifact, consumer: Consumer, brokerKafkaInstance: IBrokerKafkaInstance, io: Server) => {
  const errorTypes = ['unhandledRejection', 'uncaughtException']
  errorTypes.forEach(type => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.on(type, async error => {
      try {
        console.error(PLASMIDO_NODE_CONSUMER, ':subscribeToGlobalErrors:ERROR:', error, workbookUUID, artifact.uuid, consumer)
        await stopConsumer(workbookUUID, executionArtifactId, artifact, io, consumer, brokerKafkaInstance)
      } catch (_) {
      }
    })
  })
}

const startCheckingConsumerStop = (consumer: Consumer,
                                   workbookUUID: string,
                                   executionArtifactId: string,
                                   artifact: IArtifact,
                                   brokerKafkaInstance: IBrokerKafkaInstance,
                                   io: Server) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const interval = setInterval(async () =>
      checkArtifactStop(interval, consumer, workbookUUID, executionArtifactId, artifact, brokerKafkaInstance, io),
    DEFAULT_CONSUMER_STOP_CHECK_TIME_OUT)
}

export const consume = (schemaRegistry: SchemaRegistry | undefined,
                        executionArtifact: IExecutionArtifact,
                        workbookUUID: string,
                        artifact: IArtifact,
                        brokerKafkaInstance: IBrokerKafkaInstance,
                        startAt: number,
                        io: Server) => {
  const consumer = setConsumer(executionArtifact, brokerKafkaInstance)
  subscribeTo(schemaRegistry, consumer, workbookUUID, artifact, executionArtifact, brokerKafkaInstance, startAt, io)
    .catch(error => {
      void (async () => {
        console.error(PLASMIDO_NODE_CONSUMER, ':consume:ERROR:', error, workbookUUID, artifact.uuid, brokerKafkaInstance, artifact.topicName)
        await executionArtifactCatalog.updateArtifactStatusToStopped(workbookUUID, artifact.uuid, io)
        console.error(PLASMIDO_NODE_CONSUMER, ':consume:ERROR:Updated artifact to stopped:', error, workbookUUID, artifact.uuid, brokerKafkaInstance, artifact.topicName)
      })()
    })
  subscribeToGlobalErrors(workbookUUID, executionArtifact._id, artifact, consumer, brokerKafkaInstance, io)
  startCheckingConsumerStop(consumer, workbookUUID, executionArtifact._id, artifact, brokerKafkaInstance, io)
  return consumer
}
