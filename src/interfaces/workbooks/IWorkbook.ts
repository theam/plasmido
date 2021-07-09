import {WorkBookActions} from 'app/src/enums/WorkBookActions';
import {WorkBookStatus} from 'app/src/enums/WorkBookStatus';
import {IArtifact} from 'src/interfaces/workbooks/IArtifact';

export interface IWorkbook {
  _id: string,
  uuid: string,
  name: string,
  action: WorkBookActions,
  status: WorkBookStatus,
  artifacts: Array<IArtifact>
}
