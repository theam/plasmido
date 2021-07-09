import {SchemaRegistrySecurityProtocol} from 'src/enums/SchemaRegistrySecurityProtocol';

export default interface ISchemaRegistryTreeItem {
  to: string,
  name: string,
  url: string,
  securityProtocol: SchemaRegistrySecurityProtocol
}
