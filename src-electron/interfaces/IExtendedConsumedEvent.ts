import {EachMessagePayload, IHeaders} from 'kafkajs'

export interface IExtendedConsumedEvent {
  _id: string,
  uniqueConstraint: string,
  eachMessagePayload:EachMessagePayload
  artifactUUID: string,
  plainMessage?: string,
  plainHeaders?: IHeaders
}
