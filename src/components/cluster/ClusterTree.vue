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
                  <q-btn class="gt-xs" size="12px" flat dense round icon="more_vert"/>
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

export default defineComponent({
  name: 'ClusterTree',
  setup() {
    const {brokers} = useBrokersRepository();

    const brokerItems = computed(() =>
      brokers.value.map(value => {
        const id = value._id || '';
        return {
          to: '/clusters/' + id,
          name: value.name,
          url: value.url,
          protocol: value.protocol
        } as IClusterTreeItem;
      }));

    return {
      splitterModel: ref(25),
      brokerItems
    }
  }
});
</script>

<style scoped>

</style>
