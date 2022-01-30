import * as database from './database'
import Datastore from 'nedb'
import {Server} from 'socket.io'
import {WorkBookStatus} from '../enums/WorkBookStatus'
import {IExecutionArtifact} from 'app/src-electron/interfaces/executions/IExecutionArtifact'

let executionsArtifactDatabase: Datastore<IExecutionArtifact>

export const initExecutionDatabase = (filePath:string) => {
  executionsArtifactDatabase = new Datastore({
    filename: filePath,
    corruptAlertThreshold: 0,
    timestampData: true
  })
  executionsArtifactDatabase.loadDatabase(err => {
    if (err) {
      console.error('PLASMIDO_NODE:execution-artifact-catalog', ':initExecutionDatabase:DATABASE_ERROR:', err)
    }
  })
}

export const update = async (executionArtifact: IExecutionArtifact) => {
  const query = {_id: executionArtifact._id}
  const updateQuery = {
    $set: {
      workbookUUID: executionArtifact.workbookUUID,
      artifactUUID: executionArtifact.artifactUUID,
      status: executionArtifact.status
    },
  }
  return await database.asyncUpdate(executionsArtifactDatabase, query, updateQuery)
}

export const findOneByWorkBookUUIDAndArtifactId = async (workbookUUID: string, artifactUUID: string) => {
  const query = {workbookUUID: workbookUUID, artifactUUID: artifactUUID}
  return await database.asyncFindFirstBy(executionsArtifactDatabase, query, {createdAt: -1}) as IExecutionArtifact
}

export const updateArtifactStatusTo = async (workbookUUID: string, io: Server, artifactUUID: string, status: WorkBookStatus) => {
  const artifact = await findOneByWorkBookUUIDAndArtifactId(workbookUUID, artifactUUID)
  if (artifact) {
    artifact.status = status
    return await update(artifact) as IExecutionArtifact
  }
  return artifact
}

export const updateArtifactStatusToStopped = async (workbookUUID: string, artifactId: string, io: Server) => {
  return updateArtifactStatusTo(workbookUUID, io, artifactId, WorkBookStatus.STOPPED)
}

export const findAllByWorkBookUUID = async (workbookUUID: string) => {
  const query = {workbookUUID: workbookUUID}
  return await database.asyncFindAllBy(executionsArtifactDatabase, query, {createdAt: -1})
}

export const insert = async (executionArtifact: IExecutionArtifact) => {
  const query = {...executionArtifact}
  return await database.asyncInsert(executionsArtifactDatabase, query) as IExecutionArtifact
}

export const findOne = async (id: string) => {
  const query = {_id: id}
  return await database.asyncFindOne(executionsArtifactDatabase, query)
}

export const removeAll = async () => {
  await database.asyncRemove(executionsArtifactDatabase, {})
  return true
}

