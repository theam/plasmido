import {computed, readonly, ref} from 'vue';
import {Events} from 'app/src/enums/Events';
import {syncEmit} from 'app/src/global';
import {ISchemaRegistry} from 'src/interfaces/schemaRegistry/ISchemaRegistry';
import {buildSchemaConnectionOptions} from 'src/composables/connectionOptionsBuilder';
import {SchemaRegistrySecurityProtocol} from 'src/enums/SchemaRegistrySecurityProtocol';

const schemasRegistries = ref([] as Array<ISchemaRegistry>);

/**
 * Interact with the **Confluent schema registry**
 * Convenient methods to encode, decode and register new schemas using the **Apache Avro serialization format**
 * and **Confluent's wire format**.
 */
export default function useSchemaRegistryRepository() {
  const currentSchemaRegistry = ref({} as ISchemaRegistry);
  const inserted = ref(false);
  const updated = ref(false);
  const currentSchemaRegistryInitialized = ref(false);

  const newSchemaRegistry = () => {
    const schemaRegistry = {
      _id: '',
      name: '',
      url: '',
      securityProtocol: SchemaRegistrySecurityProtocol.NONE,
      username: '',
      password: ''
    } as ISchemaRegistry;
    Object.assign(currentSchemaRegistry.value, schemaRegistry);
    currentSchemaRegistryInitialized.value = true;
    return schemaRegistry;
  }

  const findAllSchemasRegistries = async () => {
    if (!schemasRegistries.value || schemasRegistries.value.length === 0) {
      const schemaRegistryFound = await syncEmit(Events.PLASMIDO_INPUT_SCHEMA_REGISTRY_FIND_ALL_SYNC) as Array<ISchemaRegistry>;
      schemasRegistries.value.length = 0;
      schemasRegistries.value.push(...schemaRegistryFound);
    }
  }

  const findSchemasRegistryById = (id: string) => {
    if (id === '') {
      throw Error('Id could not be empty');
    }
    const value = schemasRegistries.value?.find((el) => el._id === id);
    if (value !== undefined) {
      Object.assign(currentSchemaRegistry.value, value);
      currentSchemaRegistryInitialized.value = true;
    }
  };

  const updateSchemaRegistry = async (value: ISchemaRegistry) => {
    const savedSchemaRegistry = await syncEmit(Events.PLASMIDO_INPUT_SCHEMA_REGISTRY_UPDATE_SYNC, value) as ISchemaRegistry;
    const index = schemasRegistries.value.findIndex((el) => el._id === savedSchemaRegistry._id);
    schemasRegistries.value[index] = savedSchemaRegistry;
    Object.assign(currentSchemaRegistry.value, savedSchemaRegistry);
    updated.value = true;
    return savedSchemaRegistry._id;
  };

  const insertSchemaRegistry = async (value: ISchemaRegistry) => {
    const savedSchemaRegistry = await syncEmit(Events.PLASMIDO_INPUT_SCHEMA_REGISTRY_INSERT_SYNC, value) as ISchemaRegistry;
    schemasRegistries.value.push(savedSchemaRegistry);
    Object.assign(currentSchemaRegistry.value, savedSchemaRegistry);
    inserted.value = true;
    return savedSchemaRegistry._id;
  };

  const saveSchemaRegistry = async () => {
    resetState();
    return currentSchemaRegistry.value._id === '' ? await insertSchemaRegistry(currentSchemaRegistry.value) : await updateSchemaRegistry(currentSchemaRegistry.value);
  }

  const initSchemaRegistry = (id:string | null) => {
    resetState();
    id ? findSchemasRegistryById(id) : newSchemaRegistry();
  }

  const assignNewSchemaRegistry = (newValue:ISchemaRegistry) => {
    Object.assign(currentSchemaRegistry.value, newValue);
  }

  const resetState = () => {
    inserted.value = false;
    updated.value = false;
    currentSchemaRegistryInitialized.value = false;
  }

  // const truncate = () => {
  //   socket.emit(Events.PLASMIDO_INPUT_BROKER_REMOVE, {});
  //   console.info(PLASMIDO_VUE_USE_BROKER_REPOSITORY, ':truncate:EVENT_SENT:', Events.PLASMIDO_INPUT_BROKER_REMOVE);
  // };

  const connectOptions = computed(() => {
    return buildSchemaConnectionOptions(currentSchemaRegistry.value);
  });

  const isBasic = computed(() => currentSchemaRegistry.value.securityProtocol === SchemaRegistrySecurityProtocol.BASIC);

  return {
    currentSchemaRegistry: readonly(currentSchemaRegistry),
    schemasRegistries: readonly(schemasRegistries),
    connectOptions: readonly(connectOptions),
    inserted: readonly(inserted),
    updated: readonly(updated),
    initSchemaRegistry,
    newSchemaRegistry,
    findAllSchemasRegistries,
    findSchemasRegistryById,
    assignNewSchemaRegistry,
    saveSchemaRegistry,
    resetState,
    isBasic
  }
}


