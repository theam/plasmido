/* eslint-disable @typescript-eslint/no-misused-promises */
import {Socket} from 'socket.io'
import {Events} from '../enums/Events'
import * as admin from '../kafka/admin'
import {IBrokerKafkaInstance} from '../interfaces/broker/IBrokerKafkaInstance'
import {Admin, DeleteGroupsResult, GroupDescription} from 'kafkajs'
import {IDataTopic} from '../interfaces/topic/IDataTopic'
import {ITopicCreated} from '../interfaces/topic/ITopicCreated'
import {defaultUserVariables, replaceUserVariables} from '../environment/variables'

export const listenToAdminRepository = (socket: Socket) => {

  const updateBrokerKafkaInstanceUrl = async (brokerKafkaInstance: IBrokerKafkaInstance) => {
    const userVariables = await defaultUserVariables()
    brokerKafkaInstance.brokerList = replaceUserVariables(brokerKafkaInstance.brokerList || '', userVariables)
  }

  socket.on(Events.PLASMIDO_INPUT_ADMIN_CONNECT_SYNC, async (brokerKafkaInstance: IBrokerKafkaInstance,
                                                             callback: (error: Error | null,
                                                                        admin: Admin | null) => void) => {
    try {
      await updateBrokerKafkaInstanceUrl(brokerKafkaInstance)
      const result = await admin.connect(brokerKafkaInstance)
      callback(null, result)
    } catch (e) {
      callback(e, null)
    }
  })

  socket.on(Events.PLASMIDO_INPUT_TOPICS_GET_TOPICS_SYNC, async (brokerKafkaInstance: IBrokerKafkaInstance,
                                                                 callback: (error: Error | null,
                                                                            topics: Array<string> | null) => void) => {
    try {
      await updateBrokerKafkaInstanceUrl(brokerKafkaInstance)
      const result = await admin.listTopics(brokerKafkaInstance)
      callback(null, result)
    } catch (e) {
      callback(e, null)
    }
  })

  socket.on(Events.PLASMIDO_INPUT_TOPICS_GET_MEDATA_TOPICS_SYNC, async (brokerKafkaInstance: IBrokerKafkaInstance,
                                                                        callback: (error: Error | null,
                                                                                   metadatas: Array<IDataTopic> | null) => void) => {
    try {
      await updateBrokerKafkaInstanceUrl(brokerKafkaInstance)
      const result = await admin.fetchTopicsMetadata(brokerKafkaInstance)
      callback(null, result)
    } catch (e) {
      callback(e, null)
    }
  })

  socket.on(Events.PLASMIDO_INPUT_TOPICS_CREATE_TOPIC_SYNC, async (options: {
                                                                     brokerKafkaInstance: IBrokerKafkaInstance,
                                                                     topicName: string
                                                                   },
                                                                   callback: (error: Error | null,
                                                                              topicCreated: ITopicCreated | null) => void) => {
    try {
      await updateBrokerKafkaInstanceUrl(options.brokerKafkaInstance)
      const result = await admin.createTopic(options.topicName, options.brokerKafkaInstance)
      callback(null, result)
    } catch (e) {
      callback(e, null)
    }
  })

  socket.on(Events.PLASMIDO_INPUT_TOPICS_DELETE_TOPIC_SYNC, async (options: {
                                                                     topicsNames: Array<string>,
                                                                     brokerKafkaInstance: IBrokerKafkaInstance
                                                                   },
                                                                   callback: (error: Error | null,
                                                                              result: boolean | null) => void) => {
    try {
      await updateBrokerKafkaInstanceUrl(options.brokerKafkaInstance)
      const result = await admin.deleteTopic(options.topicsNames, options.brokerKafkaInstance)
      callback(null, result)
    } catch (e) {
      callback(e, null)
    }
  })

  socket.on(Events.PLASMIDO_INPUT_ADMIN_LIST_GROUPS_SYNC, async (brokerKafkaInstance: IBrokerKafkaInstance,
                                                                 callback: (error: Error | null,
                                                                            result: Array<GroupDescription> | null) => void) => {
    try {
      await updateBrokerKafkaInstanceUrl(brokerKafkaInstance)
      const result = await admin.listGroups(brokerKafkaInstance)
      callback(null, result)
    } catch (e) {
      callback(e, null)
    }
  })

  socket.on(Events.PLASMIDO_INPUT_ADMIN_DELETE_GROUPS_SYNC, async (options: {
                                                                     groupIds: Array<string>,
                                                                     brokerKafkaInstance: IBrokerKafkaInstance
                                                                   },
                                                                   callback: (error: Error | null,
                                                                              result: Array<DeleteGroupsResult> | null) => void) => {
    try {
      await updateBrokerKafkaInstanceUrl(options.brokerKafkaInstance)
      const result = await admin.deleteConsumerGroups(options.brokerKafkaInstance, options.groupIds)
      callback(null, result)
    } catch (e) {
      callback(e, null)
    }
  })
}
