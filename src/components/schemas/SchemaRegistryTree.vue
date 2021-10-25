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
              Schema Registry
            </q-toolbar-title>
            <q-btn flat round dense icon="add" :to="{name: 'registry_path', params: {}}"/>
          </q-toolbar>
          <q-separator/>
          <q-list v-for="item in schemasRegistriesItems" :key="item.name">
            <q-item clickable v-ripple :to="{ path: item.to }">
              <q-item-section>
                <q-item-label lines="1">
                  {{ item.name }}
                </q-item-label>
                <q-item-label caption lines="1">
                  <span>{{ item.url }}</span>
                </q-item-label>
                <q-item-label caption lines="2">
                  <span class="text-weight-bold">{{ item.securityProtocol }}</span>
                </q-item-label>
              </q-item-section>
              <q-item-section top side>
                <div class="text-grey-8 q-gutter-xs">
                  <BasicOptions
                    :on-clone="onCloneSchemaRegistry"
                    :on-delete="onDeleteSchemaRegistry"
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
import useSchemaRegistryRepository from 'src/composables/useSchemaRegistryRepository';
import ISchemaRegistryTreeItem from 'src/interfaces/trees/ISchemaRegistryTreeItem';
import {useRouter} from 'vue-router';
import {QDialogOptions, useQuasar} from 'quasar';
import ConfirmDialog from 'components/ConfirmDialog.vue';
import BasicOptions from 'components/workbook/artifact/BasicOptions.vue';

const confirmDeleteDialogOptions = () => ({
  component: ConfirmDialog,
  componentProps: {
    title: 'Confirm delete',
    description: 'Do you want to delete this schema registry?'
  }
} as QDialogOptions);

export default defineComponent({
  name: 'SchemaRegistryTree',
  components: {BasicOptions},
  setup() {
    const router = useRouter();
    const $q = useQuasar();

    const {schemasRegistries, cloneSchemaRegistry, deleteSchemaRegistry} = useSchemaRegistryRepository();

    const schemasRegistriesItems = computed(() =>
      schemasRegistries.value.map(value => {
        const id = value._id || '';
        return {
          to: '/registries/' + id,
          name: value.name,
          url: value.url,
          securityProtocol: value.securityProtocol,
          uuid: value.uuid
        } as ISchemaRegistryTreeItem;
      }));

    const onCloneSchemaRegistry = async (schemaRegistryUUID: string) => {
      const newId = await cloneSchemaRegistry(schemaRegistryUUID);
      await router.push({name: 'registry_path', params: {id: newId}});
    }

    const onDeleteSchemaRegistry = (schemaRegistryUUID: string) => {
      $q.dialog(confirmDeleteDialogOptions())
        .onOk(async () => {
          await deleteSchemaRegistry(schemaRegistryUUID);
          await router.push({name: 'empty_registry_path'});
        });
    };
    return {
      splitterModel: ref(25),
      schemasRegistriesItems,
      onDeleteSchemaRegistry,
      onCloneSchemaRegistry
    }
  }
});
</script>

<style scoped>

</style>
