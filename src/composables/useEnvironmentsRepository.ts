import {computed, readonly, ref} from 'vue'
import {syncEmit} from 'src/global'
import {Events} from 'src/enums/Events'
import {v4} from 'uuid'
import {cloneDeep, isEqual} from 'lodash'
import {IEnvironment} from 'src/interfaces/environment/IEnvironment'

const environments = ref([] as Array<IEnvironment>)

export default function useEnvironmentsRepository() {
  const currentEnvironment = ref({} as IEnvironment)
  const inserted = ref(false)
  const updated = ref(false)
  const currentEnvironmentInitialized = ref(false)
  const originalEnvironment = ref(null as null | IEnvironment)
  const originalEnvironmentSet = ref(false)

  const newEnvironment = () => {
    const environment = {
      _id: '',
      uuid: v4(),
      name: '',
      isDefault: false,
      variables: []
    } as IEnvironment
    Object.assign(currentEnvironment.value, environment)
    currentEnvironmentInitialized.value = true
    setOriginalEnvironment(currentEnvironment.value)
    return environment
  }

  const findAllEnvironments = async () => {
    if (!environments.value || environments.value.length === 0) {
      const environmentsFound = await syncEmit(Events.PLASMIDO_INPUT_ENVIRONMENT_FIND_ALL_SYNC) as Array<IEnvironment>
      environments.value.length = 0
      environments.value.push(...environmentsFound)
    }
  }

  const findEnvironmentById = (id: string) => {
    if (id === '') {
      throw Error('Id could not be empty')
    }
    const value = environments.value?.find((el) => el._id === id)
    if (value !== undefined) {
      Object.assign(currentEnvironment.value, value)
      currentEnvironmentInitialized.value = true
      setOriginalEnvironment(currentEnvironment.value)
    }
  }

  const findEnvironmentByUUID = (uuid: string) => {
    if (uuid === '') {
      throw Error('Id could not be empty')
    }
    const value = environments.value?.find((el) => el.uuid === uuid)
    if (value !== undefined) {
      Object.assign(currentEnvironment.value, value)
      currentEnvironmentInitialized.value = true
    }
  }


  const updateEnvironment = async (value: IEnvironment) => {
    const savedEnvironment = await syncEmit(Events.PLASMIDO_INPUT_ENVIRONMENT_UPDATE_SYNC, value) as IEnvironment
    const index = environments.value.findIndex((el) => el._id === savedEnvironment._id)
    environments.value[index] = savedEnvironment
    Object.assign(currentEnvironment.value, savedEnvironment)
    updated.value = true
    return savedEnvironment._id
  }

  const insertEnvironment = async (value: IEnvironment) => {
    const savedEnvironment = await syncEmit(Events.PLASMIDO_INPUT_ENVIRONMENT_INSERT_SYNC, value) as IEnvironment
    environments.value.push(savedEnvironment)
    Object.assign(currentEnvironment.value, savedEnvironment)
    inserted.value = true
    return savedEnvironment._id
  }

  const saveEnvironment = async () => {
    resetState()
    const result = currentEnvironment.value._id === '' ? await insertEnvironment(currentEnvironment.value) : await updateEnvironment(currentEnvironment.value)
    setOriginalEnvironment(currentEnvironment.value)
    return result
  }

  const initEnvironment = (id: string | null) => {
    resetState()
    id ? findEnvironmentById(id) : newEnvironment()
  }

  const assignNewEnvironment = (newValue: IEnvironment) => {
    Object.assign(currentEnvironment.value, newValue)
  }

  const resetState = () => {
    inserted.value = false
    updated.value = false
    currentEnvironmentInitialized.value = false
    originalEnvironmentSet.value = false
  }

  const setOriginalEnvironment = (sourceEnvironment: IEnvironment) => {
    originalEnvironment.value = cloneDeep(sourceEnvironment)
    originalEnvironmentSet.value = true
  }

  const hasChanges = computed(() => {
    return !isEqual(cloneDeep(currentEnvironment.value), originalEnvironment.value) && originalEnvironmentSet.value
  })

  const cloneEnvironment = async (environmentUUID: string) => {
    const environment = environments.value.find(value => value.uuid === environmentUUID)
    if (environment) {
      const newEnvironment = cloneDeep(environment)
      newEnvironment.name = newEnvironment.name + ' (1)'
      newEnvironment.uuid = v4()
      newEnvironment._id = ''
      Object.assign(currentEnvironment.value, newEnvironment)
      await saveEnvironment()
      return currentEnvironment.value._id
    }
    return Promise.reject('Not found')
  }

  const deleteEnvironment = async (environmentUUID: string) => {
    const environmentIndex = environments.value.findIndex(value => value.uuid === environmentUUID)
    if (environmentIndex !== -1) {
      await syncEmit(Events.PLASMIDO_INPUT_ENVIRONMENT_DELETE_SYNC, environmentUUID)
      environments.value.splice(environmentIndex, 1)
      newEnvironment()
      return Promise.resolve()
    }
    return Promise.reject('Not found')
  }

  return {
    currentEnvironment,
    environments,
    inserted: readonly(inserted),
    updated: readonly(updated),
    initEnvironment,
    newEnvironment,
    findAllEnvironments,
    findEnvironmentById,
    findEnvironmentByUUID,
    assignNewEnvironment,
    saveEnvironment,
    cloneEnvironment,
    deleteEnvironment,
    hasChanges
  }
}
