import Datastore from 'nedb';
import * as database from './database';
import {IEnvironment} from 'src/interfaces/environment/IEnvironment';

let environmentDatabase: Datastore<IEnvironment>;

export const initEnvironmentDatabase = (filePath:string) => {
  environmentDatabase = new Datastore({filename: filePath, corruptAlertThreshold: 0, timestampData: true});
  environmentDatabase.loadDatabase(err => {
    if (err) {
      console.error('PLASMIDO_NODE:environment-catalog', ':initEnvironmentDatabase:DATABASE_ERROR:', err);
    }
  });
};

export const insert = async (environment: IEnvironment) => {
  const query = {...environment};
  return await database.asyncInsert(environmentDatabase, query) as IEnvironment;
};

// TODO remove update and rename this one to update
export const updateSimple = async(currentEnvironment: IEnvironment) => {
  const query = {_id: currentEnvironment._id || ''};
  const updateQuery = {
    $set: {
      uuid: currentEnvironment.uuid,
      name: currentEnvironment.name,
      variables: currentEnvironment.variables
    },
  };
  return await database.asyncUpdate(environmentDatabase, query, updateQuery) as IEnvironment;
}

export const update = async (environmentId: string, currentEnvironment: IEnvironment) => {
  const query = {_id: environmentId};
  const updateQuery = {
    $set: {
      name: currentEnvironment.name
    },
  };
  return await database.asyncUpdate(environmentDatabase, query, updateQuery) as IEnvironment;
};

export const findOne = async (id: string) => {
  const query = {_id: id};
  return await database.asyncFindOne(environmentDatabase, query) as IEnvironment;
};

export const findAll = async () => {
  return await database.asyncFindAllBy(environmentDatabase, {}, {createdAt: 1}) as Array<IEnvironment>;
};

export const removeAll = async () => {
  return database.asyncRemove(environmentDatabase, {});
};

