import Datastore from 'nedb'
import * as database from './database'
import {ISchemaRegistry} from '../interfaces/schemaRegistry/ISchemaRegistry'

let registryDatabase: Datastore<ISchemaRegistry>

export const initSchemaRegistryDatabase = (filePath:string) => {
  registryDatabase = new Datastore({filename: filePath, corruptAlertThreshold: 0, timestampData: true})
  registryDatabase.loadDatabase(err => {
    if (err) {
      console.error('PLASMIDO_NODE:schema-registry-catalog', ':initSchemaRegistryDatabase:DATABASE_ERROR:', err)
    }
  })
}

export const insert = async (registry: ISchemaRegistry) => {
  const query = {...registry}
  return await database.asyncInsert(registryDatabase, query) as ISchemaRegistry
}

export const update = async(currentRegistry: ISchemaRegistry) => {
  const query = {_id: currentRegistry._id || ''}
  const updateQuery = {
    $set: {
      name: currentRegistry.name,
      url: currentRegistry.url,
      securityProtocol: currentRegistry.securityProtocol,
      username: currentRegistry.username,
      password: currentRegistry.password
    },
  }
  return await database.asyncUpdate(registryDatabase, query, updateQuery) as ISchemaRegistry
}

export const findOne = async (id: string) => {
  const query = {_id: id}
  return await database.asyncFindOne(registryDatabase, query) as ISchemaRegistry
}

export const findAll = async () => {
  return await database.asyncFindAllBy(registryDatabase, {}, {createdAt: -1}) as Array<ISchemaRegistry>
}

export const findAllByIds = async (ids: Array<string>) => {
  return await database.asyncFindAllBy(registryDatabase, {_id: { $in: ids} }, {createdAt: 1}) as Array<ISchemaRegistry>
}

export const remove = async (schemaRegistryUUID: string) => {
  void await database.asyncRemove(registryDatabase, {uuid: schemaRegistryUUID})
}

export const removeAll = async () => {
  return await database.asyncRemove(registryDatabase, {})
}

