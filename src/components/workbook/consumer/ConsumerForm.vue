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
  <div class="row  q-pt-md">
    <ConsumerViewAsTypeSelect
      :consumer-view-type-prop="outputType"
      v-on:consumerViewTypeChanged="onConsumerViewTypeChanged"
    />
    <ConsumeFromTypeSelect :consume-from-artifact="localArtifact.consumeFrom"
                           v-on:consumeFromTypeChanged="onConsumeFromTypeChanged"/>
    <ArtifactSchemaTypeSelect :format-artifact="localArtifact.schemaType"
                              v-on:schemaTypeChanged="onSchemaTypeChanged"/>
    <SchemaRegistrySelector
      :origin-schema-registry-id="localArtifact.payloadSchema?.schemaRegistryId"
      :origin-schema-id="localArtifact.payloadSchema?.schemaId"
      v-on:selectedSchemaRegistryChanged="onSelectedSchemaRegistryChanged"
      class="col"
      v-if="formatSchemaRegistry"
    />
  </div>
  <div class="q-pt-md">
    <q-tabs
      indicator-color="transparent"
      active-color="primary"
      dense
      align="left"
      v-model="artifactTabs"
      no-caps>
      <q-tab name="output" label="Output"/>
    </q-tabs>
    <q-tab-panels
      v-model="artifactTabs"
      animated
      class="bg-grey-1">
      <q-tab-panel name="output">
        <div v-if="outputType.toString() === 'LIST'">
          <TextViewerOutputMessages
            :current-artifact-id="artifact?.uuid"
            :consumed-events-total="consumedEventsTotal"
            :status="status"
            :text-format="artifact?.textFormat"
            v-on:textFormatChanged="onTextFormatChanged"
          />
        </div>
        <div v-else>
          <CardTableOutputMessages
            :current-artifact-id="artifact?.uuid"
            :consumed-events-total="consumedEventsTotal"
            :status="status"
            :text-format="artifact?.textFormat"
            v-on:textFormatChanged="onTextFormatChanged"
          />
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>
<script lang="ts">
import {computed, defineComponent, inject, PropType, ref, watch} from 'vue';
import ClusterTopicSelector from 'components/workbook/cluster/ClusterTopicSelector.vue';
import TitleEditor from 'components/workbook/title/TitleEditor.vue';
import {IArtifact} from 'src/interfaces/workbooks/IArtifact';
import {IBroker} from 'src/interfaces/broker/IBroker';
import TextViewerOutputMessages from 'components/workbook/consumer/TextViewerOutputMessages.vue';
import CardTableOutputMessages from 'components/workbook/consumer/CardTableOutputMessages.vue';
import {IArtifactSchemaTypeSelector} from 'src/interfaces/selectors/IArtifactSchemaTypeSelector';
import {IArtifactTextFormatSelector} from 'src/interfaces/selectors/IArtifactTextFormatSelector';
import ArtifactSchemaTypeSelect from 'components/workbook/artifact/ArtifactSchemaTypeSelect.vue';
import BasicOptions from 'components/workbook/artifact/BasicOptions.vue';
import {WorkBookStatus} from 'src/enums/WorkBookStatus';
import {ArtifactSchemaType} from 'src/enums/ArtifactSchemaType';
import {IConsumeFromSelector} from 'src/interfaces/selectors/IConsumeFromSelector';
import {ConsumeFromType} from 'src/enums/ConsumeFromType';
import {ArtifactTextFormat} from 'src/enums/ArtifactTextFormat';
import ConsumeFromTypeSelect from 'components/workbook/consumer/ConsumeFromTypeSelect.vue';
import ConsumerViewAsTypeSelect from 'components/workbook/consumer/ConsumerViewAsTypeSelect.vue';
import {ConsumerViewType} from 'src/enums/ConsumerViewType';
import {IConsumerViewAsSelector} from 'src/interfaces/selectors/IConsumerViewAsSelector';
import SchemaRegistrySelector from 'components/workbook/schema/SchemaRegistrySelector.vue';

