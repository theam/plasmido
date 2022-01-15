import { cloneDeep } from 'lodash'
import { ISchemaRegistry } from '../interfaces/schemaRegistry/ISchemaRegistry'
import { SchemaRegistrySecurityProtocol } from '../enums/SchemaRegistrySecurityProtocol'
import * as schemaRegistryCatalog from '../nedb/schema-registry-catalog'
import { IWorkbook } from '../interfaces/workbooks/IWorkbook'
import {
  AvroConfluentSchema,
  AvroOptions,
  ExtendedAvroSchema,
  JsonConfluentSchema,
  JsonOptions,
  ProtoOptions,
  SchemaRegistryAPIClientOptions,
  SchemaType
} from '@theagilemonkeys/plasmido-schema-registry/dist/@types'
import { SchemaRegistryAPIClientArgs } from '@theagilemonkeys/plasmido-schema-registry/dist/api'
import { SchemaRegistry } from '@theagilemonkeys/plasmido-schema-registry'
import { RetryMiddlewareOptions } from 'mappersmith/middleware/retry/v2'
import { Authorization } from 'mappersmith'
import { ArtifactSchemaType } from '../enums/ArtifactSchemaType'
import { replaceUserVariables } from '../environment/variables'
import { Replaceable } from '../interfaces/environment/Replaceable'

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

export const connect = (schemaRegistry: ISchemaRegistry): SchemaRegistry => {
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
  return new SchemaRegistry(schemaRegistryAPIClientArgs, userOpts);
};

export const getSchemas = async (schemaRegistry: ISchemaRegistry) => {
  const registry = connect(schemaRegistry);
  const schemas = await registry.getSchemas();
  const latestSchemas = [] as Array<ExtendedAvroSchema>;
  schemas.sort((a: ExtendedAvroSchema, b: ExtendedAvroSchema) => b.version - a.version);
  schemas.forEach(newSchema => {
    const exists = latestSchemas.some(existingSchema => existingSchema.subject === newSchema.subject);
    if (!exists) latestSchemas.push(newSchema);
  });
  return latestSchemas.sort((a, b) => a.subject.localeCompare(b.subject));
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
                                     subject?: string) => {
  const registry = connect(schemaRegistry);
  const formattedSchema = schema.replace(/\r\n|\r|\n/g, ' ');
  const avroSchema = {type: SchemaType.AVRO, schema: formattedSchema} as AvroConfluentSchema;
  const userOpts = {
    subject: subject
  }
  const {id: _, subject: registeredSubject} = await registry.register(avroSchema, userOpts);
  return await registry.getLatestSchema(registeredSubject);
}

export const saveJsonSchema = async (schemaRegistry: ISchemaRegistry,
                                     schema: string,
                                     subject: string) => {
  const registry = connect(schemaRegistry);
  const formattedSchema = schema.replace(/\r\n|\r|\n/g, ' ');

  const userOpts = {
    subject: subject || ''
  }
  const jsonSchema = {type: SchemaType.JSON, schema: formattedSchema} as JsonConfluentSchema;
  const {id: _, subject: registeredSubject} = await registry.register(jsonSchema, userOpts);
  return await registry.getLatestSchema(registeredSubject);
}



