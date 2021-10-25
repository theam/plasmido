<template>
  <div class="full-width row justify-between">
    <div class="col q-table__title q-pt-lg q-pl-lg">
      <span>Messages</span>
    </div>
    <div class="q-pt-none q-pb-none q-mr-md col-3">
      <ArtifactTextFormatSelect
        :text-format-artifact="textFormat"
        v-on:textFormatChanged="onTextFormatChanged"
      />
    </div>
    <div class="q-pt-none q-pb-none">
      <q-input
        class="q-pt-none q-pb-none"
        v-model="timeOutInterval"
        type="number"
        style="max-width: 100px"
        label="Refresh"
        dense
        :rules="[ val => val && val > 0 || 'Please type a valid value']"
        :hide-hint="true"
      />
    </div>
    <div class="q-pt-sm q-pb-none">
      <q-btn
        flat
        round
        dense
        icon="refresh"
        class="q-ml-md"
        size="12px"
        @click="onManualRequest"/>
    </div>
  </div>
  <div class="q-ma-md">
    <q-scroll-area style="height: 600px; max-width: 1200px;" class="bg-white shadow-3 rounded-borders q-pa-sm">
      <div v-for="message in formattedEvents" :key="message" class="q-py-xs q-px-sm">
        <div class="text-grey text-weight-thin">
          {{ message.partition }} / {{ message.offset }} - {{ message.time }}
        </div>
        <div class="text-grey">
           Key: {{ message.key }}
        </div>
        <div class="text-grey ">
          Headers: {{ message.header }}
        </div>
        <div class="q-pt-sm q-pb-sm">
          <div class="text-body2" v-if="viewAsJson">
            <pre class="jsoncolors" v-html="highlight(message.value)"></pre>
          </div>
          <div class="text-body1" v-else>
            {{ message.value }}
          </div>
        </div>
        <q-separator/>
      </div>
    </q-scroll-area>
  </div>
</template>

<script lang="ts">
import {computed, defineComponent, inject, onMounted, PropType, ref, watch} from 'vue';
import {IConsumedEvent} from 'src/interfaces/IConsumedEvent';
import useOutputMessages from 'src/components/workbook/consumer/useOutputMessages';
import {WorkBookStatus} from 'src/enums/WorkBookStatus';
import {IArtifactTextFormatSelector} from 'src/interfaces/selectors/IArtifactTextFormatSelector';
import {ArtifactTextFormat} from 'src/enums/ArtifactTextFormat';
import ArtifactTextFormatSelect from 'components/workbook/artifact/ArtifactTextFormatSelect.vue';
import Timeout = NodeJS.Timeout;
import {syntaxHighlight} from 'src/global';

export default defineComponent({
  name: 'TextViewerOutputMessages',
  components: {ArtifactTextFormatSelect},
  props: {
    textFormat: {type: Object as PropType<ArtifactTextFormat>, default: () => ArtifactTextFormat.JSON},
    currentArtifactId: String,
    consumedEventsTotal: {type: Number, default: 0},
    status: {type: Object as PropType<WorkBookStatus>}
  },
  emits: {
    textFormatChanged: null
  },
  setup(props, context) {
    const intervalId = ref(null as Timeout | null);
    const timeOutInterval = ref(3);
    const lazyRows = ref([] as Array<IConsumedEvent>);

    const {toObject, sleep} = useOutputMessages();

    const getConsumedByArtifact = inject('getConsumedByArtifact') as (artifactUUID: string, filter: string, startRow: number, count: number) => Promise<Array<IConsumedEvent>>;
    const getConsumedCountByArtifact = inject('getConsumedCountByArtifact') as (artifactUUID: string, filter: string) => Promise<number>;

    const refresh = async () => {
      const rowsNumber = await getConsumedCountByArtifact(props.currentArtifactId || '', '');
      const returnedData = await getConsumedByArtifact(props.currentArtifactId || '', '', 0, rowsNumber);
      lazyRows.value.splice(0, lazyRows.value.length, ...returnedData);
    }

    const stopInterval = () => {
      if (intervalId.value !== null) {
        clearInterval(intervalId.value);
      }
    };

    const onRequest = async () => {
      stopInterval();
      await refresh();
      if (timeOutInterval.value && timeOutInterval.value > 0) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        intervalId.value = setInterval(async () => refresh(), timeOutInterval.value * 1000);
      }
    }

    const onManualRequest = async () => {
      if (props.status === WorkBookStatus.RUNNING) {
        await onRequest();
      }
    }

    watch(() => timeOutInterval.value, async () => {
      if (props.status === WorkBookStatus.RUNNING) {
        await onRequest();
      }
    });

    watch(() => props.status, async () => {
      if (props.status !== WorkBookStatus.RUNNING) {
        stopInterval();
      } else {
        lazyRows.value = [];
        await sleep(1000);
        await onRequest();
      }
    });

    const formattedEvents = computed(() => lazyRows.value?.map(message => toObject(message)));

    onMounted(async () => {
      if (props.status === WorkBookStatus.RUNNING) {
        await onRequest();
      }
    });

    const onTextFormatChanged = (value: IArtifactTextFormatSelector) => {
      context.emit('textFormatChanged', value);
    }

    const viewAsJson = computed(() => props.textFormat === ArtifactTextFormat.JSON);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const highlight = (val: string) => syntaxHighlight(val);

    return {
      formattedEvents,
      onRequest,
      onManualRequest,
      timeOutInterval,
      onTextFormatChanged,
      viewAsJson,
      highlight
    }
  }
});
</script>

<style scoped lang="sass">
.jsoncolors ::v-deep pre
  outline: 1px solid #ccc
  padding: 5px
  margin: 5px

.jsoncolors ::v-deep .string
  color: green

.jsoncolors ::v-deep .number
  color: darkorange

.jsoncolors ::v-deep .boolean
  color: blue

.jsoncolors ::v-deep .null
  color: magenta

.jsoncolors ::v-deep .key
  color: red
</style>
