<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin" style="max-width: 1500px;width:1000px">
      <q-card-section class="row items-center">
        <div class="col">
          <q-avatar icon="o_schema"/>
          <span class="q-ml-sm text-h6">New schema</span>
        </div>
        <div class="col-auto">
          <q-btn flat outline round dense icon="close" @click="onCancelClick"/>
        </div>
      </q-card-section>
      <q-card-section>
        <div class="row">
          <q-input
            dense
            class="col-10 q-pr-lg"
            v-model="localSubject"
            label="Subject"
            :rules="[ val => val && val.length > 0 || 'Please add a subject']"
          />
          <SchemaTypeSelect
            :format-artifact="localSchemaType"
            :show-plain="false"
            v-on:schemaTypeChanged="onSchemaTypeChanged"
          />
        </div>
        <JsonEditor
          :value="localSchema"
          :options="{mode: 'code', mainMenuBar: false, navigationBar: false, statusBar: false}"
          v-on:json-changed="onJsonChanged"
          v-on:json-invalid="onJsonInvalid"
        />
        <q-card-actions align="right">
          <q-btn flat color="primary" label="Cancel" @click="onCancelClick"/>
          <q-space/>
          <q-btn flat color="primary" label="Add" @click="onOKClick" :disable="isValidSchema"/>
        </q-card-actions>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import {useDialogPluginComponent} from 'quasar'
import {computed, defineComponent, PropType, ref} from 'vue'
import JsonEditor from 'components/JsonEditor.vue'
import SchemaTypeSelect from 'components/workbook/schema/SchemaTypeSelect.vue'
import {ISchemaTypeSelector} from 'src/interfaces/selectors/ISchemaTypeSelector'
import {SchemaType} from 'src/enums/SchemaType'

export default defineComponent({
  name: 'NewSchemaDialog',
  components: {JsonEditor, SchemaTypeSelect},
  props: {
    subject: {type: String, default: ''},
    schema: {type: String, default: ''},
    schemaType: {type: Object as PropType<SchemaType>, default: SchemaType.AVRO}
  },
  emits: [
    ...useDialogPluginComponent.emits
  ],
  setup(props) {
    const {dialogRef, onDialogHide, onDialogOK, onDialogCancel} = useDialogPluginComponent()

    const localSubject = ref(props.subject)
    const localSchema = ref(props.schema)
    const localSchemaType = ref(props.schemaType)

    const onOKClick = () => {
      onDialogOK({subject: localSubject.value, schema: localSchema.value, schemaType: localSchemaType.value})
    }

    const onJsonChanged = (value: string) => {
      localSchema.value = value
    }

    const onJsonInvalid = (errors: Array<unknown>) => {
      console.log('invalid json', errors)
    }

    const isValidSchema = computed(() => localSubject.value && localSchema.value)

    const onSchemaTypeChanged = (value: ISchemaTypeSelector) => {
      localSchemaType.value = SchemaType[value.value as keyof typeof SchemaType]
    }

    return {
      dialogRef,
      onDialogHide,
      onCancelClick: onDialogCancel,
      localSubject,
      localSchema,
      localSchemaType,
      onOKClick,
      onJsonChanged,
      onJsonInvalid,
      isValidSchema,
      onSchemaTypeChanged
    }
  }
})
</script>

<style scoped>
</style>
