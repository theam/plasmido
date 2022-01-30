<template>
  <q-toolbar class="bg-grey-3 text-primary">
    <q-toolbar-title>
      {{ localEnvironment?.name || '...' }}
    </q-toolbar-title>
  </q-toolbar>
  <div class="q-gutter-md">
    <q-form @submit="saveEnvironment" @reset="onReset" class="q-gutter-sm">
      <q-toolbar class="q-pt-lg q-pl-md q-pr-md">
        <q-toolbar-title class="text-primary">
          <TitleEditor
            v-model:name="localEnvironment.name"
            v-on:title-changed="onEnvironmentNameChanged"
          />
        </q-toolbar-title>
        <q-btn
          outline
          class="q-ml-md"
          icon-right="o_save"
          color="primary"
          type="submit"
          label="Save"
          :disable="!hasChanges"
        />
      </q-toolbar>
      <div class="q-pa-md">
        <q-table
          title="Variables"
          :rows="localEnvironment.variables"
          :columns="columns"
          row-key="name"
          rows-per-page-options="0"
          :filter="filter"
          :loading="loading"
        >
          <template v-slot:top-right>
            <q-input dense debounce="300" color="primary" v-model="filter" placeholder="Search">
              <template v-slot:append>
                <q-icon name="search"/>
              </template>
            </q-input>
            <q-btn
              outline
              class="q-ml-md"
              icon-right="add"
              label="Add"
              color="primary"
              :disable="loading"
              @click="addRow"
            />
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="name" :props="props">
                {{ props.row.name }}
              </q-td>
              <q-td key="value" :props="props">
                {{ props.row.value }}
              </q-td>
              <q-td key="actions" :props="props">
                <q-btn flat rounded dense size=sm icon="edit" @click="editRow(props.row)"/>
                <q-btn flat rounded dense size=sm icon="close" @click="deleteRow(props.row)"/>
              </q-td>
            </q-tr>
          </template>
          <template v-slot:no-data>
            <div class="full-width row flex-center text-grey-6 q-gutter-sm">
              Add variables to the environment
            </div>
          </template>
        </q-table>
      </div>
    </q-form>
  </div>
</template>

<script lang="ts">
import {defineComponent, onMounted, ref, watch} from 'vue'
import {onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter} from 'vue-router'
import {IEnvironment} from 'src/interfaces/environment/IEnvironment'
import useEnvironmentsRepository from 'src/composables/useEnvironmentsRepository'
import {cloneDeep} from 'lodash'
import {QDialogOptions, useQuasar} from 'quasar'
import {IEnvironmentVariable} from 'src/interfaces/environment/IEnvironmentVariable'
import {v4} from 'uuid'
import EnvironmentVariableDialog from 'components/environment/EnvironmentVariableDialog.vue'
import TitleEditor from 'components/workbook/title/TitleEditor.vue'
import ConfirmExitDialog from 'components/ConfirmExitDialog.vue'

const columns = [
  {
    name: 'name',
    required: true,
    label: 'name',
    caption: true,
    align: 'left',
    field(row: IEnvironmentVariable) {
      return row.name
    },
    format(value: string) {
      return `${value}`
    },
    sortable: true
  },
  {
    name: 'value',
    required: true,
    label: 'value',
    caption: true,
    align: 'left',
    field(row: IEnvironmentVariable) {
      return row.value
    },
    format(value: string) {
      return `${value}`
    },
    sortable: true
  },
  {
    name: 'actions',
    label: '',
    field: 'actions'
  }
]

const savedNotifyOptions = (name: string) => ({
  color: 'green-4',
  textColor: 'white',
  icon: 'cloud_done',
  message: 'Environment `' + name + '` saved'
})

const addEnvironmentVariableDialogOptions = (options?: {name?: string, value?: string, environmentVariables?: Array<IEnvironmentVariable>, inserting?: boolean
}) => ({
  component: EnvironmentVariableDialog,
  componentProps: {name: options?.name, value: options?.value, environmentVariables: options?.environmentVariables, inserting: options?.inserting}
} as QDialogOptions)


