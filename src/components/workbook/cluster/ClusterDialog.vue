<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="max-width: 1500px;width:1000px">
      <div align="right" class="q-mr-md q-mt-md">
        <q-btn flat outline round dense icon="close" @click="onDialogCancel"/>
      </div>
      <q-card-section>
        <ClusterConfig
          :broker-id="brokerId"
          v-on:persistedBroker="onDialogOK"/>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import {useDialogPluginComponent} from 'quasar'
import {defineComponent} from 'vue';
import ClusterConfig from 'components/cluster/ClusterConfig.vue';

export default defineComponent({
  name: 'ClusterDialog',
  components: {ClusterConfig},
  props: {brokerId: String},
  emits: [
    ...useDialogPluginComponent.emits
  ],

  setup() {
    const {dialogRef, onDialogHide, onDialogOK, onDialogCancel} = useDialogPluginComponent();

    return {
      dialogRef,
      onDialogOK,
      onDialogHide,
      onDialogCancel
    }
  }
});
</script>

<style scoped>
</style>
