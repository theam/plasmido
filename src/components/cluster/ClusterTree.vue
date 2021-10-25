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
              Clusters
            </q-toolbar-title>
            <q-btn flat round dense icon="add" :to="{name: 'broker_path', params: {}}"/>
          </q-toolbar>
          <q-separator/>
          <q-list v-for="item in brokerItems" :key="item.name">
            <q-item clickable v-ripple :to="{ path: item.to }">
              <q-item-section>
                <q-item-label lines="1">
                  {{ item.name }}
                </q-item-label>
                <q-item-label caption lines="1">
                  <span>{{ item.url }}</span>
                </q-item-label>
                <q-item-label caption lines="2">
                  <span class="text-weight-bold">{{ item.protocol }}</span>
                </q-item-label>
              </q-item-section>
              <q-item-section top side>
                <div class="text-grey-8 q-gutter-xs">
                  <BasicOptions
                    :on-clone="onCloneCluster"
                    :on-delete="onDeleteCluster"
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
import IClusterTreeItem from 'src/interfaces/trees/IClusterTreeItem';
import useBrokersRepository from 'src/composables/useBrokersRepository';
import {useRouter} from 'vue-router';
import {QDialogOptions, useQuasar} from 'quasar';
import ConfirmDialog from 'components/ConfirmDialog.vue';
import BasicOptions from 'components/workbook/artifact/BasicOptions.vue';

const confirmDeleteDialogOptions = () => ({
  component: ConfirmDialog,
  componentProps: {
    title: 'Confirm delete',
    description: 'Do you want to delete this cluster?'
  }
} as QDialogOptions);

export default defineComponent({
  name: 'ClusterTree',
  components: {BasicOptions},
  setup() {
    const router = useRouter();
    const $q = useQuasar();

    const {brokers, cloneBroker, deleteBroker} = useBrokersRepository();

    const brokerItems = computed(() =>
      brokers.value.map(value => {
        const id = value._id || '';
        return {
          to: '/clusters/' + id,
          name: value.name,
          url: value.url,
          protocol: value.protocol,
          uuid: value.uuid
        } as IClusterTreeItem;
      }));

    const onCloneCluster = async (clusterUUID: string) => {
      const newId = await cloneBroker(clusterUUID);
      await router.push({name: 'broker_path', params: {id: newId}});
    }

    const onDeleteCluster = (clusterUUID: string) => {
      $q.dialog(confirmDeleteDialogOptions())
        .onOk(async () => {
          await deleteBroker(clusterUUID);
          await router.push({name: 'empty_broker_path'});
        });
    };

    return {
      splitterModel: ref(25),
      brokerItems,
      onCloneCluster,
      onDeleteCluster
    }
  }
});
</script>

<style scoped>

</style>
