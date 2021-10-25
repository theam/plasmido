<template>
  <div class="row">
    <TitleEditor
      :name="name"
      @title-changed="onTitleChanged"
      class="col-11"
      edit-style="text-h9"
    />
    <BasicOptions
      :on-clone="onCloneArtifact"
      :on-delete="onDeleteArtifact"
      button-label="options"
      class="col-1"
    />
  </div>
  <ClusterTopicSelector
    :origin-broker-id="artifact?.brokerId"
    :origin-topic-name="artifact?.topicName"
    v-on:selectedClusterChanged="onSelectedClusterChanged"
    v-on:selectedTopicChanged="onSelectedTopicChanged"/>
  <div class="q-pt-md">
    <q-tabs dense align="left" v-model="artifactTabs" no-caps class="text-overline">
      <q-tab name="headers" label="Headers"/>
      <q-tab name="payload" label="Payload"/>
    </q-tabs>
    <q-tab-panels
      v-model="artifactTabs"
      animated
      class="bg-grey-1">
      <q-tab-panel name="headers">
        <HeaderMessage
          :artifact="artifact"
        />
      </q-tab-panel>
      <q-tab-panel name="payload">
        <PayloadMessage
          :artifact="artifact"
          :produced="produced"
          :total="total"
          v-on:artifact-changed="onPayloadChanged"
        />
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>
<script lang="ts">
import HeaderMessage from 'components/workbook/producer/HeaderMessage.vue'
import PayloadMessage from 'components/workbook/producer/PayloadMessage.vue'
import {defineComponent, PropType, ref, inject} from 'vue';
import ClusterTopicSelector from 'components/workbook/cluster/ClusterTopicSelector.vue';
import TitleEditor from 'components/workbook/title/TitleEditor.vue';
import {IArtifact} from 'src/interfaces/workbooks/IArtifact';
import {IBroker} from 'src/interfaces/broker/IBroker';
import BasicOptions from 'components/workbook/artifact/BasicOptions.vue';

export default defineComponent({
  name: 'ProducerForm',
  components: {BasicOptions, TitleEditor, HeaderMessage, PayloadMessage, ClusterTopicSelector},
  props: {
    name: {type: String, required: true},
    artifact: {type: Object as PropType<IArtifact>, required: true},
    produced: {type: Number, default: 0},
    total: {type: Number, default: 0}
  },
  setup(props) {
    const artifactTabs = ref('payload');
    const currentArtifact: IArtifact = {...props.artifact};
    const updateProducer = inject('updateProducer') as (param: IArtifact) => string;
    const cloneArtifact = inject('cloneArtifact') as (artifactUUID: string) => string;
    const deleteArtifact = inject('deleteArtifact') as (artifactUUID: string) => string;

    const onSelectedClusterChanged = (value: IBroker) => {
      currentArtifact.brokerId = value._id || '';
      onArtifactUpdated();
    }

    const onSelectedTopicChanged = (value: string) => {
      currentArtifact.topicName = value || '';
      onArtifactUpdated();
    }

    const onTitleChanged = (value: string) => {
      currentArtifact.name = value;
      onArtifactUpdated();
    }

    const onPayloadChanged = (value: IArtifact) => {
      Object.assign(currentArtifact, value);
      onArtifactUpdated();
    }

    const onArtifactUpdated = () => {
      updateProducer(currentArtifact);
    }

    const onCloneArtifact = () => {
      cloneArtifact(currentArtifact.uuid);
    }

    const onDeleteArtifact = () => {
      deleteArtifact(currentArtifact.uuid);
    }

    return {
      artifactTabs,
      onSelectedClusterChanged,
      onSelectedTopicChanged,
      onArtifactUpdated,
      onTitleChanged,
      onPayloadChanged,
      onCloneArtifact,
      onDeleteArtifact
    }
  }
});
</script>

<style lang="sass">
.q-tab__label__custom
  font-size: 12px
  line-height: 1.715em
  font-weight: 300

</style>
