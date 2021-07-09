<template>
  <q-form @submit="saveSchemaRegistry" @reset="onReset" class="q-gutter-sm">
    <q-toolbar>
      <q-toolbar-title class="text-primary">
        Configuration
      </q-toolbar-title>
      <q-btn outline round dense icon="network_check" :loading="connecting" class="q-ml-md" :color="connectedColor"
             v-on:click.prevent="connect(localRegistry)">
        <template v-slot:loading>
          <q-spinner-radio size='xs'/>
        </template>
      </q-btn>
      <q-btn outline round dense icon="refresh" class="q-ml-md" type="reset"/>
      <q-btn round dense icon="o_save" color="primary" class="q-ml-md" type="submit"/>
    </q-toolbar>
    <q-input v-model="localRegistry.name"
             :rules="[ val => val && val.length > 0 || 'Please type something']"
             error-message="Required field"
             label="Cluster name"

    />
    <q-input v-model="localRegistry.url"
             :rules="[ val => val && val.length > 0 || 'Please type something']"
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
    <!--    TODO https -->
    <!--    <q-checkbox dense size="md" v-model="localRegistry.ssl_enabled" label="SSL"/>-->
  </q-form>
</template>
<script lang="ts">
import {computed, defineComponent, onMounted, ref, watch} from 'vue';
import {useQuasar} from 'quasar';
import {cloneDeep} from 'lodash';
import {ISchemaRegistry} from 'src/interfaces/schemaRegistry/ISchemaRegistry';
import useSchemaRegistryRepository from 'src/composables/useSchemaRegistryRepository';
import {SchemaRegistrySecurityProtocol} from 'app/src-electron/enums/SchemaRegistrySecurityProtocol';
import useSchemaRegistry from 'src/composables/useSchemaRegistry';

const savedNotifyOptions = (name: string) => ({
  color: 'green-4',
  textColor: 'white',
  icon: 'cloud_done',
  message: 'Schema Registry `' + name + '` saved'
});

const connectingErrorNotifyOptions = (registry: ISchemaRegistry) => ({
  color: 'red-4',
  textColor: 'white',
  icon: 'cloud_done',
  message: `Could not connect to ${registry.name} (${registry.url})`
});

const CONNECTED_COLOR = 'green';
const ERROR_COLOR = 'red-4';
const NOT_CONNECTED_COLOR = 'black';

export default defineComponent({
  name: 'SchemaRegistryConfig',
  props: {registryId: {type: String, default: '', required: true}},
  emits: {
    updatedRegistry: null,
    persistedRegistry: null
  },
  setup(props, context) {
    const $q = useQuasar();
    const localRegistry = ref({} as ISchemaRegistry);
    const {
      initSchemaRegistry,
      assignNewSchemaRegistry,
      saveSchemaRegistry,
      isBasic,
      inserted,
      updated,
      currentSchemaRegistry
    } = useSchemaRegistryRepository();

    const {
      connecting,
      connected,
      connectingSchemaRegistryError,
      resetConnection,
      connect
    } = useSchemaRegistry();

    onMounted(() => {
      initSchemaRegistry(props.registryId);
    });

    watch(() => cloneDeep(currentSchemaRegistry.value), () => {
      Object.assign(localRegistry.value, currentSchemaRegistry.value);
    });

    watch(() => cloneDeep(localRegistry.value), () => {
      assignNewSchemaRegistry(localRegistry.value);
      context.emit('updatedRegistry', currentSchemaRegistry.value);
    });

    watch(inserted, () => {
      if (inserted) {
        $q.notify(savedNotifyOptions(localRegistry.value.name));
        context.emit('persistedRegistry', localRegistry.value);
      }
    });

    watch(updated, () => {
      if (updated) {
        $q.notify(savedNotifyOptions(localRegistry.value.name));
        context.emit('persistedRegistry', localRegistry.value);
      }
    });

    const connectedColor = computed(() => {
      const errorConnecting = connectingSchemaRegistryError.value ? ERROR_COLOR : NOT_CONNECTED_COLOR;
      return connected.value ? CONNECTED_COLOR : errorConnecting;
    });

    watch(connectingSchemaRegistryError, () => {
      $q.notify(connectingErrorNotifyOptions(localRegistry.value));
    });

    const onReset = () => {
      resetConnection();
      initSchemaRegistry(props.registryId);
    };

    return {
      connecting,
      localRegistry,
      saveSchemaRegistry,
      initSchemaRegistry,
      securities: Object.values(SchemaRegistrySecurityProtocol),
      onReset,
      connect,
      connectedColor,
      isBasic
    }
  }
});
</script>
