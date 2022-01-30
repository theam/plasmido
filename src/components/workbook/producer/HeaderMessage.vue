<template>
  <div class="q-gutter-md">
    <div class="q-pa-none">
      <q-table
          title="Headers"
          :rows="rows"
          :columns="columns"
          row-key="key"
      >
        <template v-slot:top-right>
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
            <q-td key="key" :props="props">
              {{ props.row.key }}
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
  </div>
</template>

<script lang="ts">
import {computed, defineComponent, PropType, ref} from 'vue'
import {IArtifact} from 'src/interfaces/workbooks/IArtifact'
import {QDialogOptions, useQuasar} from 'quasar'
import NewHeaderDialog from 'components/workbook/producer/NewHeaderDialog.vue'
import {IHeaders} from 'kafkajs'
import {IHeadersRow} from 'src/interfaces/IHeaderRow'

const columns = [
  {
    name: 'key',
    required: true,
    label: 'key',
    caption: true,
    align: 'left',
    field(row: string) {
      return row
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
    field(row: string | Buffer | undefined) {
      return row
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

const addHeaderDialogOptions = (options?: {
  key?: string | number,
  value?: string | Buffer | undefined,
  headers?: IHeaders,
  inserting?: boolean
}) => ({
  component: NewHeaderDialog,
  componentProps: {
    headerKey: options?.key,
    value: options?.value,
    headers: options?.headers,
    inserting: options?.inserting
  }
} as QDialogOptions)

export default defineComponent({
  name: 'HeaderMessage',
  props: {
    artifact: {type: Object as PropType<IArtifact>, required: true}
  },
  setup(props) {
    const $q = useQuasar()
    const localArtifact = ref(props.artifact)
    const loading = ref(false)

    const rows = computed(() => {
      const result = [] as Array<IHeadersRow>
      if (localArtifact.value) {
        const arrayRows = localArtifact.value.headers || {}
        Object.keys(arrayRows).forEach((key: keyof IHeaders) => {
          const value = arrayRows[key] || ''
          result.push({key: key, value: value})
        })
      }
      return result
    })

    const addRow = () => {
      loading.value = true
      if (!localArtifact.value.headers) {
        localArtifact.value.headers = {}
      }
      $q.dialog(addHeaderDialogOptions({headers: localArtifact.value.headers}))
          .onOk((result: IHeadersRow) => {
            if (localArtifact.value?.headers) {
              return localArtifact.value.headers[result.key] = result.value
            }
            return null
          })
          .onDismiss(() => loading.value = false)
    }

    const editRow = (row: IHeadersRow) => {
      loading.value = true
      $q.dialog(addHeaderDialogOptions({
        key: row.key,
        value: row.value,
        headers: localArtifact.value.headers,
        inserting: false
      }))
          .onOk((result: IHeadersRow) => {
            if (localArtifact.value?.headers) {
              delete localArtifact.value.headers[row.key]
              localArtifact.value.headers[result.key] = result.value
            }
          })
          .onDismiss(() => loading.value = false)
    }

    const deleteRow = (row: IHeadersRow) => {
      if (localArtifact.value?.headers) {
        confirm('Are you sure you want to delete this item?') && delete localArtifact.value.headers[row.key]
      }
    }

    return {
      localArtifact,
      loading,
      columns,
      rows,
      addRow,
      editRow,
      deleteRow
    }
  }
})
</script>
