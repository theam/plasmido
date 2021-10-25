<template>
  <q-toolbar class="bg-grey-3 text-primary">
    <q-toolbar-title>
      {{ localRegistry?.name ? localRegistry?.name : '...' }}
    </q-toolbar-title>
  </q-toolbar>
  <q-separator/>
  <div class="q-gutter-md" style="max-width: 600px">
    <div class="row items-end justify-between">
      <div class="col-11">
        <q-tabs
          indicator-color="transparent"
          active-color="primary"
          inline-label
          dense
          align="left"
          no-caps
          v-model="tab"
        >
          <q-tab name="config" label="Configuration"/>
          <q-tab name="schemas" label="Schemas"/>
        </q-tabs>
      </div>
    </div>
  </div>
  <q-separator/>
  <q-tab-panels v-model="tab" animated class="bg-grey-1">
    <q-tab-panel name="config">
      <SchemaRegistryConfig
        :registry-id="registryId"
        v-on:updatedRegistry="onUpdatedRegistry"
      />
    </q-tab-panel>
    <q-tab-panel name="schemas">
      <SchemaList
        :registry="localRegistry"
        :show-details="true"
      />
    </q-tab-panel>
  </q-tab-panels>

</template>

<script lang="ts">
import {defineComponent, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {ISchemaRegistry} from 'src/interfaces/schemaRegistry/ISchemaRegistry';
import SchemaRegistryConfig from 'components/schemas/SchemaRegistryConfig.vue';
import SchemaList from 'components/schemas/SchemaList.vue';

export default defineComponent({
  name: 'SchemaRegistryForm',
  components: {SchemaRegistryConfig, SchemaList},
  setup() {
    const router = useRouter();
    const route = useRoute();
    const tab = ref('config');
    const registryId = route.params.id as string;
    const localRegistry = ref({} as ISchemaRegistry);

    watch(() => localRegistry.value._id, () => {
      void router.push({name: 'registry_path', params: {id: localRegistry.value._id}});
    });

    const onUpdatedRegistry = (newRegistry: ISchemaRegistry) => {
      Object.assign(localRegistry.value, newRegistry);
    }

    return {
      tab,
      registryId,
      localRegistry,
      onUpdatedRegistry
    }
  }
});
</script>

