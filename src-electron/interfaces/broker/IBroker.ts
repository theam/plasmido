import {BrokerProtocol} from '../../enums/BrokerProtocol'

export interface IBroker {
  _id?: string,
  uuid: string,
  name: string,
  url: string,
  protocol: BrokerProtocol,
  ssl_enabled: boolean,
  rejectUnauthorized: boolean,
  username?: string,
  password?: string,
  authorizationIdentity?: string,
  accessKeyId?: string,
  secretAccessKey?: string,
  sessionToken?: string,
  createdAt?: string,
  updatedAt?: string
}



