import {readonly, ref} from 'vue';
import {IBroker} from 'src/interfaces/broker/IBroker';
import {Events} from 'src/enums/Events';
import {buildConnectionOptions} from 'src/composables/connectionOptionsBuilder';
import {IBrokerKafkaInstance} from 'src/interfaces/broker/IBrokerKafkaInstance';
import {syncEmit} from 'app/src/global';
import {Admin} from 'kafkajs';
import {ITopicCreated} from 'app/src-electron/interfaces/topic/ITopicCreated';
import {IDataTopic} from 'app/src-electron/interfaces/topic/IDataTopic';


const topics = ref([] as Array<IDataTopic>);

const brokerKafkaInstanceFromBroker = (broker: IBroker) => {
  return {
    brokerList: broker.url,
    options: buildConnectionOptions(broker)
  } as IBrokerKafkaInstance;
};

export default function useAdminRepository() {
  const connected = ref(false);
  const connecting = ref(false);
  const connectingBrokerError = ref(false);
  const topicInserted = ref(false);
  const duplicatedTopicName = ref(false);
  const searchingTopics = ref(false);

  const connectBroker = async (broker: IBroker) => {
    resetConnection();
    connecting.value = true;
    const brokerKafkaInstance = brokerKafkaInstanceFromBroker(broker);
    const admin = await syncEmit(Events.PLASMIDO_INPUT_ADMIN_CONNECT_SYNC, brokerKafkaInstance) as Admin;
    connected.value = admin !== null;
    connectingBrokerError.value = admin === null;
    connecting.value = false;
  };

  const findAllTopics = async (broker: IBroker | undefined, maxRetryTime = 30000, retryTimes = 5) => {
    try {
      searchingTopics.value = true;
      resetTopics();
      if (!broker || broker.url === '') return null;
      const brokerKafkaInstance = brokerKafkaInstanceFromBroker(broker);
      const topicsFound = await syncEmit(Events.PLASMIDO_INPUT_TOPICS_GET_TOPICS_SYNC, brokerKafkaInstance) as Array<string>;
      if (topicsFound === null) return null;
      topicsFound.map(topicName =>
        ({
          name: topicName
        } as IDataTopic))
        .forEach(topic => {
          if (!topic.name.startsWith('_')) { // TODO add to configuration (hide private topics)
            topics.value.push(topic);
          }
          });
    } finally {
      searchingTopics.value = false;
    }
  };

  const findAllMetadata = async (broker: IBroker) => {
    const brokerKafkaInstance = brokerKafkaInstanceFromBroker(broker);
    const metadatasFound = await syncEmit(Events.PLASMIDO_INPUT_TOPICS_GET_MEDATA_TOPICS_SYNC, brokerKafkaInstance) as Array<IDataTopic>;
    metadatasFound.forEach(metadataFound => {
      const {name: topicName, partitions, offsets} = metadataFound;
      const index = topics.value.findIndex((el) => el.name === topicName);
      if (index >= 0) {
        topics.value[index].partitions = partitions;
        topics.value[index].offsets = offsets;
      }
    });
  };

  const saveTopic = async (broker: IBroker, topicName: string) => {
    resetConnection();
    const brokerKafkaInstance = brokerKafkaInstanceFromBroker(broker);
    const savedTopic = await syncEmit(Events.PLASMIDO_INPUT_TOPICS_CREATE_TOPIC_SYNC, {brokerKafkaInstance, topicName}) as ITopicCreated;
    if (!savedTopic.created) {
      duplicatedTopicName.value = true;
      return topicName;
    }
    topics.value.push({name: savedTopic.topicName});
    topicInserted.value = true;
    return savedTopic.topicName;
  };

  const resetTopics = () => {
    topics.value.length = 0;
  }

  const resetConnection = () => {
    connected.value = false;
    connectingBrokerError.value = false;
    connecting.value = false;
    topicInserted.value = false;
    duplicatedTopicName.value = false;
    searchingTopics.value = false;
  }

  return {
    topics: readonly(topics),
    connecting: readonly(connecting),
    connected: readonly(connected),
    connectingBrokerError: readonly(connectingBrokerError),
    topicInserted: readonly(topicInserted),
    duplicatedTopicName: readonly(duplicatedTopicName),
    searchingTopics: readonly(searchingTopics),
    resetConnection,
    connectBroker,
    findAllTopics,
    findAllMetadata,
    saveTopic,
    resetTopics
  }

}
