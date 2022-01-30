import {Events} from '../enums/Events'
import * as producer from './producer'
import * as consumer from './consumer'
import * as brokerCatalog from '../nedb/broker-catalog'
import * as executionWorkbookCatalog from '../nedb/execution-workbook-catalog'
import * as executionArtifactCatalog from '../nedb/execution-artifact-catalog'
import * as executionConsumedCatalog from '../nedb/execution-consumed-catalog'
import {Server} from 'socket.io'
import {WorkBookStatus} from '../enums/WorkBookStatus'
import {WorkBookActions} from '../enums/WorkBookActions'
import {ArtifactType} from '../enums/ArtifactType'
import {IExecutionWorkbook} from '../interfaces/executions/IExecutionWorkbook'
import {IExecutionArtifact} from '../interfaces/executions/IExecutionArtifact'
import {IArtifact} from '../interfaces/workbooks/IArtifact'
import {IWorkbook} from '../interfaces/workbooks/IWorkbook'
import {IBrokerKafkaInstance} from '../interfaces/broker/IBrokerKafkaInstance'
import {IExecutionStart} from '../interfaces/executions/IExecutionStart'
import {connectAllSchemaRegistries} from '../kafka/schemaRegistry'
import {SchemaRegistry} from '@theagilemonkeys/plasmido-schema-registry'
import {ArtifactSchemaType} from '../enums/ArtifactSchemaType'
import Timeout = NodeJS.Timeout;
import {defaultUserVariables, replaceUserVariables} from '../environment/variables'
import {Replaceable} from '../interfaces/environment/Replaceable'

const DEFAULT_WORKBOOK_STOP_CHECK_TIME_OUT = 1000

const brokerToBrokerKafkaInstance = async (artifact: IArtifact, userVariables: Array<Replaceable>) => {
  const broker = await brokerCatalog.findOne(artifact.brokerId)
  broker.url = replaceUserVariables(broker.url || '', userVariables)
  const connectionOptions = {
    ssl: {
      enabled: broker.ssl_enabled,
      rejectUnauthorized: broker.rejectUnauthorized
    },
    sasl: {
      protocol: broker.protocol,
      username: broker.username,
      password: broker.password,
      authorizationIdentity: broker.authorizationIdentity,
      accessKeyId: broker.accessKeyId,
      secretAccessKey: broker.secretAccessKey,
      sessionToken: broker.sessionToken,
    }
  }
  return {
    brokerList: broker.url,
    options: connectionOptions
  } as IBrokerKafkaInstance
}

const startProducer = async (schemaRegistry: SchemaRegistry | undefined,
                             executionArtifact: IExecutionArtifact,
                             artifact: IArtifact,
                             workbook: IWorkbook,
                             io: Server,
                             userVariables: Array<Replaceable>) => {
  const brokerKafkaInstance = await brokerToBrokerKafkaInstance(artifact, userVariables)
  producer.produce(schemaRegistry, executionArtifact, workbook.uuid, brokerKafkaInstance, artifact, io, userVariables)
}

const startConsumer = async (schemaRegistry: SchemaRegistry | undefined,
                             executionArtifact: IExecutionArtifact,
                             artifact: IArtifact,
                             workbook: IWorkbook,
                             io: Server,
                             userVariables: Array<Replaceable>) => {
  const brokerKafkaInstance = await brokerToBrokerKafkaInstance(artifact, userVariables)
  const startAt = Date.now()
  consumer.consume(schemaRegistry, executionArtifact, workbook.uuid, artifact, brokerKafkaInstance, startAt, io)
}

const stopWorkbook = async (workbookUUID: string, io: Server) => {
  const executionWorkbook = await executionWorkbookCatalog.updateWorkbookActionToStop(workbookUUID)
  io.sockets.emit(Events.PLASMIDO_OUTPUT_WORKBOOK_STOPPED, workbookUUID)
  return executionWorkbook
}

