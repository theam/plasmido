/* eslint-disable @typescript-eslint/no-explicit-any */
import Nedb from 'nedb';
import path from 'path';
import {remote} from 'electron';

const DATABASE_FOLDER = '/db/';

export const getDatabasePath = (fileName:string) => {
  const filePath = DATABASE_FOLDER + fileName;
  if (process.env.DEV) {
    return '.' + filePath;
  }
  return path.join(remote.app.getPath('userData'), DATABASE_FOLDER + fileName);
}

export const asyncFindFirstBy = (db: Nedb, query: any, sort: any) => {
  return new Promise((resolve, reject) => {
    db.find(query).sort(sort).limit(1).exec((error, result) => {
      if (error == null) {
        resolve(result.pop());
      } else {
        reject(error);
      }
    });
  });
};

export const asyncInsert = (db: Nedb, row: unknown) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  if (row.hasOwnProperty('_id')) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    row._id = undefined;
  }
  return new Promise((resolve, reject) => {
    db.insert(row, (error, result) => {
      error == null ? resolve(result) : reject(error);
    });
  });
}

export const asyncUpdate = (db: Nedb, query: any, updateQuery: any) => {
  return new Promise((resolve, reject) => {
    db.update(query, updateQuery, {returnUpdatedDocs: true},
      (error, affected, result) => {
        error == null ? resolve(result) : reject(error);
      });
  });
};

export const asyncFindOne = (db: Nedb, query: any) => {
  return new Promise((resolve, reject) => {
    db.findOne(query, (error, result) => {
      error == null ? resolve(result) : reject(error);
    });
  });
};

export const asyncFindAllBy = (db: Nedb, query: any, sort: any) => {
  return new Promise((resolve, reject) => {
    db.find(query).sort(sort).exec((error, result) => {
      error == null ? resolve(result) : reject(error);
    });
  });
};

export const asyncRemove = (db: Nedb, query: any) => new Promise((resolve, reject) => {
  db.remove(query, {multi: true}, (error, result) => {
    error == null ? resolve(result) : reject(error);
  });
});


