<template>
  <div class="full-width row  justify-between items-center">
    <div class="col q-pr-lg" style="overflow: auto;">
      <q-select
        v-model="selectedBroker"
        :options="brokersSelector"
        label="Cluster"
        class="q-pb-none"
        dense
        use-input
        input-debounce="0"
        @filter="filterBrokers"
        behavior="menu"
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
        use-input
        input-debounce="0"
        @filter="filterTopics"
        behavior="menu"
      >
        <template v-slot:selected-item="scope">
          <div class="ellipsis">{{ scope.opt.label }}</div>
          <q-tooltip>{{ scope.opt.label }}</q-tooltip>
        </template>

        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">
              No results
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>
  </div>
</template>
<script lang="ts">
import {computed, defineComponent, onMounted, ref, watch} from 'vue'
import {IBroker} from 'src/interfaces/broker/IBroker'
import useBrokersRepository from 'src/composables/useBrokersRepository'
import useAdminRepository from 'src/composables/useAdminRepository'
import {brokerToBrokerSelector, IBrokerSelector} from 'src/interfaces/selectors/IBrokerSelector'
import {ITopicSelector, topicToTopicSelector} from 'src/interfaces/selectors/ITopicSelector'

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
    const selectedBroker = ref(null as null | IBrokerSelector)
    const selectedTopic = ref(null as null | ITopicSelector)
    const isSelectedBrokerEmpty = ref(true)
    const topicsSelector = ref([] as Array<ITopicSelector | null>)
    const brokersSelector = ref([] as Array<IBrokerSelector | null>)
    const {brokers, currentBroker, initBroker} = useBrokersRepository()
    const {topics, findAllTopics, searchingTopics, resetTopics, resetConnection} = useAdminRepository()

    onMounted(() => {
      initBroker(props.originBrokerId)
      selectedBroker.value = brokerToBrokerSelector(currentBroker.value)
      isSelectedBrokerEmpty.value = selectedBroker.value === null
      if (props.originBrokerId === '') {
        resetTopics()
      }
    })

    watch(topics.value, () => {
      topicsSelector.value.length = 0
      topicsSelector.value = topics.value?.map(topic => topicToTopicSelector(topic.name))
    })

    const disableTopics = computed(() => isSelectedBrokerEmpty.value || topics.value?.length === 0)

    const onSelectedBrokerUpdated = async (prevValue: IBrokerSelector | null) => {
      const brokerSelector = selectedBroker.value
      isSelectedBrokerEmpty.value = brokerSelector === null
      const broker = brokerSelector?.broker
      emitSelectedBrokerChanged(broker)

      resetConnection()
      try {
        await findAllTopics(broker, 3000, 0)
      } catch (e) {
        console.error(e)
      }
      selectedTopic.value = prevValue === null ? topicToTopicSelector(props.originTopicName) : null
      emitSelectedTopicChanged(selectedTopic.value)
    }

    watch(selectedBroker, (newValue, prevValue) => {
      void onSelectedBrokerUpdated(prevValue)
    })

    const emitSelectedBrokerChanged = (value: IBroker | undefined) => {
      context.emit('selectedClusterChanged', value)
    }

    const emitSelectedTopicChanged = (value: null | ITopicSelector) => {
      context.emit('selectedTopicChanged', value?.value || '')
    }

    const filterTopics = (val: null | string, update: (anyValue: unknown) => null) => {
      if (val === null) {
        update(() => {
          topicsSelector.value.length = 0
          topicsSelector.value = topics.value?.map(topic => topicToTopicSelector(topic.name))
        })
        return
      }

      update(() => {
        const needle = val?.toLowerCase()
        topicsSelector.value.length = 0
        topicsSelector.value = topics.value?.filter(current =>  current.name.toLocaleLowerCase().indexOf(needle) > -1).map(topic => topicToTopicSelector(topic.name))
      })
    }

    const filterBrokers = (val: null | string, update: (anyValue: unknown) => null) => {
      if (val === null) {
        update(() => {
          brokersSelector.value.length = 0
          brokersSelector.value = brokers.value?.map(broker => brokerToBrokerSelector(broker))
        })
        return
      }

      update(() => {
        const needle = val?.toLowerCase()
        brokersSelector.value.length = 0
        brokersSelector.value = brokers.value?.filter(current =>  current.name.toLocaleLowerCase().indexOf(needle) > -1).map(broker => brokerToBrokerSelector(broker))
      })
    }

    return {
      selectedBroker,
      selectedTopic,
      brokersSelector,
      topicsSelector,
      isSelectedBrokerEmpty,
      disableTopics,
      searchingTopics,
      emitSelectedTopicChanged,
      filterTopics,
      filterBrokers
    }
  }
})
</script>

