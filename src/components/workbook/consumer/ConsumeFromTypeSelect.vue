<template>
  <q-select
    v-model="localConsumeFrom"
    label="From"
    :options="options"
    dense
    class="col-2 q-pr-lg"
  />
</template>

<script lang="ts">
import {defineComponent, PropType, ref, watch} from 'vue';
import {ConsumeFromType, ConsumeFromTypeDescription} from 'src/enums/ConsumeFromType';
import {consumeFromToConsumeFromSelector} from 'src/interfaces/selectors/IConsumeFromSelector';

export default defineComponent({
  name: 'ConsumeFromTypeSelect',
  props: {
    consumeFromArtifact: {
      type: Object as PropType<ConsumeFromType>, default: ConsumeFromType.NOW
    }
  },
  emits: {
    consumeFromTypeChanged: null
  },
  setup(props, context) {
    const options = Object.values(ConsumeFromType).map(value => ({
      label: ConsumeFromTypeDescription[value as keyof typeof ConsumeFromTypeDescription],
      value: value
    }));
    const localConsumeFrom = ref(consumeFromToConsumeFromSelector(props.consumeFromArtifact));

    watch(() => localConsumeFrom.value, (newValue) => context.emit('consumeFromTypeChanged', newValue));
    watch(() => props.consumeFromArtifact, (newValue) => localConsumeFrom.value = consumeFromToConsumeFromSelector(newValue));

    return {
      localConsumeFrom,
      options
    }
  }
});
</script>
