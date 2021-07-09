/* eslint-disable @typescript-eslint/no-misused-promises */
import {Socket} from 'socket.io';
import {Events} from '../enums/Events';
import * as admin from '../kafka/admin';
import {IBrokerKafkaInstance} from '../interfaces/broker/IBrokerKafkaInstance';
import {Admin} from 'kafkajs';
import {IDataTopic} from '../interfaces/topic/IDataTopic';
import {ITopicCreated} from 'app/src-electron/interfaces/topic/ITopicCreated';

export const listenToAdminRepository = (socket: Socket) => {

  socket.on(Events.PLASMIDO_INPUT_ADMIN_CONNECT_SYNC, async (brokerKafkaInstance: IBrokerKafkaInstance,
                                                             callback: (error: Error | null,
                                                                        admin: Admin | null) => void) => {
    try {
      const result = await admin.connect(brokerKafkaInstance);
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_TOPICS_GET_TOPICS_SYNC, async (brokerKafkaInstance: IBrokerKafkaInstance,
                                                                 callback: (error: Error | null,
                                                                            topics: Array<string> | null) => void) => {
    try {
      const result = await admin.listTopics(brokerKafkaInstance);
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_TOPICS_GET_MEDATA_TOPICS_SYNC, async (brokerKafkaInstance: IBrokerKafkaInstance,
                                                                        callback: (error: Error | null,
                                                                                   metadatas: Array<IDataTopic> | null) => void) => {
    try {
      const result = await admin.fetchTopicsMetadata(brokerKafkaInstance);
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });

  socket.on(Events.PLASMIDO_INPUT_TOPICS_CREATE_TOPIC_SYNC, async (options: {
                                                                     brokerKafkaInstance: IBrokerKafkaInstance,
                                                                     topicName: string
                                                                   },
                                                                   callback: (error: Error | null,
                                                                              topicCreated: ITopicCreated | null) => void) => {
    try {
      const result = await admin.createTopic(options.topicName, options.brokerKafkaInstance);
      callback(null, result);
    } catch (e) {
      callback(e, null)
    }
  });
}
