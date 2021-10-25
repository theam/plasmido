import Datastore from 'nedb';
import * as database from './database';
import {IUser} from '../interfaces/user/IUser';

let usersDatabase: Datastore<IUser>;

export const initUserDatabase = (filePath:string) => {
  usersDatabase = new Datastore({filename: filePath, corruptAlertThreshold: 0, timestampData: true});
  usersDatabase.loadDatabase(err => {
    if (err) {
      console.error('PLASMIDO_NODE:user-catalog', ':initUserDatabase:DATABASE_ERROR:', err);
    }
  });
};

export const insert = async (user: IUser) => {
  const query = {...user};
  return await database.asyncInsert(usersDatabase, query) as IUser;
};

export const update = async(currentUser: IUser) => {
  const query = {_id: currentUser._id || ''};
  const updateQuery = {
    $set: {
      name: currentUser.name,
      isDefault: currentUser.isDefault,
      selectedEnvironmentUUID: currentUser.selectedEnvironmentUUID
    },
  };
  return await database.asyncUpdate(usersDatabase, query, updateQuery) as IUser;
}

export const findOne = async (id: string) => {
  const query = {_id: id};
  return await database.asyncFindOne(usersDatabase, query) as IUser;
};

export const findDefaultUser = async () => {
  const query = {isDefault: true};
  return await database.asyncFindOne(usersDatabase, query) as IUser;
};

export const findAll = async () => {
  return await database.asyncFindAllBy(usersDatabase, {}, {createdAt: 1}) as Array<IUser>;
};

export const remove = async (userUUID: string) => {
  void await database.asyncRemove(usersDatabase, {uuid: userUUID});
};

export const removeAll = async () => {
  return await database.asyncRemove(usersDatabase, {});
};

