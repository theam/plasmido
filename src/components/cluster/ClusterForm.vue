<template>
  <q-toolbar class="bg-grey-3 text-primary">
    <q-toolbar-title>
      {{ localBroker?.name || '...' }}
    </q-toolbar-title>
  </q-toolbar>
  <q-separator/>
  <div class="q-gutter-md" style="max-width: 600px">
    <div class="row items-end justify-between">
      <div class="col-11">
        <q-tabs dense v-model="tab" inline-label no-caps>
          <q-tab name="config" icon="mail" label="Config"/>
          <q-tab name="topics" icon="movie" label="Topics"/>
        </q-tabs>
      </div>
    </div>
  </div>
  <q-tab-panels v-model="tab" animated class="bg-grey-1">
    <q-tab-panel name="config">
      <ClusterConfig :brokerId="brokerId"
      v-on:updatedBroker="onUpdatedBroker"
      />
    </q-tab-panel>
    <q-tab-panel name="topics">
      <TopicList :broker="localBroker"/>
    </q-tab-panel>
  </q-tab-panels>
</template>

<script lang="ts">
import {defineComponent, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import ClusterConfig from 'components/cluster/ClusterConfig.vue';
import {IBroker} from 'src/interfaces/broker/IBroker';
import TopicList from 'components/topics/TopicList.vue';

export default defineComponent({
  name: 'ClusterForm',
  components: {ClusterConfig, TopicList},
  setup() {
    const router = useRouter();
    const route = useRoute();
    const tab = ref('config');
    const brokerId = route.params.id as string;
    const localBroker = ref({} as IBroker);

    watch(() => localBroker.value._id, () => {
      void router.push({name: 'broker_path', params: {id: localBroker.value._id}});
    });

    const onUpdatedBroker = (newBroker: IBroker) => {
      Object.assign(localBroker.value, newBroker);
    }

    return {
      tab,
      brokerId,
      localBroker,
      onUpdatedBroker
    }
  }
});
</script>

