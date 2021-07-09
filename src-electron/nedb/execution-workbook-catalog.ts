import * as database from './database';
import Datastore from 'nedb';
import * as executionArtifactCatalog from './execution-artifact-catalog'
import {WorkBookStatus} from '../enums/WorkBookStatus';
import {WorkBookActions} from '../enums/WorkBookActions';
import {IExecutionWorkbook} from 'app/src-electron/interfaces/executions/IExecutionWorkbook';
import {IExecutionArtifact} from 'app/src-electron/interfaces/executions/IExecutionArtifact';

let executionsWorkbookDatabase: Datastore<IExecutionWorkbook>;

export const initExecutionDatabase = (filePath:string) => {
  executionsWorkbookDatabase = new Datastore({
    filename: filePath,
    corruptAlertThreshold: 0,
    timestampData: true
  });
  executionsWorkbookDatabase.loadDatabase(err => {
    if (err) {
      console.error('PLASMIDO_NODE:execution-workbook-catalog', ':initExecutionDatabase:DATABASE_ERROR:', err);
    }
  });
};

export const anyArtifactsFromWorkbookRunning = async (workbookUUID: string) => {
  const artifacts = await executionArtifactCatalog.findAllByWorkBookUUID(workbookUUID) as Array<IExecutionArtifact>;
  if (artifacts === null) {
    return false;
  }
  const runningArtifacts = artifacts.filter(artifact => artifact.status === WorkBookStatus.RUNNING);
  return runningArtifacts && runningArtifacts.length > 0;
};

export const allArtifactsFromWorkbookStopped = async (workbookUUID: string) => !(await anyArtifactsFromWorkbookRunning(workbookUUID));

export const findOneByWorkBookUUID = async (workbookUUID: string) => {
  const query = {workbookUUID: workbookUUID};
  return await database.asyncFindFirstBy(executionsWorkbookDatabase, query, {createdAt: -1}) as IExecutionWorkbook;
};

export const updateWorkbookActionToStop = async (workbookUUID: string) => {
  const executionWorkbook = await findOneByWorkBookUUID(workbookUUID);
  executionWorkbook.action = WorkBookActions.STOP;
  return update(executionWorkbook);
};

export const insert = async (executionWorkbook: IExecutionWorkbook) => {
  const query = {...executionWorkbook};
  return await database.asyncInsert(executionsWorkbookDatabase, query) as IExecutionWorkbook;
};

export const update = async (executionWorkbook: IExecutionWorkbook) => {
  const query = {_id: executionWorkbook._id};
  const updateQuery = {
    $set: {
      workbookUUID: executionWorkbook.workbookUUID,
      action: executionWorkbook.action
    },
  };
  return await database.asyncUpdate(executionsWorkbookDatabase, query, updateQuery) as IExecutionWorkbook;
};

export const findOne = async (id: string) => {
  const query = {_id: id};
  return await database.asyncFindOne(executionsWorkbookDatabase, query);
};

export const removeAll = async () => {
  return await database.asyncRemove(executionsWorkbookDatabase, {});
};

