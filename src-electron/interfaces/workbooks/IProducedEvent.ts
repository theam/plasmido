import {Message} from 'kafkajs'

export interface IProducedEvent {
  message: Message[],
  artifactUUID: string
}
