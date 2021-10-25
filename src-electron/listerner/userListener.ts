/* eslint-disable @typescript-eslint/no-misused-promises */
import {Socket} from 'socket.io';
import {Events} from '../enums/Events';
import {IUser} from 'app/src-electron/interfaces/user/IUser';
import * as userCatalog from '../nedb/user-catalog';

export const listenToUserRepository = (socket: Socket) => {

  socket.on(Events.PLASMIDO_INPUT_USER_FIND_ALL_SYNC, async (callback: (error: Error | null,
                                                                          usersFound: Array<IUser> | null) => void) => {
    try {
      const result = await userCatalog.findAll();
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_USER_INSERT_SYNC, async (userInstance: IUser,
                                                             callback: (error: Error | null,
                                                                        userInserted: IUser | null) => void) => {
    try {
      const result = await userCatalog.insert(userInstance);
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_USER_UPDATE_SYNC, async (userInstance: IUser,
                                                             callback: (error: Error | null,
                                                                        userUpdated: IUser | null) => void) => {
    try {
      const result = await userCatalog.update(userInstance);
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_USER_DELETE_SYNC, async (userUUID: string,
                                                               callback: (error: Error | null,
                                                                          result: null) => void) => {
    try {
      await userCatalog.remove(userUUID);
      callback(null, null);
    } catch (e) {
      callback(e, null)
    }
  });


}