const confirmDialogOptions = () => ({
  component: ConfirmExitDialog,
  componentProps: {}
} as QDialogOptions)

export default defineComponent({
  name: 'EnvironmentForm',
  components: {TitleEditor},
  setup() {
    const router = useRouter()
    const route = useRoute()
    const $q = useQuasar()
    const {
      currentEnvironment,
      inserted,
      updated,
      initEnvironment,
      newEnvironment,
      assignNewEnvironment,
      saveEnvironment,
      hasChanges
    } = useEnvironmentsRepository()

    const environmentId = route.params.id as string
    const localEnvironment = ref(newEnvironment())
    const loading = ref(false)
    const filter = ref('')

    onMounted(() => {
      initEnvironment(environmentId)
    })

    const asyncConfirmExistDialog = () => new Promise((resolve) => {
      $q.dialog(confirmDialogOptions())
        .onOk((dialogResult: { action: string }) => {
          if (dialogResult.action === 'ok') {
            void saveEnvironment()
          }
          resolve(true)
        })
        .onDismiss(() => resolve(false))
    })

    async function checkExit() {
      let result = true
      if (hasChanges.value) {
        return !!await asyncConfirmExistDialog()
      }
      return result
    }

    onBeforeRouteLeave(async () => {
      return await checkExit()
    })

    onBeforeRouteUpdate(async () => {
      return await checkExit()
    })

    const addRow = () => {
      loading.value = true
      $q.dialog(addEnvironmentVariableDialogOptions({environmentVariables: localEnvironment.value.variables}))
        .onOk((result: { name: string, value: string }) => {
          return localEnvironment.value.variables.push({
            uuid: v4(),
            name: result.name,
            value: result.value
          })
        })
        .onDismiss(() => loading.value = false)
    }

    const editRow = (row: IEnvironmentVariable) => {
      loading.value = true
      $q.dialog(addEnvironmentVariableDialogOptions({name: row.name, value: row.value, environmentVariables: localEnvironment.value.variables, inserting: false}))
        .onOk((result: { name: string, value: string }) => {
          const find = localEnvironment.value.variables.find(value => value.uuid === row.uuid)
          if (find) {
            find.name = result.name
            find.value = result.value
          }
        })
        .onDismiss(() => loading.value = false)
    }

    const deleteRow = (row: IEnvironmentVariable) => {
      const index = localEnvironment.value.variables.findIndex(value => value.uuid === row.uuid)
      confirm('Are you sure you want to delete this item?') && localEnvironment.value.variables.splice(index, 1)
    }

    const onUpdatedEnvironment = (env: IEnvironment) => {
      assignNewEnvironment(env)
    }

    watch(() => localEnvironment.value._id, () => {
      void router.push({name: 'environment_path', params: {id: localEnvironment.value._id}})
    })

    watch(() => cloneDeep(currentEnvironment.value), () => {
      Object.assign(localEnvironment.value, currentEnvironment.value)
    })

    watch(() => cloneDeep(localEnvironment.value), () => {
      onUpdatedEnvironment(localEnvironment.value)
    })

    watch(inserted, () => {
      if (inserted) {
        $q.notify(savedNotifyOptions(localEnvironment.value.name))
        onUpdatedEnvironment(localEnvironment.value)
      }
    })

    watch(updated, () => {
      if (updated) {
        $q.notify(savedNotifyOptions(localEnvironment.value.name))
        onUpdatedEnvironment(localEnvironment.value)
      }
    })

    const onReset = () => {
      initEnvironment(environmentId)
    }

    const onEnvironmentNameChanged = (value: string) => {
      localEnvironment.value.name = value
    }

    return {
      environmentId,
      localEnvironment,
      columns,
      onUpdatedEnvironment,
      saveEnvironment,
      onReset,
      loading,
      filter,
      addRow,
      editRow,
      deleteRow,
      onEnvironmentNameChanged,
      hasChanges
    }
  }
})
</script>

