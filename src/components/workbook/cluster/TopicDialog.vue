<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="max-width: 1500px;width:1000px">
      <div align="right" class="q-mr-md q-mt-md">
        <q-btn flat outline round dense icon="close" @click="onDialogCancel"/>
      </div>
      <q-card-section>
        <TopicList :broker="selectedBroker"
                   :selected-topic="selectedTopic"
                   :show-details="false"
                   v-on:selectedTopicChanged="onDialogOK"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import {useDialogPluginComponent} from 'quasar'
import {defineComponent, PropType} from 'vue';
import TopicList from 'components/topics/TopicList.vue';
import {IBrokerOptions} from 'src/interfaces/broker/IBrokerOptions';
import {IBroker} from 'src/interfaces/broker/IBroker';

export default defineComponent({
  name: 'TopicDialog',
  components: {TopicList},
  props: {
    selectedBroker: {type: Object as PropType<IBroker>, required: true},
    clusterOptions: {type: Object as PropType<IBrokerOptions>, required: true},
    selectedTopic: {type: String}
  },
  emits: [
    ...useDialogPluginComponent.emits
  ],
  setup() {
    const {dialogRef, onDialogHide, onDialogOK, onDialogCancel} = useDialogPluginComponent()

    return {
      dialogRef,
      onDialogOK,
      onDialogHide,
      onDialogCancel,
    }
  }
});
</script>

<style scoped>
</style>
