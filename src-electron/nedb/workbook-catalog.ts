import * as database from './database';
import Datastore from 'nedb';
import {IWorkbook} from 'app/src-electron/interfaces/workbooks/IWorkbook';

let workbooksDatabase: Datastore<IWorkbook>;

export const initWorkbookDatabase = (filePath:string) => {
  workbooksDatabase = new Datastore({filename: filePath, corruptAlertThreshold: 0, timestampData: true});
  workbooksDatabase.loadDatabase(err => {
    if (err) {
      console.error('PLASMIDO_NODE:workbook-catalog', ':initWorkbookDatabase:DATABASE_ERROR:', err);
    }
  });
};

export const insert = async (workbook: IWorkbook) => {
  const query = {...workbook};
  return await database.asyncInsert(workbooksDatabase, query) as IWorkbook;
};

export const update = async (workbook: IWorkbook) => {
  const query = {_id: workbook._id};
  const updateQuery = {
    $set: {
      name: workbook.name,
      action: workbook.action,
      status: workbook.status,
      artifacts: workbook.artifacts
    },
  };
  return await database.asyncUpdate(workbooksDatabase, query, updateQuery) as IWorkbook;
};

export const findOne = async (id: string) => {
  const query = {_id: id};
  return await database.asyncFindOne(workbooksDatabase, query) as IWorkbook;
};

export const findAll = async () => {
  return await database.asyncFindAllBy(workbooksDatabase, {}, {createdAt: 1}) as Array<IWorkbook>;
};

export const removeAll = async () => {
  return await database.asyncRemove(workbooksDatabase, {});
};

