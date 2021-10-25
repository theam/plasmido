import * as database from './database';
import Datastore from 'nedb';
import {IConsumedEvent} from 'app/src-electron/interfaces/IConsumedEvent';

let executionsConsumedDatabase: Datastore<IConsumedEvent>;

export const initExecutionConsumedDatabase = (filePath: string) => {
  executionsConsumedDatabase = new Datastore({
    filename: filePath,
    corruptAlertThreshold: 0,
    timestampData: true
  });
  executionsConsumedDatabase.loadDatabase(err => {
    if (err) {
      console.error('PLASMIDO_NODE:execution-consumed-catalog', ':initExecutionConsumedDatabase:DATABASE_ERROR:', err);
    }
  });
};

export const update = async (executionConsumed: IConsumedEvent) => {
  const query = {_id: executionConsumed._id};
  const updateQuery = {
    $set: {
      eachMessagePayload: executionConsumed.eachMessagePayload,
      artifactUUID: executionConsumed.artifactUUID,
      plainMessage: executionConsumed.plainMessage
    },
  };
  return database.asyncUpdate(executionsConsumedDatabase, query, updateQuery);
};

function createQuery(filter: string, artifactUUID: string) {
  if (filter) {
    const reg = new RegExp(filter);
    const avroDecodedMessageFilter = {plainMessage: reg, artifactUUID: artifactUUID};
    const messageFilter = {
      artifactUUID: artifactUUID,
      eachMessagePayload: {
        message: {
          value: /filter/
        }
      }
    };
    return { $or: [avroDecodedMessageFilter, messageFilter] } ;
  } else {
    return {artifactUUID: artifactUUID};
  }
}
export const getConsumedAllByArtifact = async (artifactUUID: string, filter: string, skip: number, limit: number) => {
  const query = createQuery(filter, artifactUUID);
  return await database.asyncFindAllByPaginate(executionsConsumedDatabase, query, {createdAt: -1}, skip, limit) as Promise<Array<IConsumedEvent>>;
}

export const getConsumedCountByArtifact = async (artifactUUID: string, filter: string) => {
  const query = createQuery(filter, artifactUUID);
  return await database.asyncCountBy(executionsConsumedDatabase, query) as Promise<number>;
}

export const insert = async (executionArtifact: IConsumedEvent) => {
  const query = {...executionArtifact};
  return await database.asyncInsert(executionsConsumedDatabase, query) as IConsumedEvent;
};

export const removeAll = async () => {
  await database.asyncRemove(executionsConsumedDatabase, {});
  return true;
};

export const compact = () => {
  database.compact(executionsConsumedDatabase);
};

