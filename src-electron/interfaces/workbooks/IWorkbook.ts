import {WorkBookActions} from 'app/src-electron/enums/WorkBookActions';
import {WorkBookStatus} from 'app/src-electron/enums/WorkBookStatus';
import {IArtifact} from 'app/src-electron/interfaces/workbooks/IArtifact';

export interface IWorkbook {
  _id: string,
  uuid: string,
  name: string,
  action: WorkBookActions,
  status: WorkBookStatus,
  artifacts: Array<IArtifact>
}
