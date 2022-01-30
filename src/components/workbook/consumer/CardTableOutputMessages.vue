<template>
  <div class="q-py-md">
    <q-table
      grid
      title="Messages"
      :rows="formattedEvents"
      :columns="columns"
      row-key="offset"
      :filter="filter"
      hide-header
      no-data-label="No events"
      separator="none"
      v-model:pagination="pagination"
      @request="onRequest"
      :loading="loading"
    >
      <template v-slot:top-right>
        <div class="fit row justify-end">
          <div class="q-pt-none q-pb-none q-mr-md col-3">
            <ArtifactTextFormatSelect
              :text-format-artifact="textFormat"
              v-on:textFormatChanged="onTextFormatChanged"
            />
          </div>
          <q-input dense debounce="300" v-model="filter" placeholder="Search" class="q-mr-md">
            <template v-slot:append>
              <q-icon name="search" class="q-mr-md"/>
            </template>
          </q-input>
          <div class="q-pt-none q-pb-none col-1">
            <q-input
              class="q-pt-none q-pb-none"
              v-model="timeOutInterval"
              type="number"
              style="max-width: 90px"
              label="Refresh"
              dense
              :rules="[ val => val && val > 0 || 'Please type a valid value']"
              :hide-hint="true"
            />
          </div>
          <div class="q-pt-sm q-pb-none q-ml-none">
            <q-btn
              flat
              round
              dense
              icon="refresh"
              class="q-ml-sm"
              size="12px"
              @click="onManualRequest"/>
          </div>
        </div>
      </template>

      <template v-slot:loading>
        <q-inner-loading showing color="primary"/>
      </template>

      <template v-slot:item="props">
        <div class="q-pa-xs row col-12 items-start q-gutter-md" :props="props">
          <q-card class="my-card">
            <q-card-section>
              <div class="row no-wrap q-pb-sm items-center">
                <div class="col text-grey ellipsis">
                  Key: {{ props.row.key }}
                </div>
                <div class="col-auto text-grey text-caption q-pt-none q-pb-none row no-wrap items-center">
                  <q-icon name="schedule" class="q-pr-sm"/>
                  {{ props.row.time }}
                </div>
              </div>
              <q-separator/>
              <div class="row no-wrap q-pt-sm q-pb-none items-center">
                <div class="col">
                  <div class="text-body2 text-grey q-pb-none" v-if="viewAsJson">
                    <pre class="jsoncolors" v-html="highlight(props.row.value)"></pre>
                  </div>
                  <div class="text-body1 q-pb-none" v-else>
                    {{ props.row.value }}
                  </div>
                </div>
              </div>
            </q-card-section>

            <q-card-section class="q-pt-none q-pb-none">
              <div class="text-caption text-grey q-pb-none">
                Partition: {{ props.row.partition }} / Offset: {{ props.row.offset }}
              </div>
            </q-card-section>

            <q-card-actions>
              <q-space/>
              <q-btn
                color="grey"
                flat
                dense
                label="show headers"
                key="props.rowIndex"
                :icon="props.expand ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
                @click="props.expand = !props.expand"
              />
            </q-card-actions>

            <q-slide-transition>
              <div v-show="props.expand">
                <q-separator/>
                <q-card-section>
                  <div class="row no-wrap items-center">
                    <div class="col text-grey">
                      {{ props.row.header }}
                    </div>
                  </div>
                </q-card-section>
              </div>
            </q-slide-transition>
          </q-card>
        </div>
      </template>
    </q-table>
  </div>
</template>

<script lang="ts">
import {computed, defineComponent, inject, onMounted, onUnmounted, PropType, ref, watch} from 'vue'
import {IOutputMessageRow} from 'src/interfaces/IOutputMessageRow'
import {syntaxHighlight} from 'src/global'
import {WorkBookStatus} from 'src/enums/WorkBookStatus'
import {IConsumedEvent} from 'src/interfaces/IConsumedEvent'
import useOutputMessages from 'src/components/workbook/consumer/useOutputMessages'
import Timeout = NodeJS.Timeout;
import {IRequestOptions} from 'src/interfaces/workbooks/IRequestOptions'
import {IArtifactTextFormatSelector} from 'src/interfaces/selectors/IArtifactTextFormatSelector'
import {ArtifactTextFormat} from 'src/enums/ArtifactTextFormat'
import ArtifactTextFormatSelect from 'components/workbook/artifact/ArtifactTextFormatSelect.vue'

