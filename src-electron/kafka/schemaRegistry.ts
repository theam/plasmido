import { cloneDeep } from 'lodash'
import { ISchemaRegistry } from '../interfaces/schemaRegistry/ISchemaRegistry'
import { SchemaRegistrySecurityProtocol } from '../enums/SchemaRegistrySecurityProtocol'
import * as schemaRegistryCatalog from '../nedb/schema-registry-catalog'
import { IWorkbook } from '../interfaces/workbooks/IWorkbook'
import { SchemaRegistryAPIClientArgs } from '@theagilemonkeys/plasmido-schema-registry/dist/api'
import { ExtendedSchemaRegistry, SchemaRegistry, SchemaType } from '@theagilemonkeys/plasmido-schema-registry'
import { RetryMiddlewareOptions } from 'mappersmith/middleware/retry/v2'
import { Authorization } from 'mappersmith'
import { ArtifactSchemaType } from '../enums/ArtifactSchemaType'
import { replaceUserVariables } from '../environment/variables'
import { Replaceable } from '../interfaces/environment/Replaceable'
import { SubjectSchema } from '@theagilemonkeys/plasmido-schema-registry/dist/ExtendedSchemaRegistry'
import {
  AvroConfluentSchema,
  AvroOptions, AvroSchema,
  JsonConfluentSchema, JsonOptions, ProtoOptions, Schema, SchemaRegistryAPIClientOptions
} from '@theagilemonkeys/plasmido-schema-registry/dist/@types'

const DEFAULT_SCHEMA_REGISTRY_RETRY_OPTIONS = {
  maxRetryTimeInSecs: 5,
  initialRetryTimeInSecs: 0.1,
  factor: 0.2, // randomization factor
  multiplier: 2, // exponential factor
  retries: 3, // max retries
} as Partial<RetryMiddlewareOptions>;

const DEFAULT_SCHEMA_REGISTRY_AVRO_OPTIONS = {
} as AvroOptions;

const DEFAULT_SCHEMA_REGISTRY_JSON_OPTIONS = {
  strict: true
} as JsonOptions;

const DEFAULT_SCHEMA_REGISTRY_PROTOBUF_OPTIONS = {
  messageName: 'CustomMessage'
} as ProtoOptions;

const schemaRegistryAPIClientOptions = {
  [SchemaType.AVRO]: DEFAULT_SCHEMA_REGISTRY_AVRO_OPTIONS,
  [SchemaType.JSON]: DEFAULT_SCHEMA_REGISTRY_JSON_OPTIONS,
  [SchemaType.PROTOBUF]: DEFAULT_SCHEMA_REGISTRY_PROTOBUF_OPTIONS
} as SchemaRegistryAPIClientOptions;

export const connect = (schemaRegistry: ISchemaRegistry): ExtendedSchemaRegistry => {
  let authorization = null;

  const schemaRegistryAPIClientArgs = {
    host: schemaRegistry.url,
    clientId: 'PLASMIDO',
    retry: DEFAULT_SCHEMA_REGISTRY_RETRY_OPTIONS
  } as SchemaRegistryAPIClientArgs;

  if (schemaRegistry.securityProtocol === SchemaRegistrySecurityProtocol.BASIC) {
    authorization = {
      username: schemaRegistry.username,
      password: schemaRegistry.password
    } as Authorization;
    schemaRegistryAPIClientArgs['auth'] = authorization;
  }

  const userOpts = cloneDeep(schemaRegistryAPIClientOptions);
  return new ExtendedSchemaRegistry(schemaRegistryAPIClientArgs, userOpts);
};

export const getSubjects = async (schemaRegistry: ISchemaRegistry): Promise<Array<string>> => {
  const registry = connect(schemaRegistry);
  return await registry.getSubjects();
}

export const getSchemas = async (schemaRegistry: ISchemaRegistry): Promise<Array<SubjectSchema>> => {
  const registry = connect(schemaRegistry);
  return await registry.getAllLatestSchemas();
}

export const connectAllSchemaRegistries = async (workbook: IWorkbook, userVariables: Array<Replaceable>) => {
  let schemasRegistriesIds = workbook.artifacts
    .filter(value => value.schemaType !== ArtifactSchemaType.PLAIN)
    .map(value => value.payloadSchema.schemaRegistryId)
    .filter(value => value !== undefined) as Array<string>;
  schemasRegistriesIds = [...new Set(schemasRegistriesIds)];
  const schemasRegistriesConfigurations = await schemaRegistryCatalog.findAllByIds(schemasRegistriesIds);

  const schemaRegistries = new Map();
  schemasRegistriesConfigurations.forEach(schemaRegistryConfiguration => {
    schemaRegistryConfiguration.url = replaceUserVariables(schemaRegistryConfiguration.url || '', userVariables);
    const registry = connect(schemaRegistryConfiguration);
    schemaRegistries.set(schemaRegistryConfiguration._id, registry);
  })
  return schemaRegistries;
}

export const saveAvroSchema = async (schemaRegistry: ISchemaRegistry,
                                     schema: string,
                                     subject?: string): Promise<SubjectSchema> => {
  const registry = connect(schemaRegistry);
  const formattedSchema = schema.replace(/\r\n|\r|\n/g, ' ');
  const avroSchema = {type: SchemaType.AVRO, schema: formattedSchema} as AvroConfluentSchema;
  const userOpts = {
    subject: subject
  }
  const registeredSchema = await registry.register(avroSchema, userOpts);
  const newSchema = await registry.getSchema(registeredSchema.id)
  return {
    subject: subject,
    schema: newSchema,
    schemaId: registeredSchema.id
  } as SubjectSchema;
}

export const saveJsonSchema = async (schemaRegistry: ISchemaRegistry,
                                     schema: string,
                                     subject: string): Promise<SubjectSchema> => {
  const registry = connect(schemaRegistry);
  const formattedSchema = schema.replace(/\r\n|\r|\n/g, ' ');

  const userOpts = {
    subject: subject || ''
  }
  const jsonSchema = {type: SchemaType.JSON, schema: formattedSchema} as JsonConfluentSchema;
  const registeredSchema = await registry.register(jsonSchema, userOpts);
  const newSchema = await registry.getSchema(registeredSchema.id)
  return {
    subject: subject,
    schema: newSchema,
    schemaId: registeredSchema.id
  } as SubjectSchema;
}



