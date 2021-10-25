<template>
  <q-dialog
    ref="dialogRef"
    persistent
    @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="row items-center">
        <q-avatar icon="o_view_headline" />
        <span class="q-ml-sm text-h6">Header</span>
      </q-card-section>
      <q-card-section>
        <q-input v-model="localKey"
                 label="Header"
                 :rules="[ val => (val && !(/\s/.test(val))) || 'Invalid value']"
        />
        <q-input v-model="localValue"
                 label="Value"
                 :rules="[ val => (val && !(/\s/.test(val))) || 'Invalid value']"
        />
        <div v-show="duplicateMessage">
          {{ duplicateMessage }}
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
import {IHeaders} from 'kafkajs';

export default defineComponent({
  name: 'NewHeaderDialog',
  props: {
    headerKey: {type: [String, Number], default: () => ('')},
    value: {type: String, default: () => ('')},
    headers: {type: Object as PropType<IHeaders>, default: () => ({}), required: true},
    inserting: {type: Boolean, default: true}
  },
  emits: [
    ...useDialogPluginComponent.emits
  ],
  setup(props) {
    const {dialogRef, onDialogHide, onDialogOK, onDialogCancel} = useDialogPluginComponent();
    const duplicateMessage = ref('');

    const localKey = ref(props.headerKey);
    const localValue = ref(props.value);

    const isDuplicateHeader = () => {
      const duplicateHeader = props.inserting && props.headers[localKey.value];
      duplicateMessage.value = duplicateHeader ? 'Duplicate header' : '';
      return duplicateHeader;
    };

    const okButtonDisable = computed(() => {
      let localKeyResult;
      let localValueResult;
      if (typeof localKey.value === 'string') {
        localKeyResult = (!localKey.value || /\s/.test(localKey.value));
      }
      if (typeof localValue.value === 'string') {
        localValueResult = (!localValue.value || /\s/.test(localValue.value));
      }
      const formatInvalid = ((localKeyResult !== undefined && localKeyResult) || (localValueResult !== undefined && localValueResult));
      const duplicateHeader = isDuplicateHeader();
      return formatInvalid || duplicateHeader;
    });

    const onOKClick = () => {
      onDialogOK({key: localKey.value, value: localValue.value});
    }

    return {
      duplicateMessage,
      dialogRef,
      onDialogHide,
      onDialogCancel,
      localKey,
      localValue,
      onOKClick,
      okButtonDisable
    }
  }
});
</script>

<style scoped>
</style>