const checkWorkbookStop = async (interval: Timeout, workbookUUID: string, io: Server) => {
  const allStopped = await executionWorkbookCatalog.allArtifactsFromWorkbookStopped(workbookUUID)
  if (allStopped) {
    clearInterval(interval)
    await stopWorkbook(workbookUUID, io)
  }
}

const createExecutionWorkbookFromWorkbook = async (workbook: IWorkbook) => {
  const executionWorkbook = {
    workbookUUID: workbook.uuid,
    action: WorkBookActions.RUN
  } as IExecutionWorkbook

  return executionWorkbookCatalog.insert(executionWorkbook)
}

const createExecutionArtifactsFromWorkbook = async (workbook: IWorkbook) => {
  const artifactsToInsert = workbook.artifacts.map(artifact => {
    const executionArtifact = {
      workbookUUID: workbook.uuid,
      artifactUUID: artifact.uuid,
      status: WorkBookStatus.RUNNING
    } as IExecutionArtifact

    return executionArtifactCatalog.insert(executionArtifact)
  })

  return Promise.all(artifactsToInsert)
}

const startArtifactsFromWorkbook = async (schemaRegistries: Map<string, SchemaRegistry>,
                                          executionArtifacts: IExecutionArtifact[],
                                          workbook: IWorkbook, io: Server,
                                          userVariables: Array<Replaceable>) => {
  for (const artifact of workbook.artifacts.filter(value => value.type === ArtifactType.CONSUMER)) {
    const executionArtifact = executionArtifacts.find(execution => execution.artifactUUID === artifact.uuid)
    if (executionArtifact) {
      let schemaRegistry = undefined
      if (artifact.schemaType !== ArtifactSchemaType.PLAIN) {
        const schemaRegistryId = artifact.payloadSchema?.schemaRegistryId
        if (schemaRegistryId) {
          schemaRegistry = schemaRegistries.get(schemaRegistryId)
        }
      }
      await startConsumer(schemaRegistry, executionArtifact, artifact, workbook, io, userVariables)
    }
  }

  workbook.artifacts.filter(value => value.type === ArtifactType.PRODUCER).forEach(artifact => {
    let schemaRegistry = undefined
    if (artifact.schemaType !== ArtifactSchemaType.PLAIN) {
      const schemaRegistryId = artifact.payloadSchema?.schemaRegistryId
      if (schemaRegistryId) {
        schemaRegistry = schemaRegistries.get(schemaRegistryId)
      }
    }
    const executionArtifact = executionArtifacts.find(execution => execution.artifactUUID === artifact.uuid)
    if (executionArtifact) {
      void startProducer(schemaRegistry, executionArtifact, artifact, workbook, io, userVariables)
    }
  })
}

const startCheckingWorkbookStop = (workbook: IWorkbook, io: Server) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const interval = setInterval(async () =>
      checkWorkbookStop(interval, workbook.uuid, io)
    , DEFAULT_WORKBOOK_STOP_CHECK_TIME_OUT)
}

export const start = async (workbook: IWorkbook, io: Server) => {
  const executionWorkbook = await createExecutionWorkbookFromWorkbook(workbook)
  const executionArtifacts = await createExecutionArtifactsFromWorkbook(workbook)
  const userVariables = await defaultUserVariables()
  const schemaRegistries = await connectAllSchemaRegistries(workbook, userVariables) as Map<string, SchemaRegistry>
  await executionConsumedCatalog.removeAll()
  executionConsumedCatalog.compact()
  await startArtifactsFromWorkbook(schemaRegistries, executionArtifacts, workbook, io, userVariables)
  startCheckingWorkbookStop(workbook, io)

  io.sockets.emit(Events.PLASMIDO_OUTPUT_WORKBOOK_STARTED, workbook.uuid)
  return {executionWorkbook: executionWorkbook, executionArtifacts: executionArtifacts} as IExecutionStart
}

export const stop = async (workbook: IWorkbook, io: Server) => {
  return stopWorkbook(workbook.uuid, io)
}
