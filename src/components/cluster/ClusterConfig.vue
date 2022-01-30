<template>
  <q-form @submit="saveBroker" class="q-gutter-sm">
    <q-toolbar class="q-pt-lg q-pl-md q-pr-md">
      <q-toolbar-title>
        <TitleEditor
          v-model:name="localBroker.name"
          v-on:title-changed="onBrokerNameChanged"
        />
      </q-toolbar-title>
      <q-btn
        outline
        class="q-ml-md"
        icon-right="o_play_arrow"
        :color="connectedColor"
        label="Test"
        :loading="connecting"
        v-on:click.prevent="connectBroker(localBroker)"
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
    <q-input v-model="localBroker.url"
             :rules="[ val => val && val.length > 0 || 'Please type something']"
             label="Server"
    />
    <q-select v-model="localBroker.protocol"
              :options="securities"
              :rules="[ val => val && val.length > 0 || 'Please type something']"
              label="Security Protocol"
    />
    <div v-if="isSASL">
      <q-input v-model="localBroker.username"
               label="Username"
      />
      <q-input v-model="localBroker.password"
               label="Password"

               type="password"/>
    </div>
    <div v-else-if="isAws">
      <q-input v-model="localBroker.authorizationIdentity"
               label="Authorization Identity" lazy-rules/>
      <q-input v-model="localBroker.accessKeyId" label="Access Key Id"
               lazy-rules/>
      <q-input v-model="localBroker.secretAccessKey" label="Secret Access Key"
               lazy-rules/>
      <q-input v-model="localBroker.sessionToken" label="Session Token"
               lazy-rules/>
    </div>
    <q-checkbox dense size="md" v-model="localBroker.ssl_enabled" label="SSL"/>
    <q-checkbox dense size="md" v-model="localBroker.rejectUnauthorized" label="Reject unauthorized"/>
  </q-form>
</template>
<script lang="ts">
import {computed, defineComponent, onMounted, ref, watch} from 'vue'
import {QDialogOptions, useQuasar} from 'quasar'
import {BrokerProtocol} from 'app/src/enums/BrokerProtocol'
import {IBroker} from 'src/interfaces/broker/IBroker'
import useAdminRepository from 'src/composables/useAdminRepository'
import useBrokersRepository from 'src/composables/useBrokersRepository'
import {cloneDeep} from 'lodash'
import ConfirmExitDialog from 'components/ConfirmExitDialog.vue'
import {onBeforeRouteLeave, onBeforeRouteUpdate} from 'vue-router'
import TitleEditor from 'components/workbook/title/TitleEditor.vue'

const savedNotifyOptions = (name: string) => ({
  color: 'green-4',
  textColor: 'white',
  icon: 'cloud_done',
  message: 'Broker `' + name + '` saved'
})

const connectingErrorNotifyOptions = (broker: IBroker) => ({
  color: 'red-4',
  textColor: 'white',
  icon: 'cloud_done',
  message: `Could not connect to ${broker.name} (${broker.url})`
})

const confirmDialogOptions = () => ({
  component: ConfirmExitDialog,
  componentProps: {}
} as QDialogOptions)

const CONNECTED_COLOR = 'green'
const ERROR_COLOR = 'red-4'
const NOT_CONNECTED_COLOR = 'black'

export default defineComponent({
  name: 'ClusterConfig',
  props: {brokerId: {type: String, default: '', required: true}},
  emits: ['updatedBroker', 'persistedBroker'],
  components: {TitleEditor},
  setup(props, context) {
    const $q = useQuasar()

    const {connecting, connected, connectingBrokerError, connectBroker} = useAdminRepository()
    const {
      currentBroker,
      inserted,
      updated,
      initBroker,
      newBroker,
      assignNewBroker,
      saveBroker,
      isSASL,
      isAws,
      hasChanges
    } = useBrokersRepository()

    const localBroker = ref(newBroker())

    onMounted(() => {
      initBroker(props.brokerId)
    })

    const asyncConfirmExistDialog = () => new Promise((resolve) => {
      $q.dialog(confirmDialogOptions())
        .onOk((dialogResult: { action: string }) => {
          if (dialogResult.action === 'ok') {
            void saveBroker()
          }
          resolve(true)
        })
        .onDismiss(() => resolve(false))
    })

    const checkExit = async () => {
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

    watch(() => cloneDeep(currentBroker.value), () => {
      Object.assign(localBroker.value, currentBroker.value)
    })

    watch(() => cloneDeep(localBroker.value), () => {
      assignNewBroker(localBroker.value)
      context.emit('updatedBroker', currentBroker.value)
    })

    watch(inserted, () => {
      if (inserted) {
        $q.notify(savedNotifyOptions(localBroker.value.name))
        context.emit('persistedBroker', localBroker.value)
      }
    })

    watch(updated, () => {
      if (updated) {
        $q.notify(savedNotifyOptions(localBroker.value.name))
        context.emit('persistedBroker', localBroker.value)
      }
    })

    const connectedColor = computed(() => {
      const errorConnecting = connectingBrokerError.value ? ERROR_COLOR : NOT_CONNECTED_COLOR
      return connected.value ? CONNECTED_COLOR : errorConnecting
    })

    watch(connectingBrokerError, () => {
      $q.notify(connectingErrorNotifyOptions(localBroker.value))
    })

    const onBrokerNameChanged = (value: string) => {
      localBroker.value.name = value
    }

    return {
      connecting,
      connectBroker,
      localBroker,
      saveBroker,
      initBroker,
      isSASL,
      isAws,
      securities: Object.values(BrokerProtocol),
      connectedColor,
      hasChanges,
      onBrokerNameChanged
    }
  }
})
</script>
