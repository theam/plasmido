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
              Environments
            </q-toolbar-title>
            <q-btn flat round dense icon="add" :to="{name: 'environment_path', params: {}}"/>
          </q-toolbar>
          <q-separator/>
          <q-list v-for="item in environmentItems" :key="item.name">
            <q-item clickable v-ripple :to="{ path: item.to }">
              <q-item-section>
                <q-item-label lines="1">
                  {{ item.name }}
                </q-item-label>
              </q-item-section>
              <q-item-section top side>
                <div class="text-grey-8 q-gutter-xs">
                  <BasicOptions
                    :on-clone="onCloneEnvironment"
                    :on-delete="onDeleteEnvironment"
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
import {computed, defineComponent, ref} from 'vue'
import useEnvironmentsRepository from 'src/composables/useEnvironmentsRepository'
import IEnvironmentTreeItem from 'src/interfaces/trees/IEnvironmentTreeItem'
import {QDialogOptions, useQuasar} from 'quasar'
import ConfirmDialog from 'components/ConfirmDialog.vue'
import BasicOptions from 'components/workbook/artifact/BasicOptions.vue'
import {useRouter} from 'vue-router'

const confirmDeleteDialogOptions = () => ({
  component: ConfirmDialog,
  componentProps: {
    title: 'Confirm delete',
    description: 'Do you want to delete this environment?'
  }
} as QDialogOptions)

export default defineComponent({
  name: 'EnvironmentTree',
  components: {BasicOptions},
  setup() {
    const router = useRouter()
    const $q = useQuasar()

    const {environments, cloneEnvironment, deleteEnvironment} = useEnvironmentsRepository()

    const environmentItems = computed(() =>
      environments.value.filter(value => value.isDefault !== true).map(value => {
        const id = value._id || ''
        return {
          to: '/environments/' + id,
          name: value.name,
          uuid: value.uuid
        } as IEnvironmentTreeItem
      }))

    const onCloneEnvironment = async (environmentUUID: string) => {
      const newId = await cloneEnvironment(environmentUUID)
      await router.push({name: 'environment_path', params: {id: newId}})
    }

    const onDeleteEnvironment = (environmentUUID: string) => {
      $q.dialog(confirmDeleteDialogOptions())
        .onOk(async () => {
          await deleteEnvironment(environmentUUID)
          await router.push({name: 'empty_environment_path'})
        })
    }

    return {
      splitterModel: ref(25),
      environmentItems,
      onCloneEnvironment,
      onDeleteEnvironment
    }
  }
})
</script>

<style scoped>

</style>
