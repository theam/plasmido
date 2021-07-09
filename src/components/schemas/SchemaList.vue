<template>
  <q-form @reset="resetConnection" class="q-gutter-sm">
    <div class="q-py-none">
      <q-table
        grid
        title="Schemas"
        :rows="schemas"
        :columns="columns"
        row-key="subject"
        :filter="filter"
        hide-header
        no-data-label="No schemas"
        separator="none"
        :selection="selectable"
        @selection="selectSchema"
        v-model:selected="selected"
      >

        <template v-slot:top-right>
          <q-input borderless dense debounce="300" v-model="filter" placeholder="Search">
            <template v-slot:append>

              <q-icon name="search"/>
              <q-btn outline round dense icon="refresh" class="q-ml-md" type="reset"/>
              <q-btn round dense icon="add" class="q-ml-md" color="primary" @click="openAddSchema"/>
            </template>
          </q-input>
        </template>

        <template v-slot:item="props">
          <div class="q-pa-xs row col-12 items-start q-gutter-md grid-style-transition"
               :style="props.selected ? 'transform: scale(0.99);' : ''"
               :props="props"
               @click="props.selected = !props.selected"
          >
            <q-card class="my-card" :class="props.selected ? 'bg-grey-2' : ''">
              <q-card-section>
                <div class="row no-wrap q-pt-sm q-pb-none items-center">
                  <div class="col-11 text-subtitle2">
                    {{ props.row.subject || props.row.schema.name }}
                  </div>
                  <div class="col-1 text-caption text-grey q-pb-none">
                    [{{ props.row.id }}] Version: {{ props.row.version }}
                  </div>
                </div>
                <q-separator v-if="showDetails"/>
              </q-card-section>

              <div v-if="showDetails">
                <q-card-actions>
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
                        <pre class="jsoncolors" v-html="highlight(props.row.schema)"></pre>
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
import {QDialogOptions, useQuasar} from 'quasar';
import {ISchemaRegistry} from 'src/interfaces/schemaRegistry/ISchemaRegistry';
import useSchemaRegistry from 'src/composables/useSchemaRegistry';
import {syntaxHighlight} from 'src/global';
import NewSchemaDialog from 'components/schemas/NewSchemaDialog.vue';
import {AvroSchema, ExtendedAvroSchema} from '@plasmido/plasmido-schema-registry/dist/@types';

const schemaCreatedNotifyOptions = () => ({
  color: 'green-4',
  textColor: 'white',
  icon: 'cloud_done',
  message: 'Schema created'
});

const duplicateTopicNotifyOptions = () => ({
  color: 'red-4',
  textColor: 'white',
  icon: 'error',
  message: 'Duplicated subject'
});

const addSchemaDialogOptions = () => ({
  component: NewSchemaDialog,
  componentProps: {
    subject: '',
    schema: ''
  }
} as QDialogOptions);

export default defineComponent({
  name: 'SchemaList',
  props: {
    registry: {type: Object as PropType<ISchemaRegistry>, required: true},
    selectedSubject: {type: String},
    showDetails: {type: Boolean, default: true}
  },
  emits: ['selectedSchemaChanged'],
  setup(props, context) {
    const $q = useQuasar();
    const columns = [ // remove?
      {
        name: 'subject', required: true, label: 'Subject', align: 'left', sortable: true,
        field(row: ExtendedAvroSchema) {
          return row.subject || (row.schema as AvroSchema).name; // todo JsonSchemas?
        },
        format(val: string) {
          return `${val}`;
        }
      }
    ];
    const selected = ref([{name: props.selectedSubject || ''}]);

    const {
      schemas,
      schemaInserted,
      // schemaUpdated,
      getSchemas,
      saveSchema,
      resetConnection
    } = useSchemaRegistry();

    const loadSchemas = async () => {
      await getSchemas(props.registry);
    }

    onMounted(() => {
      void loadSchemas();
    });

    watch(() => props.registry, () => void loadSchemas(), {deep: true});

    watch(schemaInserted, () => {
      if (schemaInserted.value) $q.notify(schemaCreatedNotifyOptions());
    });

    const openAddSchema = () => {
      $q.dialog(addSchemaDialogOptions())
        .onOk((result: {
          subject: string,
          schema: string
        }) => {
          const {subject, schema} = result;
          return void saveSchema(props.registry, subject, schema);
        });
    };

    const selectSchema = (value: any) => {
      if (value) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return context.emit('selectedSchemaChanged', value?.keys[0]);
      }
    };

    const selectable = computed(() => props.showDetails ? 'none' : 'single');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const highlight = (val: string) => syntaxHighlight(val);

    return {
      schemas,
      columns,
      selected,
      selectable,
      filter: ref(''),
      resetConnection,
      openAddSchema,
      selectSchema,
      highlight
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
