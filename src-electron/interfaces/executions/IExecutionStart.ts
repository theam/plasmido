import {IExecutionWorkbook} from 'app/src-electron/interfaces/executions/IExecutionWorkbook'
import {IExecutionArtifact} from 'app/src-electron/interfaces/executions/IExecutionArtifact'

export interface IExecutionStart {
  executionWorkbook: IExecutionWorkbook,
  executionArtifacts: Array<IExecutionArtifact>
}
