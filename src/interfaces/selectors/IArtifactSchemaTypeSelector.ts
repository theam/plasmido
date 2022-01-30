import {ArtifactSchemaType, ArtifactSchemaTypeDescription} from 'src/enums/ArtifactSchemaType'

export interface IArtifactSchemaTypeSelector {
  label: string,
  value: ArtifactSchemaType
}

export const artifactSchemaTypeToArtifactSchemaTypeSelector = (artifactSchemaType: string) => {
  return {
    label: ArtifactSchemaTypeDescription[artifactSchemaType as keyof typeof ArtifactSchemaTypeDescription],
    value: artifactSchemaType
  } as IArtifactSchemaTypeSelector
}
