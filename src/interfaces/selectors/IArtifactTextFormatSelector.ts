import {ArtifactTextFormat, ArtifactTextFormatDescription} from 'src/enums/ArtifactTextFormat';

export interface IArtifactTextFormatSelector {
  label: string,
  value: ArtifactTextFormat
}

export const artifactTextFormatToArtifactTextFormatSelector = (artifactTextFormat: string) => {
  if (artifactTextFormat === null || artifactTextFormat === undefined) return null;
  return {
    label: ArtifactTextFormatDescription[artifactTextFormat as keyof typeof ArtifactTextFormatDescription],
    value: artifactTextFormat
  } as IArtifactTextFormatSelector
}
