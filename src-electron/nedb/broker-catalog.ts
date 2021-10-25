import Datastore from 'nedb';
import * as database from './database';
import {IBroker} from '../interfaces/broker/IBroker';

let brokersDatabase: Datastore<IBroker>;

export const initBrokerDatabase = (filePath:string) => {
  brokersDatabase = new Datastore({filename: filePath, corruptAlertThreshold: 0, timestampData: true});
  brokersDatabase.loadDatabase(err => {
    if (err) {
      console.error('PLASMIDO_NODE:broker-catalog', ':initBrokerDatabase:DATABASE_ERROR:', err);
    }
  });
};

export const insert = async (broker: IBroker) => {
  const query = {...broker};
  return await database.asyncInsert(brokersDatabase, query) as IBroker;
};

export const updateSimple = async(currentBroker: IBroker) => {
  const query = {_id: currentBroker._id || ''};
  const updateQuery = {
    $set: {
      name: currentBroker.name,
      url: currentBroker.url,
      protocol: currentBroker.protocol,
      ssl_enabled: currentBroker.ssl_enabled,
      rejectUnauthorized: currentBroker.rejectUnauthorized,
      username: currentBroker.username,
      password: currentBroker.password,
      authorizationIdentity: currentBroker.authorizationIdentity,
      accessKeyId: currentBroker.accessKeyId,
      secretAccessKey: currentBroker.secretAccessKey,
      sessionToken: currentBroker.sessionToken,
    },
  };
  return await database.asyncUpdate(brokersDatabase, query, updateQuery) as IBroker;
}

export const update = async (configurationId: string, currentBroker: IBroker) => {
  const query = {_id: configurationId};
  const updateQuery = {
    $set: {
      name: currentBroker.name,
      url: currentBroker.url,
      protocol: currentBroker.protocol,
      ssl_enabled: currentBroker.ssl_enabled,
      rejectUnauthorized: currentBroker.rejectUnauthorized,
      username: currentBroker.username,
      password: currentBroker.password,
      authorizationIdentity: currentBroker.authorizationIdentity,
      accessKeyId: currentBroker.accessKeyId,
      secretAccessKey: currentBroker.secretAccessKey,
      sessionToken: currentBroker.sessionToken,
    },
  };
  return await database.asyncUpdate(brokersDatabase, query, updateQuery) as IBroker;
};

export const findOne = async (id: string) => {
  const query = {_id: id};
  return await database.asyncFindOne(brokersDatabase, query) as IBroker;
};

export const findAll = async () => {
  return await database.asyncFindAllBy(brokersDatabase, {}, {createdAt: 1}) as Array<IBroker>;
};

export const remove = async (brokerUUID: string) => {
  void await database.asyncRemove(brokersDatabase, {uuid: brokerUUID});
};

export const removeAll = async () => {
  return await database.asyncRemove(brokersDatabase, {});
};

