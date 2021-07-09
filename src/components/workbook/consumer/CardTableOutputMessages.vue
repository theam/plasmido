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
    >
      <template v-slot:top-right>
        <q-input borderless dense debounce="300" v-model="filter" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search"/>
          </template>
        </q-input>
      </template>

      <template v-slot:item="props">
        <div class="q-pa-xs row col-12 items-start q-gutter-md" :props="props">
          <q-card class="my-card">
            <q-card-section>
              <div class="row no-wrap q-pb-sm items-center">
                <div class="col text-secondary ellipsis">
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
                  <div class="text-caption text-grey q-pb-none">
                    <pre class="jsoncolors" v-html="highlight(props.row.value)"></pre>
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
                    <div class="col">
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
import {computed, defineComponent, PropType, ref} from 'vue';
import {IConsumedEvent} from 'src/interfaces/IConsumedEvent';
import useOutputMessages from 'components/workbook/consumer/useOutputMessages';
import {IOutputMessageRow} from 'src/interfaces/IOutputMessageRow';
import {syntaxHighlight} from 'src/global';

export default defineComponent({
  name: 'CardTableOutputMessages',
  props: {
    consumedEvents: {type: Object as PropType<Array<IConsumedEvent>>, default: [], required: true},
    currentArtifactId: String
  },
  setup(props) {
    const columns = [
      {
        name: 'message', required: true, label: 'Message', align: 'left', sortable: true,
        field(row: IOutputMessageRow) {
          return row.value;
        },
        format(val: string) {
          return `${val}`;
        }
      }
    ];

    const size = computed(() => props.consumedEvents?.length || '0');
    const {toObject} = useOutputMessages();

    const formattedEvents = computed(() => props
      .consumedEvents?.map(message => toObject(message))
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()));

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const highlight = (val: string) => syntaxHighlight(val);

    return {
      columns,
      filter: ref(''),
      size,
      formattedEvents,
      highlight
    }
  }
});
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
