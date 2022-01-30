import {WorkBookStatus} from 'app/src-electron/enums/WorkBookStatus'

export interface IExecutionArtifact {
  _id: string,
  workbookUUID: string
  artifactUUID: string
  status: WorkBookStatus
}
