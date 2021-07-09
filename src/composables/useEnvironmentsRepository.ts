import {readonly, ref} from 'vue';
import {syncEmit} from 'src/global';
import {Events} from 'src/enums/Events';
import {IEnvironment} from 'src/interfaces/environment/IEnvironment';
import {cloneDeep} from 'lodash';
import {v4} from 'uuid';

const environments = ref([] as Array<IEnvironment>);

export default function useEnvironmentsRepository() {
  const currentEnvironment = ref({} as IEnvironment);
  const inserted = ref(false);
  const updated = ref(false);
  const currentEnvironmentInitialized = ref(false);

  const newEnvironment = () => {
    const environment = {
      _id: '',
      uuid: v4(),
      name: '',
      variables: []
    } as IEnvironment;
    Object.assign(currentEnvironment.value, environment);
    currentEnvironmentInitialized.value = true;
    return environment;
  }

  const findAllEnvironments = async () => {
    if (!environments.value || environments.value.length === 0) {
      const environmentsFound = await syncEmit(Events.PLASMIDO_INPUT_ENVIRONMENT_FIND_ALL_SYNC) as Array<IEnvironment>;
      environments.value.length = 0;
      environments.value.push(...environmentsFound);
    }
  }

  const findEnvironmentById = (id: string) => {
    if (id === '') {
      throw Error('Id could not be empty');
    }
    const value = environments.value?.find((el) => el._id === id);
    if (value !== undefined) {
      Object.assign(currentEnvironment.value, value);
      currentEnvironmentInitialized.value = true;
    }
    // log error
  };

  const updateEnvironment = async (value: IEnvironment) => {
    const savedEnvironment = await syncEmit(Events.PLASMIDO_INPUT_ENVIRONMENT_UPDATE_SYNC, value) as IEnvironment;
    const index = environments.value.findIndex((el) => el._id === savedEnvironment._id);
    environments.value[index] = savedEnvironment;
    Object.assign(currentEnvironment.value, savedEnvironment);
    updated.value = true;
    return savedEnvironment._id;
  };

  const insertEnvironment = async (value: IEnvironment) => {
    const savedEnvironment = await syncEmit(Events.PLASMIDO_INPUT_ENVIRONMENT_INSERT_SYNC, value) as IEnvironment;
    environments.value.push(savedEnvironment);
    Object.assign(currentEnvironment.value, savedEnvironment);
    inserted.value = true;
    return savedEnvironment._id;
  };

  const saveEnvironment = async () => {
    resetState();
    return currentEnvironment.value._id === '' ? await insertEnvironment(currentEnvironment.value) : await updateEnvironment(currentEnvironment.value);
  }

  const initEnvironment = (id: string | null) => {
    resetState();
    id ? findEnvironmentById(id) : newEnvironment();
  }

  const assignNewEnvironment = (newValue: IEnvironment) => {
    Object.assign(currentEnvironment.value, newValue);
  }

  const resetState = () => {
    inserted.value = false;
    updated.value = false;
    currentEnvironmentInitialized.value = false;
  }

  // const truncate = () => {
  //   socket.emit(Events.PLASMIDO_INPUT_ENVIRONMENT_REMOVE, {});
  //   console.info(PLASMIDO_VUE_USE_ENVIRONMENT_REPOSITORY, ':truncate:EVENT_SENT:', Events.PLASMIDO_INPUT_ENVIRONMENT_REMOVE);
  // };

  return {
    currentEnvironment: readonly(currentEnvironment),
    environments: readonly(environments),
    inserted: readonly(inserted),
    updated: readonly(updated),
    initEnvironment,
    newEnvironment: newEnvironment,
    findAllEnvironments,
    findEnvironmentById,
    assignNewEnvironment,
    saveEnvironment
  }
}
