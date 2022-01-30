/* eslint-disable @typescript-eslint/no-misused-promises */
import {Socket} from 'socket.io'
import {Events} from '../enums/Events'
import {IBroker} from '../interfaces/broker/IBroker'
import * as brokerCatalog from '../nedb/broker-catalog'

export const listenToBrokerRepository = (socket: Socket) => {

  socket.on(Events.PLASMIDO_INPUT_BROKER_FIND_ALL_SYNC, async (callback: (error: Error | null,
                                                                          brokersFound: Array<IBroker> | null) => void) => {
    try {
      const result = await brokerCatalog.findAll()
      callback(null, result)
    } catch (e) {
      callback(e, null)
    }
  })

  socket.on(Events.PLASMIDO_INPUT_BROKER_INSERT_SYNC, async (brokerInstance: IBroker,
                                                             callback: (error: Error | null,
                                                                        brokerInserted: IBroker | null) => void) => {
    try {
      const result = await brokerCatalog.insert(brokerInstance)
      callback(null, result)
    } catch (e) {
      callback(e, null)
    }
  })

  socket.on(Events.PLASMIDO_INPUT_BROKER_UPDATE_SYNC, async (brokerInstance: IBroker,
                                                             callback: (error: Error | null,
                                                                        brokerUpdated: IBroker | null) => void) => {
    try {
      const result = await brokerCatalog.updateSimple(brokerInstance)
      callback(null, result)
    } catch (e) {
      callback(e, null)
    }
  })

  socket.on(Events.PLASMIDO_INPUT_BROKER_DELETE_SYNC, async (brokerUUID: string,
                                                               callback: (error: Error | null,
                                                                          result: null) => void) => {
    try {
      await brokerCatalog.remove(brokerUUID)
      callback(null, null)
    } catch (e) {
      callback(e, null)
    }
  })


}
