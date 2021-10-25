import {Admin, AdminConfig, ITopicConfig} from 'kafkajs';
import {DEFAULT_MAX_RETRY_TIME, DEFAULT_RETRY_TIMES, getInstance} from './kafka-instance';
import {IBrokerKafkaInstance} from '../interfaces/broker/IBrokerKafkaInstance';
import {IDataTopic} from 'app/src-electron/interfaces/topic/IDataTopic';
import {ITopicCreated} from 'app/src-electron/interfaces/topic/ITopicCreated';

const PLASMIDO_NODE_ADMIN = 'PLASMIDO_NODE:admin';

export const connect = async (brokerKafkaInstance: IBrokerKafkaInstance) => {
  const serverInstance = getInstance(brokerKafkaInstance);
  const serverConfigOptions = {
    retry: {
      maxRetryTime: brokerKafkaInstance.maxRetryTime ?? DEFAULT_MAX_RETRY_TIME,
      retries: brokerKafkaInstance.retryTimes ?? DEFAULT_RETRY_TIMES
    }
  } as AdminConfig;
  const admin = serverInstance.admin(serverConfigOptions);
  try {
    await admin.connect();
    return admin;
  } catch (error) {
    console.error(PLASMIDO_NODE_ADMIN, ':connect:EVENT_SENT:', error, brokerKafkaInstance);
    return null;
  }
};

export const disconnect = async (connection: Admin) => {
  try {
    await connection.disconnect();
  } catch (error) {
    console.error(PLASMIDO_NODE_ADMIN, ':disconnect:ERROR:', error, connection);
  }
};

export const listTopics = async (brokerKafkaInstance: IBrokerKafkaInstance, ) => {
  const adminConnection = await connect(brokerKafkaInstance);
  if (adminConnection !== null) {
    try {
      const existingTopics = await adminConnection.listTopics();
      await disconnect(adminConnection);
      return existingTopics;
    } catch (error) {
      await disconnect(adminConnection);
      console.error(PLASMIDO_NODE_ADMIN, ':listTopics:EVENT_SENT:', error, brokerKafkaInstance);
    }
  }
  return null;
};

export const fetchTopicsMetadata = async (brokerKafkaInstance: IBrokerKafkaInstance) => {
  const adminConnection = await connect(brokerKafkaInstance);
  if (adminConnection !== null) {
    try {
      const dataTopics: Array<IDataTopic> = [];
      const metadata = await adminConnection.fetchTopicMetadata();
      if (metadata === null || metadata.topics.length === 0) {
        return null;
      } else {
        for (const topic of metadata.topics) {
          const dataTopic = {...topic, offsets: {}} as IDataTopic;
          dataTopic.offsets = await adminConnection.fetchTopicOffsets(topic.name);
          dataTopics.push(dataTopic);
        }
      }
      await disconnect(adminConnection);
      return dataTopics;
    } catch (error) {
      await disconnect(adminConnection);
      console.error(PLASMIDO_NODE_ADMIN, ':listTopics:EVENT_SENT:', error, brokerKafkaInstance);
    }
  }
  return null;
};

export const setOffsetsToTimestamp = async (topic: string, brokerKafkaInstance: IBrokerKafkaInstance, groupId: string, timestamp: number) => {
  const adminConnection = await connect(brokerKafkaInstance);
  if (adminConnection) {
    const entry = await adminConnection.fetchTopicOffsetsByTimestamp(topic, timestamp);
    await adminConnection.setOffsets({ groupId, topic, partitions: entry })
  }
  return Promise.resolve();
}

export const createTopic = async (topicName: string, brokerKafkaInstance: IBrokerKafkaInstance) => {
  const topic = {
    topic: topicName,
    numPartitions: 1,
    replicationFactor: 1,
    replicaAssignment: [],
    configEntries: []
  } as ITopicConfig
  const optionsTopic = {
    waitForLeaders: true,
    timeout: 5000,
    topics: [topic]
  }
  const adminConnection = await connect(brokerKafkaInstance);
  if (adminConnection !== null) {
    try {
      const created = await adminConnection.createTopics(optionsTopic);
      const topicCreated = {created: created, topicName: topicName} as ITopicCreated;
      await disconnect(adminConnection);
      return topicCreated;
    } catch (error) {
      console.error(PLASMIDO_NODE_ADMIN, ':createTopic:EVENT_SENT:', error, topic, optionsTopic, brokerKafkaInstance);
    } finally {
      await disconnect(adminConnection);
    }
  }
  return null;
};

export const deleteTopic = async (topicsNames: Array<string>, brokerKafkaInstance: IBrokerKafkaInstance) => {
  const adminConnection = await connect(brokerKafkaInstance);
  if (adminConnection !== null) {
    try {
      await adminConnection.deleteTopics({topics: topicsNames})
      return true;
    } catch (error) {
      console.error(PLASMIDO_NODE_ADMIN, ':deleteTopic:', error, topicsNames, brokerKafkaInstance);
    } finally {
      await disconnect(adminConnection);
    }
  }
  return false;
}

export const listGroups = async (brokerKafkaInstance: IBrokerKafkaInstance) => {
  const adminConnection = await connect(brokerKafkaInstance);
  if (adminConnection !== null) {
    try {
      const groupOverview = await adminConnection.listGroups();
      if (groupOverview) {
        const groupIds = groupOverview.groups.map(group => group.groupId);
        const groupDescriptions = await adminConnection.describeGroups(groupIds);
        return groupDescriptions.groups;
      }
      return [];
    } catch (error) {
      console.error(PLASMIDO_NODE_ADMIN, ':listTopics:', error, brokerKafkaInstance);
    } finally {
      await disconnect(adminConnection);
    }
  }
  return [];
}

export const deleteConsumerGroups = async (brokerKafkaInstance: IBrokerKafkaInstance, groupIds: Array<string>) => {
  const adminConnection = await connect(brokerKafkaInstance);
  if (adminConnection !== null) {
    try {
      const deleteGroupsResults = await adminConnection.deleteGroups(groupIds);
      return deleteGroupsResults;
    } catch (error) {
      console.error(PLASMIDO_NODE_ADMIN, ':deleteConsumerGroups:', error, groupIds, brokerKafkaInstance);
      return [];
    } finally {
      await disconnect(adminConnection);
    }
  }
  return null;
}
