import {WorkBookActions} from 'app/src-electron/enums/WorkBookActions';

export interface IExecutionWorkbook {
  _id: string,
  workbookUUID: string
  action: WorkBookActions
}
