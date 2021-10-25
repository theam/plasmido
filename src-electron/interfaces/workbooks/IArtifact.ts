import {ArtifactType} from 'app/src-electron/enums/ArtifactType';
import {IHeaders} from 'kafkajs';
import {ConsumeFromType} from 'app/src-electron/enums/ConsumeFromType';
import {ArtifactTextFormat} from 'app/src-electron/enums/ArtifactTextFormat';
import {ArtifactSchemaType} from 'app/src-electron/enums/ArtifactSchemaType';

export interface IArtifactPayloadSchema {
  schemaRegistryId?: string,
  schemaSubject?: string,
  schemaId?: number
}

export interface IArtifact {
  uuid: string,
  name: string,
  type: ArtifactType,
  brokerId: string,
  topicName: string,
  headers?: IHeaders,
  payload?: string,
  schemaType: ArtifactSchemaType, // PLAIN, AVRO, JSON
  consumeFrom: ConsumeFromType, // NOW, BEGINNING
  textFormat: ArtifactTextFormat, // PLAIN, JSON
  payloadSchema: IArtifactPayloadSchema,
  repeatTimes: number,
  batchSize: number
}
