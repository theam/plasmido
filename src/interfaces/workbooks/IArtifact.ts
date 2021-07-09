import {ArtifactType} from 'app/src/enums/ArtifactType';

export interface IArtifactPayloadSchema {
  schemaRegistryId?: string,
  schemaSubject?: string,
  schemaId?: number
}

export enum ArtifactSchemaType {
  PLAIN = 'PLAIN',
  AVRO = 'AVRO',
  JSON = 'JSON'
}

export enum ArtifactSchemaTypeDescription {
  PLAIN = 'Plain',
  AVRO = 'Avro Schema',
  JSON = 'Json Schema'
}

export enum ArtifactTextFormat {
  PLAIN='PLAIN',
  JSON='JSON'
}

export enum ArtifactTextFormatDescription {
  PLAIN='Plain',
  JSON='Json'
}

export interface IArtifact {
  uuid: string,
  name: string,
  type: ArtifactType,
  brokerId: string,
  topicName: string,
  payload?: string,
  schemaType: ArtifactSchemaType,
  textFormat: ArtifactTextFormat,
  payloadSchema: IArtifactPayloadSchema,
  repeatTimes?: number
}
