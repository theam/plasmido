<template>
  <div class="row">
    <TitleEditor
      :name="name"
      @title-changed="onTitleChanged"
      class="col-11"
    />
    <ArtifactOptions
      :on-clone-artifact="onCloneArtifact"
      :on-delete-artifact="onDeleteArtifact"
      class="col-1"
    />
  </div>
  <ClusterTopicSelector
    :origin-broker-id="artifact?.brokerId"
    :origin-topic-name="artifact?.topicName"
    v-on:selectedClusterChanged="onSelectedClusterChanged"
    v-on:selectedTopicChanged="onSelectedTopicChanged"/>
  <div class="row  q-pt-md">
    <ArtifactSchemaTypeSelect :format-artifact="currentArtifact.schemaType"
                              v-on:schemaTypeChanged="onSchemaTypeChanged"/>
    <SchemaRegistrySubjectSelector
      :origin-subject="currentArtifact.payloadSchema?.schemaSubject"
      :origin-schema-registry-id="currentArtifact.payloadSchema?.schemaRegistryId"
      :origin-schema-id="currentArtifact.payloadSchema?.schemaId"
      v-on:selectedSchemaRegistryChanged="onSelectedSchemaRegistryChanged"
      v-on:selectedSubjectChanged="onSelectedSubjectChanged"
      class="col"
      v-if="formatAvro"
    />
  </div>
  <div class="q-pt-md">
    <q-tabs dense align="left" v-model="artifactTabs" no-caps class="text-overline">
      <q-tab name="output" label="Output"/>
      <q-tab name="settings" label="Settings"/>
    </q-tabs>
    <q-tab-panels
      v-model="artifactTabs"
      animated
      class="bg-grey-1">
      <q-tab-panel name="output">
        <div class="q-pt-sm q-pb-none">
          <q-option-group
            v-model="outputType"
            :options="[
              {label: 'Text only', value: 'text'},
              {label: 'Table', value: 'card'}
              ]"
            color="primary"
            dense
            inline
            text-weight-bolder
          />
        </div>
        <div v-if="outputType === 'text'">
          <TextViewerOutputMessages
            :current-artifact-id="artifact?.uuid"
            :consumedEvents="consumedEvents"
          />
        </div>
        <div v-else>
          <CardTableOutputMessages
            :current-artifact-id="artifact?.uuid"
            :consumedEvents="consumedEvents"
          />
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>
<script lang="ts">
import {defineComponent, PropType, ref, inject, computed, watch} from 'vue';
import ClusterTopicSelector from 'components/workbook/cluster/ClusterTopicSelector.vue';
import TitleEditor from 'components/workbook/title/TitleEditor.vue';
import {ArtifactSchemaType, ArtifactTextFormat, IArtifact} from 'src/interfaces/workbooks/IArtifact';
import {IBroker} from 'src/interfaces/broker/IBroker';
import {IConsumedEvent} from 'src/interfaces/IConsumedEvent';
import TextViewerOutputMessages from 'components/workbook/consumer/TextViewerOutputMessages.vue';
import CardTableOutputMessages from 'components/workbook/consumer/CardTableOutputMessages.vue';
import {ISubjectSelector} from 'src/interfaces/selectors/ISubjectSelector';
import {IArtifactSchemaTypeSelector} from 'src/interfaces/selectors/IArtifactSchemaTypeSelector';
import {IArtifactTextFormatSelector} from 'src/interfaces/selectors/IArtifactTextFormatSelector';
import SchemaRegistrySubjectSelector from 'components/workbook/schema/SchemaRegistrySubjectSelector.vue';
import ArtifactSchemaTypeSelect from 'components/workbook/artifact/ArtifactSchemaTypeSelect.vue';
import ArtifactOptions from 'components/workbook/artifact/ArtifactOptions.vue';

export default defineComponent({
  name: 'ConsumerForm',
  components: {
    ArtifactOptions,
    TitleEditor,
    ClusterTopicSelector,
    TextViewerOutputMessages,
    CardTableOutputMessages,
    ArtifactSchemaTypeSelect,
    SchemaRegistrySubjectSelector
  },
  props: {
    name: {type: String, required: true},
    artifact: {type: Object as PropType<IArtifact>, required: true},
    consumedEvents: {type: Object as PropType<Array<IConsumedEvent>>, default: [], required: true}
  },
  setup(props) {
    const artifactTabs = ref('output');
    const outputType = ref('card');
    const currentArtifact: IArtifact = {...props.artifact};
    const updateConsumer = inject('updateConsumer') as (param: IArtifact) => string;
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

    const onArtifactUpdated = () => {
      updateConsumer(currentArtifact);
    }


    const onSelectedSchemaRegistryChanged = (value: string) => {
      currentArtifact.payloadSchema = currentArtifact.payloadSchema || {};
      currentArtifact.payloadSchema.schemaRegistryId = value || '';
      updateConsumer(currentArtifact);
    }

    const onSelectedSubjectChanged = (value: ISubjectSelector) => {
      currentArtifact.payloadSchema = currentArtifact.payloadSchema || {};
      currentArtifact.payloadSchema.schemaSubject = value?.value || undefined;
      currentArtifact.payloadSchema.schemaId = value?.schemaId || undefined;
      updateConsumer(currentArtifact);
    }

    const onSchemaTypeChanged = (value: IArtifactSchemaTypeSelector) => {
      currentArtifact.schemaType = ArtifactSchemaType[value.value as keyof typeof ArtifactSchemaType];
      updateConsumer(currentArtifact);
    }

    const onTextFormatChanged = (value: IArtifactTextFormatSelector) => {
      currentArtifact.textFormat = ArtifactTextFormat[value.value as keyof typeof ArtifactTextFormat];
      updateConsumer(currentArtifact);
    }

    watch(() => currentArtifact.payload, value => {
      currentArtifact.payload = value as string;
      updateConsumer(currentArtifact);
    })

    const formatAvro = computed(() => currentArtifact.schemaType !== ArtifactSchemaType.PLAIN);

    const onCloneArtifact = () => {
      cloneArtifact(currentArtifact.uuid);
    }


    const onDeleteArtifact = () => {
      deleteArtifact(currentArtifact.uuid);
    }

    return {
      outputType,
      artifactTabs,
      currentArtifact,
      onSelectedClusterChanged,
      onSelectedTopicChanged,
      onArtifactUpdated,
      onTitleChanged,
      onSchemaTypeChanged,
      onSelectedSchemaRegistryChanged,
      onSelectedSubjectChanged,
      formatAvro,
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
