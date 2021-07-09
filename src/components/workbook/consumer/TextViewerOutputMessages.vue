<template>
  <div class="q-table__title q-pt-lg q-pl-lg">
    <span>Messages</span>
  </div>
  <div class="q-ma-md">
    <q-scroll-area style="height: 300px; max-width: 1200px;" class="bg-white shadow-3 rounded-borders q-pa-sm">
      <div v-for="message in formattedEvents" :key="message" class="q-py-xs q-px-sm">
        <div>
          [{{message.time}}] ({{ message.partition }} / {{ message.offset }}) # Key: {{ message.key }}
        </div>
        <div>
          Headers: {{ message.header }}
        </div>
        <div>
          Value: {{ message.value }}
        </div>
        <q-separator/>
      </div>
    </q-scroll-area>
  </div>
</template>

<script lang="ts">
import {computed, defineComponent, PropType} from 'vue';
import {IConsumedEvent} from 'src/interfaces/IConsumedEvent';
import useOutputMessages from 'components/workbook/consumer/useOutputMessages';

export default defineComponent({
  name: 'TextViewerOutputMessages',
  props: {
    consumedEvents: {type: Object as PropType<Array<IConsumedEvent>>, default: [], required: true},
    currentArtifactId: String
  },
  setup(props) {
    const size = computed(() => props.consumedEvents?.length || '0');

    const {toObject} = useOutputMessages();
    const formattedEvents = computed(() => props.consumedEvents?.map(message => toObject(message)));

    return {
      size,
      formattedEvents
    }
  }
});
</script>

<style scoped>

</style>
