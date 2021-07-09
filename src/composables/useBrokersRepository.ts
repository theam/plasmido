import {computed, readonly, ref} from 'vue';
import {Events} from 'app/src/enums/Events';
import {syncEmit} from 'app/src/global';
import {buildConnectionOptions} from './connectionOptionsBuilder';
import {BrokerProtocol} from 'src/enums/BrokerProtocol';
import {IBroker} from 'src/interfaces/broker/IBroker';

const brokers = ref([] as Array<IBroker>);

export default function useBrokersRepository() {
  const currentBroker = ref({} as IBroker);
  const inserted = ref(false);
  const updated = ref(false);
  const currentBrokerInitialized = ref(false);

  const newBroker = () => {
    const broker = {
      _id: '',
      protocol: BrokerProtocol.NONE,
      ssl_enabled: false,
      rejectUnauthorized: false,
      name: '',
      url: '',
      username: '',
      password: '',
      authorizationIdentity: '',
      accessKeyId: '',
      secretAccessKey: '',
      sessionToken: '',
    } as IBroker;
    Object.assign(currentBroker.value, broker);
    currentBrokerInitialized.value = true;
    return broker;
  }

  const findAllBrokers = async () => {
    if (!brokers.value || brokers.value.length === 0) {
      const brokersFound = await syncEmit(Events.PLASMIDO_INPUT_BROKER_FIND_ALL_SYNC) as Array<IBroker>;
      brokers.value.length = 0;
      brokers.value.push(...brokersFound);
    }
  }

  const findBrokerById = (id: string) => {
    if (id === '') {
      throw Error('Id could not be empty');
    }
    const value = brokers.value?.find((el) => el._id === id);
    if (value !== undefined) {
      Object.assign(currentBroker.value, value);
      currentBrokerInitialized.value = true;
    }
    // log error
  };

  const updateBroker = async (value: IBroker) => {
    const savedBroker = await syncEmit(Events.PLASMIDO_INPUT_BROKER_UPDATE_SYNC, value) as IBroker;
    const index = brokers.value.findIndex((el) => el._id === savedBroker._id);
    brokers.value[index] = savedBroker;
    Object.assign(currentBroker.value, savedBroker);
    updated.value = true;
    return savedBroker._id;
  };

  const insertBroker = async (value: IBroker) => {
    const savedBroker = await syncEmit(Events.PLASMIDO_INPUT_BROKER_INSERT_SYNC, value) as IBroker;
    brokers.value.push(savedBroker);
    Object.assign(currentBroker.value, savedBroker);
    inserted.value = true;
    return savedBroker._id;
  };

  const saveBroker = async () => {
    resetState();
    return currentBroker.value._id === '' ? await insertBroker(currentBroker.value) : await updateBroker(currentBroker.value);
  }

  const initBroker = (id:string | null) => {
    resetState();
    id ? findBrokerById(id) : newBroker();
  }

  const assignNewBroker = (newValue:IBroker) => {
    Object.assign(currentBroker.value, newValue);
  }

  const resetState = () => {
    inserted.value = false;
    updated.value = false;
    currentBrokerInitialized.value = false;
  }

  // const truncate = () => {
  //   socket.emit(Events.PLASMIDO_INPUT_BROKER_REMOVE, {});
  //   console.info(PLASMIDO_VUE_USE_BROKER_REPOSITORY, ':truncate:EVENT_SENT:', Events.PLASMIDO_INPUT_BROKER_REMOVE);
  // };

  const connectOptions = computed(() => {
    const connectOptionsFromCurrentBroker = buildConnectionOptions(currentBroker.value);
    return connectOptionsFromCurrentBroker;
  });

  const isSASL = computed(() => {
    return (BrokerProtocol.SASL_PLAIN.valueOf() === currentBroker.value.protocol) ||
      (BrokerProtocol.SASL_SCRAM_256.valueOf() === currentBroker.value.protocol) ||
      (BrokerProtocol.SASL_SCRAM_512.valueOf() === currentBroker.value.protocol);
  });
  const isAws = computed(() => (BrokerProtocol.SASL_AWS_IAM.valueOf() === currentBroker.value.protocol));


  return {
    currentBroker: readonly(currentBroker),
    brokers: readonly(brokers),
    connectOptions: readonly(connectOptions),
    inserted: readonly(inserted),
    updated: readonly(updated),
    initBroker,
    newBroker,
    findAllBrokers,
    findBrokerById,
    assignNewBroker,
    saveBroker,
    isSASL,
    isAws
  }
}