export default defineComponent({
  name: 'ConsumerForm',
  components: {
    BasicOptions,
    TitleEditor,
    ClusterTopicSelector,
    TextViewerOutputMessages,
    CardTableOutputMessages,
    ArtifactSchemaTypeSelect,
    SchemaRegistrySelector,
    ConsumeFromTypeSelect,
    ConsumerViewAsTypeSelect
  },
  props: {
    name: {type: String, required: true},
    artifact: {type: Object as PropType<IArtifact>, required: true},
    consumedEventsTotal: {type: Number, default: 0},
    status: {type: Object as PropType<WorkBookStatus>}
  },
  setup(props) {
    const artifactTabs = ref('output');
    const outputType = ref(ConsumerViewType.TABLE);
    const localArtifact = ref(props.artifact);
    const updateConsumer = inject('updateConsumer') as (param: IArtifact) => string;
    const cloneArtifact = inject('cloneArtifact') as (artifactUUID: string) => string;
    const deleteArtifact = inject('deleteArtifact') as (artifactUUID: string) => string;

    const onSelectedClusterChanged = (value: IBroker) => {
      localArtifact.value.brokerId = value._id || '';
      onArtifactUpdated();
    }

    const onSelectedTopicChanged = (value: string) => {
      localArtifact.value.topicName = value || '';
      onArtifactUpdated();
    }

    const onTitleChanged = (value: string) => {
      localArtifact.value.name = value;
      onArtifactUpdated();
    }

    const onArtifactUpdated = () => {
      updateConsumer(localArtifact.value);
    }

    const onSelectedSchemaRegistryChanged = (value: string) => {
      localArtifact.value.payloadSchema = localArtifact.value.payloadSchema || {};
      localArtifact.value.payloadSchema.schemaRegistryId = value || '';
      updateConsumer(localArtifact.value);
    }

    const onConsumeFromTypeChanged = (value: IConsumeFromSelector) => {
      localArtifact.value.consumeFrom = ConsumeFromType[value.value as keyof typeof ConsumeFromType];
      updateConsumer(localArtifact.value);
    }

    const onSchemaTypeChanged = (value: IArtifactSchemaTypeSelector) => {
      localArtifact.value.schemaType = ArtifactSchemaType[value.value as keyof typeof ArtifactSchemaType];
      if (value.value === ArtifactSchemaType.PLAIN) {
        localArtifact.value.payloadSchema = {};
      }
      updateConsumer(localArtifact.value);
    }

    const onTextFormatChanged = (value: IArtifactTextFormatSelector) => {
      localArtifact.value.textFormat = ArtifactTextFormat[value.value as keyof typeof ArtifactTextFormat];
      updateConsumer(localArtifact.value);
    }

    watch(() => localArtifact.value.payload, value => {
      localArtifact.value.payload = value as string;
      updateConsumer(localArtifact.value);
    })

    const formatSchemaRegistry = computed(() => localArtifact.value.schemaType === ArtifactSchemaType.SCHEMA_REGISTRY );

    const onCloneArtifact = () => {
      cloneArtifact(localArtifact.value.uuid);
    }

    const onDeleteArtifact = () => {
      deleteArtifact(localArtifact.value.uuid);
    }

    const onConsumerViewTypeChanged = (value: IConsumerViewAsSelector) => {
      outputType.value = value.value;
    }

    return {
      outputType,
      artifactTabs,
      localArtifact,
      onSelectedClusterChanged,
      onSelectedTopicChanged,
      onArtifactUpdated,
      onTitleChanged,
      onSchemaTypeChanged,
      onConsumeFromTypeChanged,
      onSelectedSchemaRegistryChanged,
      formatSchemaRegistry,
      onCloneArtifact,
      onDeleteArtifact,
      onConsumerViewTypeChanged,
      onTextFormatChanged
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
