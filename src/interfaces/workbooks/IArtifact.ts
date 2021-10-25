import {ArtifactType} from 'app/src/enums/ArtifactType';
import {IHeaders} from 'kafkajs';
import {ConsumeFromType} from 'src/enums/ConsumeFromType';
import {ArtifactSchemaType} from 'src/enums/ArtifactSchemaType';
import {ArtifactTextFormat} from 'src/enums/ArtifactTextFormat';

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
  schemaType: ArtifactSchemaType,
  consumeFrom: ConsumeFromType,
  textFormat: ArtifactTextFormat,
  payloadSchema: IArtifactPayloadSchema,
  repeatTimes: number,
  batchSize: number
}
