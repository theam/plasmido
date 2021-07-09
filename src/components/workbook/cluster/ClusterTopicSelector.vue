<template>
  <div class="full-width row  justify-between items-center">
    <div class="col" style="overflow: auto;">
      <q-select
        v-model="selectedBroker"
        :options="brokersSelector"
        label="Cluster"
        class="q-pb-none"
        dense
        behavior="dialog"
      >
        <template v-slot:selected-item="scope">
          <div class="ellipsis">{{ scope.opt.label }}</div>
          <q-tooltip>{{ scope.opt.label }}</q-tooltip>
        </template>

        <template v-slot:option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section>
              <q-item-label v-html="scope.opt.label"/>
              <q-item-label caption lines="1">
                <q-icon name="lock_open" v-if="scope.opt.broker.ssl_enabled"/>
                <q-icon name="https" v-else/>
                <span class="text-weight-bold">{{ scope.opt.broker.url }} ({{ scope.opt.broker.protocol }})</span>
              </q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>
    <div class="col" style="overflow: auto; min-width: 40px; max-width: 40px;">
      <q-btn class="gt-xs" size="12px" flat dense round icon="more_vert">
        <q-menu anchor="bottom left" self="top left">
          <q-list style="min-width: 100px">
            <q-item clickable @click="openAddCluster()">
              <q-item-section>Add</q-item-section>
            </q-item>
            <q-item clickable @click="openEditCluster()" :disable="isSelectedBrokerEmpty">
              <q-item-section>Edit</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>
    <div class="col" style="overflow: auto;">
      <q-select
        v-model="selectedTopic"
        :options="topicsSelector"
        @update:modelValue="emitSelectedTopicChanged"
        :class="{ disabled: disableTopics }"
        :loading="searchingTopics"
        label="Topic"
        class="q-pb-none"
        dense
      >
        <template v-slot:selected-item="scope">
          <div class="ellipsis">{{ scope.opt.label }}</div>
          <q-tooltip>{{ scope.opt.label }}</q-tooltip>
        </template>
      </q-select>
    </div>
    <div class="col" style="overflow: auto; min-width: 40px; max-width: 40px;">
      <q-btn dense round flat icon="o_open_in_full" @click="openTopic()"/>
    </div>
  </div>
</template>
<script lang="ts">
import {computed, defineComponent, onMounted, ref, watch} from 'vue';
import {useQuasar} from 'quasar';
import ClusterDialog from 'components/workbook/cluster/ClusterDialog.vue';
import TopicDialog from 'components/workbook/cluster/TopicDialog.vue';
import {IBroker} from 'src/interfaces/broker/IBroker';
import {buildConnectionOptions} from 'src/composables/connectionOptionsBuilder';
import useBrokersRepository from 'src/composables/useBrokersRepository';
import useAdminRepository from 'src/composables/useAdminRepository';
import {brokerToBrokerSelector, IBrokerSelector} from 'src/interfaces/selectors/IBrokerSelector';
import {ITopicSelector, topicToTopicSelector} from 'src/interfaces/selectors/ITopicSelector';

const dialogClusterNotifyOptions = (selectedBrokerId: string | null) => ({
  component: ClusterDialog,
  componentProps: {brokerId: selectedBrokerId}
});

const dialogTopicNotifyOptions = (broker: IBroker,
                                  topicName: string) => ({
  component: TopicDialog,
  componentProps: {
    selectedBroker: broker,
    clusterOptions: buildConnectionOptions(broker),
    selectedTopic: topicName
  }
});

export default defineComponent({
  name: 'ClusterTopicSelector',
  props: {
    originBrokerId: {type: String, required: true},
    originTopicName: {type: String, required: true}
  },
  emits: {
    selectedClusterChanged: null,
    selectedTopicChanged: null
  },
  setup(props, context) {
    const $q = useQuasar();
    const selectedBroker = ref(null as null | IBrokerSelector);
    const selectedTopic = ref(null as null | ITopicSelector);
    const isSelectedBrokerEmpty = ref(true);
    const {brokers, currentBroker, initBroker} = useBrokersRepository();
    const {topics, findAllTopics, searchingTopics, resetTopics, resetConnection} = useAdminRepository();

    onMounted(() => {
      initBroker(props.originBrokerId);
      selectedBroker.value = brokerToBrokerSelector(currentBroker.value);
      isSelectedBrokerEmpty.value = selectedBroker.value === null;
      if (props.originBrokerId === '') {
        resetTopics();
      }
    });

    const brokersSelector = computed(() => brokers.value?.map(broker => brokerToBrokerSelector(broker)));
    const topicsSelector = computed(() => topics.value?.map(topic => topicToTopicSelector(topic.name)));
    const disableTopics = computed(() => isSelectedBrokerEmpty.value || topics.value?.length === 0);

    const onSelectedBrokerUpdated = async (prevValue: IBrokerSelector | null) => {
      const brokerSelector = selectedBroker.value;
      isSelectedBrokerEmpty.value = brokerSelector === null;
      const broker = brokerSelector?.broker;
      emitSelectedBrokerChanged(broker);

      resetConnection();
      await findAllTopics(broker, 3000, 0);
      selectedTopic.value = prevValue === null ? topicToTopicSelector(props.originTopicName) : null;
      emitSelectedTopicChanged(selectedTopic.value);
    }

    watch(selectedBroker, (newValue, prevValue) => {
      void onSelectedBrokerUpdated(prevValue);
    });

    const openAddCluster = () => {
      $q.dialog(dialogClusterNotifyOptions(null))
        .onOk((data: IBroker) => {
          selectedBroker.value = brokerToBrokerSelector(data);
        });
    };

    const openEditCluster = () => {
      const selectedBrokerId = selectedBroker.value?.value || '';
      $q.dialog(dialogClusterNotifyOptions(selectedBrokerId))
        .onOk((data: IBroker) => {
          selectedBroker.value = brokerToBrokerSelector(data);
        });
    };

    const openTopic = () => {
      const broker = selectedBroker.value?.broker;
      const topicName = selectedTopic.value?.value;
      if (broker === undefined) {
        return null;
      }
      $q.dialog(dialogTopicNotifyOptions(broker, topicName || ''))
        .onOk((data: string) => {
          selectedTopic.value = topicToTopicSelector(data);
          emitSelectedTopicChanged(selectedTopic.value);
        });
    };

    const emitSelectedBrokerChanged = (value: IBroker | undefined) => {
      context.emit('selectedClusterChanged', value);
    };

    const emitSelectedTopicChanged = (value: null | ITopicSelector) => {
      context.emit('selectedTopicChanged', value?.value || '');
    };

    return {
      selectedBroker,
      selectedTopic,
      brokersSelector,
      topicsSelector,
      isSelectedBrokerEmpty,
      disableTopics,
      searchingTopics,
      emitSelectedTopicChanged,
      openAddCluster,
      openEditCluster,
      openTopic,
    }
  }
});
</script>

