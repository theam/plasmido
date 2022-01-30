import {SchemaRegistrySecurityProtocol} from 'src/enums/SchemaRegistrySecurityProtocol'

export interface ISchemaRegistry {
  _id: string,
  uuid: string,
  name: string,
  url: string,
  securityProtocol: SchemaRegistrySecurityProtocol,
  username?: string,
  password?: string,
  createdAt?: string,
  updatedAt?: string
}



