import {SchemaRegistrySecurityProtocol} from 'src/enums/SchemaRegistrySecurityProtocol'

export default interface ISchemaRegistryTreeItem {
  uuid: string,
  to: string,
  name: string,
  url: string,
  securityProtocol: SchemaRegistrySecurityProtocol
}
