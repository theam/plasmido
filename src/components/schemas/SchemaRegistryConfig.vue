<template>
  <q-form @submit="saveSchemaRegistry" class="q-gutter-sm">
    <q-toolbar class="q-pt-lg q-pl-md q-pr-md">
      <q-toolbar-title>
        <TitleEditor
          v-model:name="localRegistry.name"
          v-on:title-changed="onSchemaRegistryNameChanged"
        />
      </q-toolbar-title>
      <q-btn
        outline
        class="q-ml-md"
        icon-right="o_play_arrow"
        :color="connectedColor"
        label="Test"
        :loading="connecting"
        v-on:click.prevent="connect(localRegistry)"
      >
        <template v-slot:loading>
          <q-spinner-radio size='xs'/>
        </template>
      </q-btn>
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
    <q-input v-model="localRegistry.url"
             :rules="[ val => val && val.length > 0 || 'Please type a url']"
             label="Server"
    />
    <q-select v-model="localRegistry.securityProtocol"
              :options="securities"
              :rules="[ val => val && val.length > 0 || 'Please type something']"
              label="Security Protocol"
    />
    <div v-if="isBasic">
      <q-input v-model="localRegistry.username"
               label="Username"
      />
      <q-input v-model="localRegistry.password"
               label="Password"
               type="password"
      />
    </div>
  </q-form>
</template>
<script lang="ts">
import {computed, defineComponent, onMounted, ref, watch} from 'vue'
import {QDialogOptions, useQuasar} from 'quasar'
import {cloneDeep} from 'lodash'
import {ISchemaRegistry} from 'src/interfaces/schemaRegistry/ISchemaRegistry'
import useSchemaRegistryRepository from 'src/composables/useSchemaRegistryRepository'
import {SchemaRegistrySecurityProtocol} from 'app/src-electron/enums/SchemaRegistrySecurityProtocol'
import useSchemaRegistry from 'src/composables/useSchemaRegistry'
import ConfirmExitDialog from 'components/ConfirmExitDialog.vue'
import {onBeforeRouteLeave, onBeforeRouteUpdate} from 'vue-router'
import TitleEditor from 'components/workbook/title/TitleEditor.vue'

const savedNotifyOptions = (name: string) => ({
  color: 'green-4',
  textColor: 'white',
  icon: 'cloud_done',
  message: 'Schema Registry `' + name + '` saved'
})

const connectingErrorNotifyOptions = (registry: ISchemaRegistry) => ({
  color: 'red-4',
  textColor: 'white',
  icon: 'cloud_done',
  message: `Could not connect to ${registry.name} (${registry.url})`
})

const confirmDialogOptions = () => ({
  component: ConfirmExitDialog,
  componentProps: {}
} as QDialogOptions)

const CONNECTED_COLOR = 'green'
const ERROR_COLOR = 'red-4'
const NOT_CONNECTED_COLOR = 'black'

export default defineComponent({
  name: 'SchemaRegistryConfig',
  props: {registryId: {type: String, default: '', required: true}},
  emits: {
    updatedRegistry: null,
    persistedRegistry: null
  },
  components: {TitleEditor},
  setup(props, context) {
    const $q = useQuasar()
    const localRegistry = ref({} as ISchemaRegistry)
    const {
      initSchemaRegistry,
      assignNewSchemaRegistry,
      saveSchemaRegistry,
      isBasic,
      inserted,
      updated,
      currentSchemaRegistry,
      hasChanges
    } = useSchemaRegistryRepository()

    const {
      connecting,
      connected,
      connectingSchemaRegistryError,
      connect
    } = useSchemaRegistry()

    onMounted(() => {
      initSchemaRegistry(props.registryId)
    })

    const asyncConfirmExistDialog = () => new Promise((resolve) => {
      $q.dialog(confirmDialogOptions())
        .onOk((dialogResult: { action: string }) => {
          if (dialogResult.action === 'ok') {
            void saveSchemaRegistry()
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

    watch(() => cloneDeep(currentSchemaRegistry.value), () => {
      Object.assign(localRegistry.value, currentSchemaRegistry.value)
    })

    watch(() => cloneDeep(localRegistry.value), () => {
      assignNewSchemaRegistry(localRegistry.value)
      context.emit('updatedRegistry', currentSchemaRegistry.value)
    })

    watch(inserted, () => {
      if (inserted) {
        $q.notify(savedNotifyOptions(localRegistry.value.name))
        context.emit('persistedRegistry', localRegistry.value)
      }
    })

    watch(updated, () => {
      if (updated) {
        $q.notify(savedNotifyOptions(localRegistry.value.name))
        context.emit('persistedRegistry', localRegistry.value)
      }
    })

    const connectedColor = computed(() => {
      const errorConnecting = connectingSchemaRegistryError.value ? ERROR_COLOR : NOT_CONNECTED_COLOR
      return connected.value ? CONNECTED_COLOR : errorConnecting
    })

    watch(connectingSchemaRegistryError, () => {
      $q.notify(connectingErrorNotifyOptions(localRegistry.value))
    })

    const onSchemaRegistryNameChanged = (value: string) => {
      localRegistry.value.name = value
    }

    return {
      connecting,
      localRegistry,
      saveSchemaRegistry,
      initSchemaRegistry,
      securities: Object.values(SchemaRegistrySecurityProtocol),
      connect,
      connectedColor,
      isBasic,
      hasChanges,
      onSchemaRegistryNameChanged
    }
  }
})
</script>
