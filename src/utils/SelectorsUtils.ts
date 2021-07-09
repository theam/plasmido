import {IArtifact} from 'src/interfaces/workbooks/IArtifact';
import {IArtefactSelector} from 'src/interfaces/selectors/IArtefactSelector';

export const artifactSelectorFromArtifact = (value: IArtifact) => ({
  name: value.uuid,
  label: value.name,
  type: value.type,
  artifact: value
} as IArtefactSelector);
