import {ArtifactType} from 'app/src-electron/enums/ArtifactType';

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

export enum ArtifactTextFormat {
  PLAIN='PLAIN',
  JSON='JSON'
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
