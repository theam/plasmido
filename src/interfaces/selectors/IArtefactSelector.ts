import {ArtifactType} from 'src/enums/ArtifactType'
import {IArtifact} from 'src/interfaces/workbooks/IArtifact'

export interface IArtefactSelector {
  name: string,
  label: string,
  type: ArtifactType,
  uuid: string,
  artifact: IArtifact
}
