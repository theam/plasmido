/* eslint-disable @typescript-eslint/no-misused-promises */
import {Socket} from 'socket.io';
import {Events} from '../enums/Events';
import * as environmentCatalog from '../nedb/environment-catalog';
import {IEnvironment} from '../interfaces/environment/IEnvironment';
import * as userCatalog from 'app/src-electron/nedb/user-catalog';

export const listenToEnvironmentRepository = (socket: Socket) => {

  socket.on(Events.PLASMIDO_INPUT_ENVIRONMENT_FIND_ALL_SYNC, async (callback: (error: Error | null,
                                                                               environmentsFound: Array<IEnvironment> | null) => void) => {
    try {
      const result = await environmentCatalog.findAll();
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_ENVIRONMENT_INSERT_SYNC, async (environmentInstance: IEnvironment,
                                                                  callback: (error: Error | null,
                                                                             environmentInserted: IEnvironment | null) => void) => {
    try {
      const result = await environmentCatalog.insert(environmentInstance);
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_ENVIRONMENT_UPDATE_SYNC, async (environmentInstance: IEnvironment,
                                                                  callback: (error: Error | null,
                                                                             environmentUpdated: IEnvironment | null) => void) => {
    try {
      const result = await environmentCatalog.updateSimple(environmentInstance);
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_ENVIRONMENT_DELETE_SYNC, async (environmentUUID: string,
                                                           callback: (error: Error | null,
                                                                      result: null) => void) => {
    try {
      await environmentCatalog.remove(environmentUUID);
      callback(null, null);
    } catch (e) {
      callback(e, null)
    }
  });

}
