<template>
  <router-view/>
</template>
<script lang="ts">
import {defineComponent, onMounted} from 'vue'
import useWorkbooksRepository from 'src/composables/useWorkbooksRepository'
import useBrokersRepository from 'src/composables/useBrokersRepository'
import useSchemaRegistryRepository from 'src/composables/useSchemaRegistryRepository'
import useEnvironmentsRepository from 'src/composables/useEnvironmentsRepository'
import useExecution from 'src/composables/useExecution'
import {v4} from 'uuid'
import {IEnvironment} from 'src/interfaces/environment/IEnvironment'
import {IUser} from 'src/interfaces/user/IUser'
import useUsersRepository from 'src/composables/useUsersRepository'
import 'jsoneditor/dist/jsoneditor.min.css'

export default defineComponent({
  name: 'App',
  setup() {
    const {truncateExecutions} = useExecution()
    const {findAllBrokers} = useBrokersRepository()
    const {findAllSchemasRegistries} = useSchemaRegistryRepository()
    const {findAllWorkbooks} = useWorkbooksRepository()
    const {findAllEnvironments, environments, saveEnvironment, assignNewEnvironment} = useEnvironmentsRepository()
    const {findAllUsers, users, saveUser, assignNewUser} = useUsersRepository()

    const mount = async() => {
      await truncateExecutions()
      await findAllBrokers()
      await findAllSchemasRegistries()
      await findAllWorkbooks()
      await findAllEnvironments()
      await initEnvironments()
      await initUsers()
    }

    const initEnvironments = async () => {
      await findAllEnvironments()
      if (environments.value.findIndex(value => value.isDefault === true) < 0) {
        assignNewEnvironment({
          _id: '',
          uuid: v4(),
          name: '',
          isDefault: true,
          variables: []
        } as IEnvironment)
        await saveEnvironment()
      }
    }

    const initUsers = async () => {
      await findAllUsers()
      if (users.value.findIndex(value => value.isDefault === true) < 0) {
        const defaultEnvironment = environments.value.find(value => value.isDefault === true)
        if (defaultEnvironment !== undefined) {
          assignNewUser({
            _id: '',
            uuid: v4(),
            name: '<Default>',
            isDefault: true,
            selectedEnvironmentUUID: defaultEnvironment.uuid
          } as IUser)
          await saveUser()
        }
      }
    }

    onMounted(() => {
      void mount()
    })
  }
})


</script>

<style lang="sass">
</style>
