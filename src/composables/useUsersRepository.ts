import {computed, readonly, ref} from 'vue'
import {Events} from 'app/src/enums/Events'
import {syncEmit} from 'app/src/global'
import {IUser} from 'src/interfaces/user/IUser'
import {cloneDeep, isEqual} from 'lodash'
import {v4} from 'uuid'

const users = ref([] as Array<IUser>)

/**
 * Current implementation only supports a Default user.
 */
export default function useUsersRepository() {
  const currentUser = ref({} as IUser)
  const inserted = ref(false)
  const updated = ref(false)
  const currentUserInitialized = ref(false)
  const originalUser = ref(null as null | IUser)
  const originalUserSet = ref(false)

  const newDefaultUser = () => {
    const user = {
      _id: '',
      uuid: v4(),
      name: '<Default>',
      isDefault: true,
      selectedEnvironmentUUID: ''
    } as IUser
    Object.assign(currentUser.value, user)
    currentUserInitialized.value = true
    setOriginalUser(currentUser.value)
    return user
  }

  const findAllUsers = async () => {
    if (!users.value || users.value.length === 0) {
      const usersFound = await syncEmit(Events.PLASMIDO_INPUT_USER_FIND_ALL_SYNC) as Array<IUser>
      users.value.length = 0
      users.value.push(...usersFound)
    }
  }

  const findUserById = (id: string) => {
    if (id === '') {
      throw Error('Id could not be empty')
    }
    const value = users.value?.find((el) => el._id === id)
    if (value !== undefined) {
      if (value.uuid === undefined) {
        value.uuid = v4()
      }
      Object.assign(currentUser.value, value)
      currentUserInitialized.value = true
      setOriginalUser(currentUser.value)
    }
  }

  const findDefaultUser = () => {
    const value = users.value?.find((el) => el.isDefault === true)
    Object.assign(currentUser.value, value)
    currentUserInitialized.value = true
    setOriginalUser(currentUser.value)
  }

  const updateUser = async (value: IUser) => {
    const savedUser = await syncEmit(Events.PLASMIDO_INPUT_USER_UPDATE_SYNC, value) as IUser
    const index = users.value.findIndex((el) => el._id === savedUser._id)
    users.value[index] = savedUser
    Object.assign(currentUser.value, savedUser)
    updated.value = true
    return savedUser._id
  }

  const insertUser = async (value: IUser) => {
    const savedUser = await syncEmit(Events.PLASMIDO_INPUT_USER_INSERT_SYNC, value) as IUser
    users.value.push(savedUser)
    Object.assign(currentUser.value, savedUser)
    inserted.value = true
    return savedUser._id
  }

  const saveUser = async () => {
    resetState()
    const result = currentUser.value._id === '' ? await insertUser(currentUser.value) : await updateUser(currentUser.value)
    setOriginalUser(currentUser.value)
    return result
  }

  const initUser = (id: string | null) => {
    resetState()
    id ? findUserById(id) : newDefaultUser()
  }

  const assignNewUser = (newValue: IUser) => {
    Object.assign(currentUser.value, newValue)
  }

  const resetState = () => {
    inserted.value = false
    updated.value = false
    currentUserInitialized.value = false
    originalUserSet.value = false
  }

  const setOriginalUser = (sourceUser: IUser) => {
    originalUser.value = cloneDeep(sourceUser)
    originalUserSet.value = true
  }

  const hasChanges = computed(() => {
    return !isEqual(cloneDeep(currentUser.value), originalUser.value) && originalUserSet.value
  })

  const cloneUser = async (userUUID: string) => {
    const user = users.value.find(value => value.uuid === userUUID)
    if (user) {
      const newUser = cloneDeep(user)
      newUser.name = newUser.name + ' (1)'
      newUser.uuid = v4()
      newUser._id = ''
      Object.assign(currentUser.value, newUser)
      await saveUser()
      return currentUser.value._id
    }
    return Promise.reject('Not found')
  }

  const deleteUser = async (userUUID: string) => {
    const userIndex = users.value.findIndex(value => value.uuid === userUUID)
    if (userIndex !== -1) {
      await syncEmit(Events.PLASMIDO_INPUT_USER_DELETE_SYNC, userUUID)
      users.value.splice(userIndex, 1)
      newDefaultUser()
      return Promise.resolve()
    }
    return Promise.reject('Not found')
  }

  return {
    currentUser: readonly(currentUser),
    users: readonly(users),
    inserted: readonly(inserted),
    updated: readonly(updated),
    initUser,
    newDefaultUser,
    findAllUsers,
    findUserById,
    findDefaultUser,
    assignNewUser,
    saveUser,
    hasChanges,
    cloneUser,
    deleteUser
  }
}


