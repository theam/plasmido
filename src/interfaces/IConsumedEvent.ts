import {EachMessagePayload, IHeaders} from 'kafkajs';

export interface IConsumedEvent {
  _id: string,
  eachMessagePayload:EachMessagePayload
  artifactUUID: string,
  plainMessage?: string,
  plainHeaders?: IHeaders
}
