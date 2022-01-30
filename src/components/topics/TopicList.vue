<template>
  <q-form @reset="refreshTopics" class="q-gutter-sm">
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
      >

        <template v-slot:top-right>
          <q-input
            dense
            debounce="300"
            v-model="filter"
            placeholder="Search"
          >
            <template v-slot:append>
              <q-icon name="search"/>
            </template>
          </q-input>
          <q-btn
            outline
            class="q-ml-md"
            icon-right="refresh"
            label="Refresh"
            type="reset"
            @click="refreshTopics"
          />
          <q-btn
            outline
            class="q-ml-md"
            icon-right="add"
            label="Add"
            color="primary"
            @click="openAddTopic"
          />
        </template>

        <template v-slot:item="props">
          <div class="q-pa-xs row col-12 items-start q-gutter-md grid-style-transition"
               :props="props"
          >
            <q-card class="my-card">
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
                  <q-btn
                    dense
                    flat
                    size="md"
                    icon="o_delete"
                    @click="deleteTopics(props.row.name)"
                  />
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
import {defineComponent, onMounted, PropType, ref, watch} from 'vue'
import {useQuasar} from 'quasar'
import useAdminRepository from 'src/composables/useAdminRepository'
import {IBroker} from 'src/interfaces/broker/IBroker'
import {IDataTopic} from 'app/src-electron/interfaces/topic/IDataTopic'

const topicCreatedNotifyOptions = () => ({
  color: 'green-4',
  textColor: 'white',
  icon: 'cloud_done',
  message: 'Topic created'
})

const duplicateTopicNotifyOptions = () => ({
  color: 'red-4',
  textColor: 'white',
  icon: 'error',
  message: 'Duplicated topic'
})

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
})

export default defineComponent({
  name: 'TopicList',
  props: {
    broker: {type: Object as PropType<IBroker>, required: true},
    showDetails: {type: Boolean, default: true}
  },
  setup(props) {
    const $q = useQuasar()
    const columns = [
      {
        name: 'topicName', required: true, label: 'Topic', align: 'left', sortable: true,
        field(row: IDataTopic) {
          return row.name
        },
        format(val: string) {
          return `${val}`
        }
      }
    ]

    const {
      topics,
      topicInserted,
      duplicatedTopicName,
      findAllTopics,
      findAllMetadata,
      saveTopic,
      deleteTopic,
      resetConnection
    } = useAdminRepository()

    const loadTopics = async () => {
      await findAllTopics(props.broker)
      await findAllMetadata(props.broker)
    }

    onMounted(() => {
      void loadTopics()
    })

    watch(() => props.broker, () => void loadTopics(), {deep: true})

    watch(topicInserted, () => {
      if (topicInserted.value) $q.notify(topicCreatedNotifyOptions())
    })

    watch(duplicatedTopicName, () => {
      if (duplicatedTopicName.value) $q.notify(duplicateTopicNotifyOptions())
    })

    const openAddTopic = () => {
      $q.dialog(addTopicDialogOptions())
        .onOk((topicName: string) => void saveTopic(props.broker, topicName))
    }

    const deleteTopics = (value: string) => {
      $q.dialog({
        title: 'Confirm',
        message: 'Are you sure to delete topic....?',
        ok: 'Delete',
        cancel: true,
        persistent: true
      })
        .onOk(() => void deleteTopic(props.broker, [value]))
    }

    const refreshTopics = async () => {
      resetConnection()
      await loadTopics()
    }

    return {
      topics,
      columns,
      filter: ref(''),
      resetConnection,
      openAddTopic,
      deleteTopics,
      refreshTopics
    }
  }
})
</script>

<style scoped lang="sass">
.my-card
  width: 100%
  max-width: 100%

.grid-style-transition
  transition: transform .28s, background-color .28s

</style>
