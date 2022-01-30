<template>
  <q-select
    v-model="localCurrentEnvironment"
    :options="localEnvironments"
    label="Environments"
    class="q-pb-none q-pr-lg"
    filled
    dense
    style="min-width: 300px;max-width: 300px"
  >
    <template v-slot:selected-item="scope">
      <div class="ellipsis">{{ scope.opt.label }}</div>
      <q-tooltip>{{ scope.opt.label }}</q-tooltip>
    </template>

    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label v-html="scope.opt.label"/>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script lang="ts">
import {computed, defineComponent, onMounted, ref, watch} from 'vue'
import useEnvironmentsRepository from 'src/composables/useEnvironmentsRepository'
import useUsersRepository from 'src/composables/useUsersRepository'
import {environmentToEnvironmentSelector, IEnvironmentSelector} from 'src/interfaces/selectors/IEnvironmentSelector'

export default defineComponent({
  name: 'EnvironmentSelector',
  setup() {
    const localCurrentEnvironment = ref(null as null | IEnvironmentSelector)
    const {currentUser, findAllUsers, findDefaultUser, saveUser, assignNewUser} = useUsersRepository()
    const {
      findAllEnvironments,
      environments,
      currentEnvironment,
      assignNewEnvironment,
      findEnvironmentByUUID
    } = useEnvironmentsRepository()

    onMounted(async () => {
      await findAllUsers()
      findDefaultUser()
      await findAllEnvironments()
      findEnvironmentByUUID(currentUser.value.selectedEnvironmentUUID || '')
      localCurrentEnvironment.value = environmentToEnvironmentSelector(currentEnvironment.value)
    })

    const selectOption = async (environmentUUID: string) => {
      if (environmentUUID === '') {
        const defaultEnvironment = environments.value.find(value => value.isDefault === true)
        if (defaultEnvironment !== undefined) {
          assignNewEnvironment(defaultEnvironment)
        }
      } else {
        findEnvironmentByUUID(environmentUUID)
      }
      assignNewUser({...currentUser.value, selectedEnvironmentUUID: environmentUUID})
      await saveUser()
    }

    const localEnvironments = computed(() => {
      const result = environments.value?.map(environment => environmentToEnvironmentSelector(environment))
        .filter(value => value !== null)
        .sort((a, b) => a === null || b === null ? 1 : a.label.localeCompare(b.label))
      return result
    })

    watch(() => localCurrentEnvironment.value, async (newValue) => {
      if (newValue && newValue?.value !== '') {
        await selectOption(newValue.value)
      }
    })

    return {
      localCurrentEnvironment,
      selectOption,
      localEnvironments
    }
  }

})
</script>

