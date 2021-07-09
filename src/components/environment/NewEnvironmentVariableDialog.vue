<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="max-width: 1500px;width:1000px">
      TITLE
      <div align="right" class="q-mr-md q-mt-md">
        <q-btn flat outline round dense icon="close" @click="onDialogCancel"/>
      </div>
      <q-card-section>
        <q-input v-model="localName"
                 label="Variable"
        />
        <q-input v-model="localValue"
                 label="Value"
        />
        <q-card-actions align="right">
          <q-btn color="primary" label="OK" @click="onOKClick"/>
          <q-btn color="primary" label="Cancel" @click="onDialogCancel"/>
        </q-card-actions>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import {useDialogPluginComponent} from 'quasar'
import {defineComponent, ref} from 'vue';

export default defineComponent({
  name: 'NewEnvironmentVariableDialog',
  props: {
    name: {type: String, default: ''},
    value: {type: String, default: ''},
  },
  emits: [
    ...useDialogPluginComponent.emits
  ],
  setup(props) {
    const {dialogRef, onDialogHide, onDialogOK, onDialogCancel} = useDialogPluginComponent()

    const localName = ref(props.name);
    const localValue = ref(props.value);

    const onOKClick = () => {
      onDialogOK({name: localName.value, value: localValue.value});
    }

    return {
      dialogRef,
      onDialogHide,
      onDialogCancel,
      localName,
      localValue,
      onOKClick
    }
  }
});
</script>

<style scoped>
</style>
