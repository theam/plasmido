<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="row items-center">
        <div class="col">
          <q-avatar icon="o_feedback"/>
          <span class="q-ml-sm text-h6">{{ title }}</span>
        </div>
        <div class="col-auto">
          <q-btn flat outline round dense icon="close" @click="onDialogCancel"/>
        </div>
      </q-card-section>
      <q-card-section>
        <div class="q-pa-md">
          {{ description }}
        </div>
        <q-card-actions align="right">
          <q-btn flat color="primary" label="Cancel" @click="onDialogCancel"/>
          <q-space/>
          <q-btn flat color="primary" label="Confirm" @click="onDialogOK"/>
        </q-card-actions>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import {useDialogPluginComponent} from 'quasar'
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'ConfirmDialog',
  emits: [
    ...useDialogPluginComponent.emits
  ],
  props: {
    title: {type: String, default: 'Do you want to save?'},
    description: {
      type: String,
      default: 'You have unsaved changed which will be lost if you choose to close it. Save these changes to avoid losing your work.'
    }
  },
  setup() {
    const {dialogRef, onDialogHide, onDialogOK, onDialogCancel} = useDialogPluginComponent();

    return {
      onDialogOK,
      dialogRef,
      onDialogHide,
      onDialogCancel,
    }

  }
});
</script>


