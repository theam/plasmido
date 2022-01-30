import {computed, readonly, ref} from 'vue'
import {Events} from 'app/src/enums/Events'
import {syncEmit} from 'app/src/global'
import {ISchemaRegistry} from 'src/interfaces/schemaRegistry/ISchemaRegistry'
import {SchemaRegistrySecurityProtocol} from 'src/enums/SchemaRegistrySecurityProtocol'
import {cloneDeep, isEqual} from 'lodash'
import {v4} from 'uuid'

const schemasRegistries = ref([] as Array<ISchemaRegistry>)

/**
 * Interact with the **Confluent schema registry**
 * Convenient methods to encode, decode and register new schemas using the **Apache Avro serialization format**
 * and **Confluent's wire format**.
 */
export default function useSchemaRegistryRepository() {
  const currentSchemaRegistry = ref({} as ISchemaRegistry)
  const inserted = ref(false)
  const updated = ref(false)
  const currentSchemaRegistryInitialized = ref(false)

  const originalSchemaRegistry = ref(null as null | ISchemaRegistry)
  const originalSchemaRegistrySet = ref(false)

  const newSchemaRegistry = () => {
    const schemaRegistry = {
      _id: '',
      uuid: v4(),
      name: '',
      url: '',
      securityProtocol: SchemaRegistrySecurityProtocol.NONE,
      username: '',
      password: ''
    } as ISchemaRegistry
    Object.assign(currentSchemaRegistry.value, schemaRegistry)
    currentSchemaRegistryInitialized.value = true
    setOriginalSchemaRegistry(currentSchemaRegistry.value)
    return schemaRegistry
  }

  const findAllSchemasRegistries = async () => {
    if (!schemasRegistries.value || schemasRegistries.value.length === 0) {
      const schemaRegistryFound = await syncEmit(Events.PLASMIDO_INPUT_SCHEMA_REGISTRY_FIND_ALL_SYNC) as Array<ISchemaRegistry>
      schemasRegistries.value.length = 0
      schemasRegistries.value.push(...schemaRegistryFound)
    }
  }

  const findSchemasRegistryById = (id: string) => {
    if (id === '') {
      throw Error('Id could not be empty')
    }
    const value = schemasRegistries.value?.find((el) => el._id === id)
    if (value !== undefined) {
      if (value.uuid === undefined) {
        value.uuid = v4()
      }
      Object.assign(currentSchemaRegistry.value, value)
      currentSchemaRegistryInitialized.value = true
      setOriginalSchemaRegistry(currentSchemaRegistry.value)
    }
  }

  const updateSchemaRegistry = async (value: ISchemaRegistry) => {
    const savedSchemaRegistry = await syncEmit(Events.PLASMIDO_INPUT_SCHEMA_REGISTRY_UPDATE_SYNC, value) as ISchemaRegistry
    const index = schemasRegistries.value.findIndex((el) => el._id === savedSchemaRegistry._id)
    schemasRegistries.value[index] = savedSchemaRegistry
    Object.assign(currentSchemaRegistry.value, savedSchemaRegistry)
    updated.value = true
    return savedSchemaRegistry._id
  }

  const insertSchemaRegistry = async (value: ISchemaRegistry) => {
    const savedSchemaRegistry = await syncEmit(Events.PLASMIDO_INPUT_SCHEMA_REGISTRY_INSERT_SYNC, value) as ISchemaRegistry
    schemasRegistries.value.push(savedSchemaRegistry)
    Object.assign(currentSchemaRegistry.value, savedSchemaRegistry)
    inserted.value = true
    return savedSchemaRegistry._id
  }

  const saveSchemaRegistry = async () => {
    resetState()
    const result = currentSchemaRegistry.value._id === '' ? await insertSchemaRegistry(currentSchemaRegistry.value) : await updateSchemaRegistry(currentSchemaRegistry.value)
    setOriginalSchemaRegistry(currentSchemaRegistry.value)
    return result
  }

  const initSchemaRegistry = (id:string | null) => {
    resetState()
    id ? findSchemasRegistryById(id) : newSchemaRegistry()
  }

  const assignNewSchemaRegistry = (newValue:ISchemaRegistry) => {
    Object.assign(currentSchemaRegistry.value, newValue)
  }

  const resetState = () => {
    inserted.value = false
    updated.value = false
    currentSchemaRegistryInitialized.value = false
    originalSchemaRegistrySet.value = false
  }

  const isBasic = computed(() => currentSchemaRegistry.value.securityProtocol === SchemaRegistrySecurityProtocol.BASIC)

  const setOriginalSchemaRegistry = (sourceSchemaRegistry: ISchemaRegistry) => {
    originalSchemaRegistry.value = cloneDeep(sourceSchemaRegistry)
    originalSchemaRegistrySet.value = true
  }

  const hasChanges = computed(() => {
    return !isEqual(cloneDeep(currentSchemaRegistry.value), originalSchemaRegistry.value) && originalSchemaRegistrySet.value
  })

  const cloneSchemaRegistry = async (schemaRegistryUUID: string) => {
    const schemaRegistry = schemasRegistries.value.find(value => value.uuid === schemaRegistryUUID)
    if (schemaRegistry) {
      const newSchemaRegistry = cloneDeep(schemaRegistry)
      newSchemaRegistry.name = newSchemaRegistry.name + ' (1)'
      newSchemaRegistry.uuid = v4()
      newSchemaRegistry._id = ''
      Object.assign(currentSchemaRegistry.value, newSchemaRegistry)
      await saveSchemaRegistry()
      return currentSchemaRegistry.value._id
    }
    return Promise.reject('Not found')
  }

  const deleteSchemaRegistry = async (schemaRegistryUUID: string) => {
    const schemaRegistryIndex = schemasRegistries.value.findIndex(value => value.uuid === schemaRegistryUUID)
    if (schemaRegistryIndex !== -1) {
      await syncEmit(Events.PLASMIDO_INPUT_SCHEMA_REGISTRY_DELETE_SYNC, schemaRegistryUUID)
      schemasRegistries.value.splice(schemaRegistryIndex, 1)
      newSchemaRegistry()
      return Promise.resolve()
    }
    return Promise.reject('Not found')
  }
  return {
    currentSchemaRegistry: readonly(currentSchemaRegistry),
    schemasRegistries: readonly(schemasRegistries),
    inserted: readonly(inserted),
    updated: readonly(updated),
    initSchemaRegistry,
    newSchemaRegistry,
    findAllSchemasRegistries,
    findSchemasRegistryById,
    assignNewSchemaRegistry,
    saveSchemaRegistry,
    resetState,
    isBasic,
    hasChanges,
    cloneSchemaRegistry,
    deleteSchemaRegistry
  }
}


