<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="row items-center">
        <q-avatar icon="o_list_alt" />
        <span class="q-ml-sm text-h6">Environment variable</span>
      </q-card-section>
      <q-card-section>
        <q-input v-model="localName"
                 label="Variable"
                 :rules="[ val => (val && !(/\s/.test(val))) || 'Invalid value']"
        />
        <q-input v-model="localValue"
                 label="Value"
                 :rules="[ val => (val && !(/\s/.test(val))) || 'Invalid value']"
        />
        <div v-show="duplicateMessage">
        {{duplicateMessage}}
        </div>
        <q-card-actions align="right">
          <q-btn flat color="primary" label="Cancel" @click="onDialogCancel"/>
          <q-space/>
          <q-btn flat color="primary" label="OK" @click="onOKClick" :disable="okButtonDisable"/>
        </q-card-actions>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import {useDialogPluginComponent} from 'quasar'
import {computed, defineComponent, PropType, ref} from 'vue';
import {IEnvironmentVariable} from 'src/interfaces/environment/IEnvironmentVariable';

export default defineComponent({
  name: 'EnvironmentVariableDialog',
  props: {
    name: {type: String, default: ''},
    value: {type: String, default: ''},
    environmentVariables: {type: Array as PropType<Array<IEnvironmentVariable>>, default: () => [], required: true},
    inserting: {type: Boolean, default: true}
  },
  emits: [
    ...useDialogPluginComponent.emits
  ],
  setup(props) {
    const {dialogRef, onDialogHide, onDialogOK, onDialogCancel} = useDialogPluginComponent();
    const duplicateMessage = ref('');

    const localName = ref(props.name);
    const localValue = ref(props.value);

    const isDuplicateName = () => {
      const duplicateName = props.inserting && props.environmentVariables.some(value => value.name === localName.value);
      duplicateMessage.value = duplicateName ? 'Duplicate variable' : '';
      return duplicateName;
    };

    const okButtonDisable = computed(() => {
      const formatInvalid = (!localName.value || /\s/.test(localName.value)) || (!localValue.value || /\s/.test(localValue.value));
      const duplicateName = isDuplicateName();
      return formatInvalid || duplicateName;
    });

    const onOKClick = () => {
      onDialogOK({name: localName.value, value: localValue.value});
    }

    return {
      duplicateMessage,
      dialogRef,
      onDialogHide,
      onDialogCancel,
      localName,
      localValue,
      onOKClick,
      okButtonDisable
    }
  }
});
</script>

<style scoped>
</style>
