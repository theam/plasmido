<template>
  <q-form @submit="saveBroker" @reset="onReset" class="q-gutter-sm">
    <q-toolbar>
      <q-toolbar-title class="text-primary">
        Configuration
      </q-toolbar-title>
      <q-btn outline round dense icon="network_check" :loading="connecting" class="q-ml-md" :color="connectedColor"
             v-on:click.prevent="connectBroker(localBroker)">
        <template v-slot:loading>
          <q-spinner-radio size='xs'/>
        </template>
      </q-btn>
      <q-btn outline round dense icon="refresh" class="q-ml-md" type="reset"/>
      <q-btn round dense icon="o_save" color="primary" class="q-ml-md" type="submit"/>
    </q-toolbar>
    <q-input v-model="localBroker.name"
             :rules="[ val => val && val.length > 0 || 'Please type something']"
             error-message="Required field"
             label="Cluster name"
    />
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
import {computed, defineComponent, onMounted, ref, watch} from 'vue';
import {useQuasar} from 'quasar';
import {BrokerProtocol} from 'app/src/enums/BrokerProtocol';
import {IBroker} from 'src/interfaces/broker/IBroker';
import useAdminRepository from 'src/composables/useAdminRepository';
import useBrokersRepository from 'src/composables/useBrokersRepository';
import {cloneDeep} from 'lodash';

const savedNotifyOptions = (name: string) => ({
  color: 'green-4',
  textColor: 'white',
  icon: 'cloud_done',
  message: 'Broker `' + name + '` saved'
});

const connectingErrorNotifyOptions = (broker: IBroker) => ({
  color: 'red-4',
  textColor: 'white',
  icon: 'cloud_done',
  message: `Could not connect to ${broker.name} (${broker.url})`
});

const CONNECTED_COLOR = 'green';
const ERROR_COLOR = 'red-4';
const NOT_CONNECTED_COLOR = 'black';

export default defineComponent({
  name: 'ClusterConfig',
  props: {brokerId: {type: String, default: '', required: true}},
  emits: ['updatedBroker', 'persistedBroker'],
  setup(props, context) {
    const $q = useQuasar();

    const {connecting, connected, connectingBrokerError, connectBroker, resetConnection} = useAdminRepository();
    const {
      currentBroker,
      inserted,
      updated,
      initBroker,
      newBroker,
      assignNewBroker,
      saveBroker,
      isSASL,
      isAws
    } = useBrokersRepository();

    const localBroker = ref(newBroker());

    onMounted(() => {
      initBroker(props.brokerId);
    });

    watch(() => cloneDeep(currentBroker.value), () => {
      Object.assign(localBroker.value, currentBroker.value);
    });

    watch(() => cloneDeep(localBroker.value), () => {
      assignNewBroker(localBroker.value);
      context.emit('updatedBroker', currentBroker.value);
    });

    watch(inserted, () => {
      if (inserted) {
        $q.notify(savedNotifyOptions(localBroker.value.name));
        context.emit('persistedBroker', localBroker.value);
      }
    });

    watch(updated, () => {
      if (updated) {
        $q.notify(savedNotifyOptions(localBroker.value.name));
        context.emit('persistedBroker', localBroker.value);
      }
    });

    const connectedColor = computed(() => {
      const errorConnecting = connectingBrokerError.value ? ERROR_COLOR : NOT_CONNECTED_COLOR;
      return connected.value ? CONNECTED_COLOR : errorConnecting;
    });

    watch(connectingBrokerError, () => {
      $q.notify(connectingErrorNotifyOptions(localBroker.value));
    });

    const onReset = () => {
      resetConnection();
      initBroker(props.brokerId);
    };

    return {
      connecting,
      connectBroker,
      localBroker,
      saveBroker,
      initBroker,
      isSASL,
      isAws,
      securities: Object.values(BrokerProtocol),
      onReset,
      connectedColor,
    }
  }
});
</script>
