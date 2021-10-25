/* eslint-disable @typescript-eslint/no-misused-promises */
import {Socket} from 'socket.io';
import {Events} from '../enums/Events';
import * as registryCatalog from '../nedb/schema-registry-catalog';
import * as registry from '../kafka/schemaRegistry';
import {ISchemaRegistry} from '../interfaces/schemaRegistry/ISchemaRegistry';
import {ExtendedAvroSchema} from '@theagilemonkeys/plasmido-schema-registry/dist/@types';
import {SchemaRegistry} from '@theagilemonkeys/plasmido-schema-registry';
import {defaultUserVariables, replaceUserVariables} from '../environment/variables';
import {SchemaType} from "../enums/SchemaType";

export const listenToSchemaRegistryRepository = (socket: Socket) => {

  const updateRegistryInstanceUrl = async (registryInstance: ISchemaRegistry) => {
    const userVariables = await defaultUserVariables();
    registryInstance.url = replaceUserVariables(registryInstance.url || '', userVariables);
  };

  socket.on(Events.PLASMIDO_INPUT_SCHEMA_REGISTRY_FIND_ALL_SYNC, async (callback: (error: Error | null,
                                                                                   registriesFound: Array<ISchemaRegistry> | null) => void) => {
    try {
      const result = await registryCatalog.findAll();
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_SCHEMA_REGISTRY_INSERT_SYNC, async (registryInstance: ISchemaRegistry,
                                                                      callback: (error: Error | null,
                                                                                 registryInserted: ISchemaRegistry | null) => void) => {
    try {
      const result = await registryCatalog.insert(registryInstance);
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_SCHEMA_REGISTRY_UPDATE_SYNC, async (registryInstance: ISchemaRegistry,
                                                                      callback: (error: Error | null,
                                                                                 registryUpdated: ISchemaRegistry | null) => void) => {
    try {
      const result = await registryCatalog.update(registryInstance);
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_SCHEMA_REGISTRY_CONNECT_SYNC, async (registryInstance: ISchemaRegistry,
                                                                 callback: (error: Error | null,
                                                                            schemaRegistry: SchemaRegistry | null) => void) => {
    try {
      await updateRegistryInstanceUrl(registryInstance);
      const result = registry.connect(registryInstance);
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_SCHEMA_REGISTRY_GET_SCHEMAS_SYNC, async (registryInstance: ISchemaRegistry,
                                                                           callback: (error: Error | null,
                                                                                      schemas: Array<ExtendedAvroSchema> | null) => void) => {
    try {
      await updateRegistryInstanceUrl(registryInstance);
      const result = await registry.getSchemas(registryInstance);
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_SCHEMA_REGISTRY_SAVE_SYNC, async (
    options: {
      registryInstance: ISchemaRegistry,
      subject: string,
      schema: string,
      schemaType: SchemaType
    },
    callback: (error: Error | null,
               schema: ExtendedAvroSchema | null) => void) => {
    try {
      await updateRegistryInstanceUrl(options.registryInstance);
      let result;
      switch (options.schemaType) {
        case SchemaType.JSON:
          result = await registry.saveJsonSchema(options.registryInstance, options.schema, options.subject);
          break;
        default:
          result = await registry.saveAvroSchema(options.registryInstance, options.schema, options.subject);
          break;
      }
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_SCHEMA_REGISTRY_DELETE_SYNC, async (schemaRegistryUUID: string,
                                                             callback: (error: Error | null,
                                                                        result: null) => void) => {
    try {
      await registryCatalog.remove(schemaRegistryUUID);
      callback(null, null);
    } catch (e) {
      callback(e, null)
    }
  });

}
