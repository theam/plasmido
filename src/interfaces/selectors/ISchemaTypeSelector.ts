import {SchemaType, SchemaTypeDescription} from 'src/enums/SchemaType';

export interface ISchemaTypeSelector {
  label: string,
  value: SchemaType
}

export const schemaTypeToArtifactSchemaTypeSelector = (schemaType: string) => {
  return {
    label: SchemaTypeDescription[schemaType as keyof typeof SchemaTypeDescription],
    value: schemaType
  } as ISchemaTypeSelector
}
