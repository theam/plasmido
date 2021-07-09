/* eslint-disable @typescript-eslint/no-misused-promises */
import {Socket} from 'socket.io';
import {Events} from '../enums/Events';
import * as registryCatalog from '../nedb/schema-registry-catalog';
import * as registry from '../kafka/schemaRegistry';
import {ISchemaRegistry} from '../interfaces/schemaRegistry/ISchemaRegistry';
import {ExtendedAvroSchema} from '@plasmido/plasmido-schema-registry/dist/@types';
import {SchemaRegistry} from '@plasmido/plasmido-schema-registry';

export const listenToSchemaRegistryRepository = (socket: Socket) => {

  socket.on(Events.PLASMIDO_INPUT_SCHEMA_REGISTRY_FIND_ALL_SYNC, async (_: any, callback: (error: Error | null,
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

  socket.on(Events.PLASMIDO_INPUT_SCHEMA_REGISTRY_CONNECT_SYNC, (registryInstance: ISchemaRegistry,
                                                                 callback: (error: Error | null,
                                                                            schemaRegistry: SchemaRegistry | null) => void) => {
    try {
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
      schema: string
    },
    callback: (error: Error | null,
               schema: ExtendedAvroSchema | null) => void) => {
    try {
      const result = await registry.saveAvroSchema(options.registryInstance, options.schema, options.subject); // TODO only Avro right now
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

}
