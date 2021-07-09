import {EachMessagePayload} from 'kafkajs';

export interface IConsumedEvent {
  eachMessagePayload:EachMessagePayload
  artifactUUID: string,
  avroDecodedMessage?: string
}
