<template>
  <q-form @reset="resetConnection" class="q-gutter-sm">
    <div class="q-py-none">
      <q-table
        grid
        title="Topics"
        :rows="topics"
        :columns="columns"
        row-key="name"
        :filter="filter"
        hide-header
        no-data-label="No topics"
        separator="none"
        :selection="selectable"
        @selection="selectTopic"
        v-model:selected="selected"
      >

        <template v-slot:top-right>
          <q-input borderless dense debounce="300" v-model="filter" placeholder="Search">
            <template v-slot:append>

              <q-icon name="search"/>
              <q-btn outline round dense icon="refresh" class="q-ml-md" type="reset"/>
              <q-btn round dense icon="add" class="q-ml-md" color="primary" @click="openAddTopic"/>
            </template>
          </q-input>
        </template>

        <template v-slot:item="props">
          <div class="q-pa-xs row col-12 items-start q-gutter-md grid-style-transition"
               :style="props.selected ? 'transform: scale(0.99);' : ''"
               :props="props"
               @click="props.selected = !props.selected"
          >
            <q-card class="my-card" :class="props.selected ? 'bg-grey-2' : ''" >
              <q-card-section>
                <div class="row no-wrap q-pt-sm q-pb-none items-center">
                  <div class="col text-subtitle2">
                    {{ props.row.name }}
                  </div>
                </div>
                <q-separator v-if="showDetails"/>
              </q-card-section>

              <div v-if="showDetails">
                <q-card-actions>
                  <q-btn dense flat size="md" icon="o_delete"/>
                  <q-space/>
                  <q-btn
                    color="grey"
                    flat
                    dense
                    label="show details"
                    key="props.rowIndex"
                    :icon="props.expand ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
                    @click="props.expand = !props.expand"
                  />
                </q-card-actions>

                <q-slide-transition>
                  <div v-show="props.expand">
                    <q-separator/>
                    <q-card-section class="q-pt-none q-pb-none">
                      <div class="text-caption text-grey q-pb-none">
                        <div class="row">
                          <div class="col-2">Error code</div>
                          <div class="col-2">Partition</div>
                          <div class="col-2">Leader</div>
                          <div class="col-2">Replicas</div>
                          <div class="col-2">ISR</div>
                          <div class="col-2">Offline replicas</div>
                        </div>
                      </div>
                    </q-card-section>
                    <q-card-section class="q-pt-none q-pb-none">
                      <div class="text-caption text-grey q-pb-none">
                        <div class="row" v-for="partition in props.row.partitions" :key="partition.partitionId">
                          <div class="col">{{ partition.partitionErrorCode }}</div>
                          <div class="col">{{ partition.partitionId }}</div>
                          <div class="col">{{ partition.leader }}</div>
                          <div class="col">{{ partition.replicas }}</div>
                          <div class="col">{{ partition.isr }}</div>
                          <div class="col">{{ partition.offlineReplicas }}</div>
                        </div>
                      </div>
                    </q-card-section>
                    <q-card-section class="q-pt-none q-pb-none">
                      <div class="text-caption text-grey q-pb-none">
                        <div class="row">
                          <div class="col-4">Partition</div>
                          <div class="col-4">Offset</div>
                          <div class="col-4">Offsets</div>
                        </div>
                      </div>
                    </q-card-section>
                    <q-card-section class="q-pt-none q-pb-none">
                      <div class="text-caption text-grey q-pb-none">
                        <div class="row" v-for="offset in props.row.offsets" :key="offset.partition">
                          <div class="col-4">{{ offset.partition }}</div>
                          <div class="col-4">{{ offset.offset }}</div>
                          <div class="col-4">{{ offset.low }} - {{ offset.low }}</div>
                        </div>
                      </div>
                    </q-card-section>
                  </div>
                </q-slide-transition>
              </div>
            </q-card>
          </div>
        </template>

      </q-table>
    </div>

  </q-form>
</template>

<script lang="ts">
import {computed, defineComponent, onMounted, PropType, ref, watch} from 'vue';
import {useQuasar} from 'quasar';
import useAdminRepository from 'src/composables/useAdminRepository';
import {IBroker} from 'src/interfaces/broker/IBroker';
import {IDataTopic} from 'app/src-electron/interfaces/topic/IDataTopic';
import {cloneDeep} from 'lodash';

const topicCreatedNotifyOptions = () => ({
  color: 'green-4',
  textColor: 'white',
  icon: 'cloud_done',
  message: 'Topic created'
});

const duplicateTopicNotifyOptions = () => ({
  color: 'red-4',
  textColor: 'white',
  icon: 'error',
  message: 'Duplicated topic'
});

const addTopicDialogOptions = () => ({
  title: 'Add topic',
  message: 'Topic name?',
  prompt: {
    model: '',
    type: 'text',
    isValid: (val: string) => val && val.length > 0
  },
  cancel: true,
  persistent: true
});

export default defineComponent({
  name: 'TopicList',
  props: {
    broker: {type: Object as PropType<IBroker>, required: true},
    selectedTopic: {type: String},
    showDetails: {type: Boolean, default: true}
  },
  emits: ['selectedTopicChanged'],
  setup(props, context) {
    const $q = useQuasar();
    const columns = [
      {
        name: 'topicName', required: true, label: 'Topic', align: 'left', sortable: true,
        field(row: IDataTopic) {
          return row.name;
        },
        format(val: string) {
          return `${val}`;
        }
      }
    ];
    const selected = ref([{name: props.selectedTopic || ''}]);

    const {
      topics,
      topicInserted,
      duplicatedTopicName,
      findAllTopics,
      findAllMetadata,
      saveTopic,
      resetConnection
    } = useAdminRepository();

    const loadTopics = async () => {
      await findAllTopics(props.broker);
      await findAllMetadata(props.broker);
    }

    onMounted(() => {
      void loadTopics();
    });

    watch(() => props.broker, () => void loadTopics(), {deep: true});

    watch(topicInserted, () => {
      if (topicInserted.value) $q.notify(topicCreatedNotifyOptions());
    });

    watch(duplicatedTopicName, () => {
      if (duplicatedTopicName.value) $q.notify(duplicateTopicNotifyOptions());
    });

    const openAddTopic = () => {
      $q.dialog(addTopicDialogOptions())
        .onOk((topicName: string) => void saveTopic(props.broker, topicName));
    };

    const selectTopic = (value: any) => {
      if (value) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return context.emit('selectedTopicChanged', value?.keys[0]);
      }
    };

    const selectable = computed(() => props.showDetails ? 'none' : 'single');

    return {
      topics,
      columns,
      filter: ref(''),
      resetConnection,
      openAddTopic,
      selectTopic,
      selected,
      selectable
    }
  }
});
</script>

<style scoped lang="sass">
.my-card
  width: 100%
  max-width: 100%

.grid-style-transition
  transition: transform .28s, background-color .28s

</style>
