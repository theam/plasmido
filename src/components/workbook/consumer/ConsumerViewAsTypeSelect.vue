<template>
  <q-select
    v-model="localConsumerView"
    label="View as"
    :options="options"
    dense
    class="col-2 q-pr-lg"
  />
</template>

<script lang="ts">
import {defineComponent, PropType, ref, watch} from 'vue'
import {ConsumerViewType, ConsumerViewTypeDescription} from 'src/enums/ConsumerViewType'
import {consumerViewToConsumerViewAsSelector} from 'src/interfaces/selectors/IConsumerViewAsSelector'

export default defineComponent({
  name: 'ConsumerViewAsTypeSelect',
  props: {
    consumerViewTypeProp: {
      type: Object as PropType<ConsumerViewType>, default: ConsumerViewType.TABLE
    }
  },
  emits: {
    consumerViewTypeChanged: null
  },
  setup(props, context) {
    const options = Object.values(ConsumerViewType).map(value => ({
      label: ConsumerViewTypeDescription[value as keyof typeof ConsumerViewType],
      value: value
    }))
    const localConsumerView = ref(consumerViewToConsumerViewAsSelector(props.consumerViewTypeProp))

    watch(() => localConsumerView.value, (newValue) => context.emit('consumerViewTypeChanged', newValue))
    watch(() => props.consumerViewTypeProp, (newValue) => localConsumerView.value = consumerViewToConsumerViewAsSelector(newValue))

    return {
      localConsumerView: localConsumerView,
      options
    }
  }
})
</script>
