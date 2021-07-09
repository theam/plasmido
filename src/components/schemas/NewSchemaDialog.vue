<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="max-width: 1500px;width:1000px">
      <div align="right" class="q-mr-md q-mt-md">
        <q-btn flat outline round dense icon="close" @click="onCancelClick"/>
      </div>
      <q-card-section>
        <q-input v-model="localSubject"
                 label="Subject"
        />
        <q-input type="textarea"
                 v-model="localSchema"
                 label="Schema"
        />
        <q-card-actions align="right">
          <q-btn color="primary" label="OK" @click="onOKClick"/>
          <q-btn color="primary" label="Cancel" @click="onCancelClick"/>
        </q-card-actions>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import {useDialogPluginComponent} from 'quasar'
import {defineComponent, ref} from 'vue';

export default defineComponent({
  name: 'NewSchemaDialog',
  props: {
    subject: {type: String, default: ''},
    schema: {type: String, default: ''},
  },
  emits: [
    ...useDialogPluginComponent.emits
  ],
  setup(props) {
    const {dialogRef, onDialogHide, onDialogOK, onDialogCancel} = useDialogPluginComponent()

    const localSubject = ref(props.subject);
    const localSchema = ref(props.schema);

    const onOKClick = () => {
      onDialogOK({subject: localSubject.value, schema: localSchema.value});
    }

    return {
      dialogRef,
      onDialogHide,
      onCancelClick: onDialogCancel,
      localSubject,
      localSchema,
      onOKClick
    }
  }
});
</script>

<style scoped>
</style>
