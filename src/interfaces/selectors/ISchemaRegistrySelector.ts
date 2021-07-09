import {ISchemaRegistry} from 'src/interfaces/schemaRegistry/ISchemaRegistry';

export interface ISchemaRegistrySelector {
  label: string,
  value: string,
  schemaRegistry: ISchemaRegistry
}

export const schemaRegistryToSchemaRegistrySelector = (schemaRegistry: ISchemaRegistry | null) => {
  if (schemaRegistry === null || schemaRegistry._id === '') return null;
  return {
    label: schemaRegistry?.name,
    value: schemaRegistry?._id,
    schemaRegistry: schemaRegistry
  } as ISchemaRegistrySelector
}
