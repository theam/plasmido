<template>
  <div>
    <q-splitter
      v-model="splitterModel"
      class="absolute-full"
      :limits="[15, 40]"
    >
      <template v-slot:before>
        <div class="q-pa-md">
          <q-toolbar>
            <q-toolbar-title class="text-primary">
              Workbooks
            </q-toolbar-title>
            <q-btn flat round dense icon="add" :to="{name: 'workbook_path', params: {}}"/>
          </q-toolbar>
          <q-separator/>
          <q-list v-for="item in workbookItems" :key="item.name">
            <q-item clickable v-ripple :to="{ path: item.to }">
              <q-item-section>
                <q-item-label lines="1">
                  {{ item.name }}
                </q-item-label>
                <q-item-label caption lines="2">
                  <span>Producers:{{ item.producersSize }} Consumers:{{ item.consumersSize }}</span>
                </q-item-label>
              </q-item-section>
              <q-item-section top side>
                <div class="text-grey-8 q-gutter-xs">
                  <BasicOptions
                    :on-clone="onCloneWorkbook"
                    :on-delete="onDeleteWorkbook"
                    :value="item.uuid"
                    class="col-1"
                  />
                </div>
              </q-item-section>
            </q-item>
            <q-separator/>
          </q-list>
        </div>
      </template>

      <template v-slot:after>
        <router-view :key="$route.path"/>
      </template>
    </q-splitter>
  </div>
</template>

<script lang="ts">
import {computed, ref} from 'vue'
import {ArtifactType} from 'app/src/enums/ArtifactType'
import IWorkbookTreeItem from 'src/interfaces/trees/IWorkbookTreeItem'
import useWorkbooksRepository from 'src/composables/useWorkbooksRepository'
import BasicOptions from 'components/workbook/artifact/BasicOptions.vue'
import {useRouter} from 'vue-router'
import {QDialogOptions, useQuasar} from 'quasar'
import ConfirmDialog from 'components/ConfirmDialog.vue'

const confirmDeleteDialogOptions = () => ({
  component: ConfirmDialog,
  componentProps: {
    title: 'Confirm delete',
    description: 'Do you want to delete this workbook?'
  }
} as QDialogOptions)

export default {
  name: 'WorkBookTree',
  components: {BasicOptions},
  setup() {
    const router = useRouter()
    const $q = useQuasar()
    const {workbooks, cloneWorkbook, deleteWorkbook} = useWorkbooksRepository()

    const workbookItems = computed(() =>
      workbooks.value.map(value => {
        const newId = value._id || ''
        const artifacts = value.artifacts
        let producersSize = 0
        let consumersSize = 0
        if (artifacts) {
          producersSize = artifacts.filter(artifact => artifact.type === ArtifactType.PRODUCER).length
          consumersSize = artifacts.filter(artifact => artifact.type === ArtifactType.CONSUMER).length
        }
        return {
          to: `/workbooks/${newId}`,
          name: value.name,
          producersSize: producersSize,
          consumersSize: consumersSize,
          icon: '',
          uuid: value.uuid
        } as IWorkbookTreeItem
      }))

    const onCloneWorkbook = async (workbookUUID: string) => {
      const newId = await cloneWorkbook(workbookUUID)
      await router.push({name: 'workbook_path', params: {id: newId}})
    }

    const onDeleteWorkbook = (workbookUUID: string) => {
      $q.dialog(confirmDeleteDialogOptions())
        .onOk(async () => {
          await deleteWorkbook(workbookUUID)
          await router.push({name: 'empty_workbook_path'})
        })
    }

    return {
      splitterModel: ref(25),
      workbookItems,
      onCloneWorkbook,
      onDeleteWorkbook
    }
  }
}
</script>

<style scoped>

</style>
