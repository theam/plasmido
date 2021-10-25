/* eslint-disable @typescript-eslint/no-misused-promises */
import {Server, Socket} from 'socket.io';
import {IWorkbook} from '../interfaces/workbooks/IWorkbook';
import {Events} from '../enums/Events';
import * as workbook from '../kafka/workbook';
import * as executionsWorkbook from '../nedb/execution-workbook-catalog';
import * as executionsArtifact from '../nedb/execution-artifact-catalog';
import * as executionsConsumed from '../nedb/execution-consumed-catalog';
import {IExecutionWorkbook} from 'app/src-electron/interfaces/executions/IExecutionWorkbook';
import {IExecutionStart} from 'app/src-electron/interfaces/executions/IExecutionStart';
import {IConsumedEvent} from 'app/src-electron/interfaces/IConsumedEvent';

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

  socket.on(Events.PLASMIDO_INPUT_EXECUTIONS_TRUNCATE, async (callback: (error: Error | null,
                                                                         result: boolean | null) => void) => {
    try {
      const resultWorkbook = await executionsWorkbook.removeAll();
      const resultArtifact = await executionsArtifact.removeAll();
      callback(null, resultWorkbook && resultArtifact);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_EXECUTIONS_CONSUMED, async (options: {
                                                                artifactUUID: string,
                                                                filter: string,
                                                                startRow: number,
                                                                count: number
                                                              },
                                                              callback: (error: Error | null,
                                                                         result: Array<IConsumedEvent> | null) => void) => {
    try {
      const result = await executionsConsumed.getConsumedAllByArtifact(options.artifactUUID, options.filter, options.startRow, options.count);
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_EXECUTIONS_CONSUMED_COUNT, async (options: {
                                                                      artifactUUID: string,
                                                                      filter: string
                                                                    },
                                                                    callback: (error: Error | null,
                                                                               result: number | null) => void) => {
    try {
      const result = await executionsConsumed.getConsumedCountByArtifact(options.artifactUUID, options.filter);
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

}