export default defineComponent({
  name: 'CardTableOutputMessages',
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
    const columns = [
      {
        name: 'message', required: true, label: 'Message', align: 'left', sortable: true,
        field(row: IOutputMessageRow) {
          return row.value
        },
        format(val: string) {
          return `${val}`
        }
      }
    ]

    const intervalId = ref(null as Timeout | null)
    const timeOutInterval = ref(3)
    const filter = ref('')
    const lazyRows = ref([] as Array<IConsumedEvent>)
    const loading = ref(false)
    const pagination = ref({
      sortBy: 'desc',
      descending: false,
      page: 1,
      rowsPerPage: 3,
      rowsNumber: 10
    })

    const getConsumedByArtifact = inject('getConsumedByArtifact') as (artifactUUID: string, filter: string, startRow: number, count: number) => Promise<Array<IConsumedEvent>>
    const getConsumedCountByArtifact = inject('getConsumedCountByArtifact') as (artifactUUID: string, filter: string) => Promise<number>

    const refresh = async (options: IRequestOptions) => {
      loading.value = true
      try {
        const {page, rowsPerPage, sortBy, descending} = options.pagination
        pagination.value.rowsNumber = await getConsumedCountByArtifact(props.currentArtifactId || '', options.filter)
        const fetchCount = rowsPerPage === 0 ? pagination.value.rowsNumber : rowsPerPage
        const startRow = (page - 1) * rowsPerPage
        const returnedData = await getConsumedByArtifact(props.currentArtifactId || '', options.filter, startRow, fetchCount)
        lazyRows.value.splice(0, lazyRows.value.length, ...returnedData)
        pagination.value.page = page
        pagination.value.rowsPerPage = rowsPerPage
        pagination.value.sortBy = sortBy
        pagination.value.descending = descending
      } finally {
        loading.value = false
      }
    }

    const stopInterval = () => {
      if (intervalId.value !== null) {
        clearInterval(intervalId.value)
      }
    }

    const onRequest = async (options: IRequestOptions) => {
      stopInterval()
      await refresh({
        pagination: options.pagination,
        filter: options.filter
      } as IRequestOptions)
      if (timeOutInterval.value && timeOutInterval.value > 0) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        intervalId.value = setInterval(async () => refresh(options), timeOutInterval.value * 1000)
      }
    }

    const update = async () => {
      if (props.status === WorkBookStatus.RUNNING) {
        await onRequest({
          pagination: pagination.value,
          filter: filter.value
        } as IRequestOptions)
      }
    }

    const onManualRequest = async () => {
      await update()
    }

    watch(() => timeOutInterval.value, async () => {
      await update()
    })

    watch(() => props.status, async () => {
      if (props.status !== WorkBookStatus.RUNNING) {
        stopInterval()
      } else {
        lazyRows.value = []
        await sleep(1000)
        await onRequest({
          pagination: pagination.value,
          filter: filter.value
        } as IRequestOptions)
      }
    })

    const {toObject, sleep} = useOutputMessages()

    const formattedEvents = computed(() => lazyRows.value?.map(message => toObject(message)))

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const highlight = (val: string) => syntaxHighlight(val)

    onMounted(() => {
      void (async () => {
        if (props.status === WorkBookStatus.RUNNING) {
          await onRequest({
            pagination: pagination.value,
            filter: filter.value
          } as IRequestOptions)
        }
      })()
    })

    onUnmounted(() => {
      stopInterval()
    })

    const onTextFormatChanged = (value: IArtifactTextFormatSelector) => {
      context.emit('textFormatChanged', value)
    }

    const viewAsJson = computed(() => props.textFormat === ArtifactTextFormat.JSON)

    return {
      columns,
      filter,
      formattedEvents,
      highlight,
      loading,
      onRequest,
      onManualRequest,
      pagination,
      timeOutInterval,
      onTextFormatChanged,
      viewAsJson
    }
  }
})

</script>

<style scoped lang="sass">
.my-card
  width: 100%
  max-width: 100%

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
