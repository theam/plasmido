<template>
  <q-toolbar class="bg-grey-3 text-primary">
    <q-toolbar-title>
      {{ localBroker?.name || '...' }}
    </q-toolbar-title>
  </q-toolbar>
  <q-separator/>
  <div class="q-gutter-md q-pt-xs" style="max-width: 600px">
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
          <q-tab name="topics" label="Topics"/>
          <q-tab name="groups" label="Consumer Groups"/>
        </q-tabs>
      </div>
    </div>
  </div>
  <q-separator/>
  <q-tab-panels v-model="tab" animated class="bg-grey-1">
    <q-tab-panel name="config">
      <ClusterConfig :brokerId="brokerId"
      v-on:updatedBroker="onUpdatedBroker"
      />
    </q-tab-panel>
    <q-tab-panel name="topics">
      <TopicList :broker="localBroker"/>
    </q-tab-panel>
    <q-tab-panel name="groups">
      <ClientGroupList :broker="localBroker"/>
    </q-tab-panel>
  </q-tab-panels>
</template>

<script lang="ts">
import {defineComponent, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import ClusterConfig from 'components/cluster/ClusterConfig.vue'
import {IBroker} from 'src/interfaces/broker/IBroker'
import TopicList from 'components/topics/TopicList.vue'
import ClientGroupList from 'components/clients/ClientGroupList.vue'

export default defineComponent({
  name: 'ClusterForm',
  components: {ClusterConfig, TopicList, ClientGroupList},
  setup() {
    const router = useRouter()
    const route = useRoute()
    const tab = ref('config')
    const brokerId = route.params.id as string
    const localBroker = ref({} as IBroker)

    watch(() => localBroker.value._id, () => {
      void router.push({name: 'broker_path', params: {id: localBroker.value._id}})
    })

    const onUpdatedBroker = (newBroker: IBroker) => {
      Object.assign(localBroker.value, newBroker)
    }

    return {
      tab,
      brokerId,
      localBroker,
      onUpdatedBroker
    }
  }
})
</script>

