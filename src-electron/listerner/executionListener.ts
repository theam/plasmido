/* eslint-disable @typescript-eslint/no-misused-promises */
import {Server, Socket} from 'socket.io';
import {IWorkbook} from '../interfaces/workbooks/IWorkbook';
import {Events} from '../enums/Events';
import * as workbook from '../kafka/workbook';
import {IExecutionWorkbook} from 'app/src-electron/interfaces/executions/IExecutionWorkbook';
import {IExecutionStart} from 'app/src-electron/interfaces/executions/IExecutionStart';

export const listenToExecution = (socket: Socket, io: Server) => {

  socket.on(Events.PLASMIDO_INPUT_WORKBOOK_START_SYNC, async (workbookInstance: IWorkbook, callback: (error: Error | null,
                                                                                                 result: IExecutionStart | null) => void) => {
    try {
      const startedWorkbook = await workbook.start(workbookInstance, io);
      callback(null, startedWorkbook);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_WORKBOOK_STOP_SYNC, async (workbookInstance: IWorkbook, callback: (error: Error | null,
                                                                                                result: IExecutionWorkbook | null) => void) => {
    try {
      const stoppedWorkbook = await workbook.stop(workbookInstance, io);
      callback(null, stoppedWorkbook);
    } catch (e) {
      callback(e, null)
    }
  });

}
