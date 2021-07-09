/* eslint-disable @typescript-eslint/no-misused-promises */
import {Socket} from 'socket.io';
import {IWorkbook} from '../interfaces/workbooks/IWorkbook';
import {Events} from '../enums/Events';
import * as workbookCatalog from '../nedb/workbook-catalog';

export const listenToWorkbookRepository = (socket: Socket) => {

  socket.on(Events.PLASMIDO_INPUT_WORKBOOK_FIND_ALL_SYNC, async (_: any, callback: (error: Error | null,
                                                                                    workbooksFound: Array<IWorkbook> | null) => void) => {
    try {
      const result = await workbookCatalog.findAll();
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_WORKBOOK_INSERT_SYNC, async (workbookInstance: IWorkbook,
                                                               callback: (error: Error | null,
                                                                          workbookInserted: IWorkbook | null) => void) => {
    try {
      const result = await workbookCatalog.insert(workbookInstance);
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_WORKBOOK_UPDATE_SYNC, async (workbookInstance: IWorkbook,
                                                               callback: (error: Error | null,
                                                                          workbookUpdated: IWorkbook | null) => void) => {
    try {
      const result = await workbookCatalog.update(workbookInstance);
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

}
