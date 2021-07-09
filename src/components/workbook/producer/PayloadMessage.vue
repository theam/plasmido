<template>
  <div class="row">
    <ArtifactTextFormatSelect :view-artifact="localArtifact.textFormat" v-on:textFormatChanged="onTextFormatChanged"/>
    <ArtifactSchemaTypeSelect :format-artifact="localArtifact.schemaType" v-on:schemaTypeChanged="onSchemaTypeChanged"/>
    <SchemaRegistrySubjectSelector
      :origin-subject="localArtifact.payloadSchema?.schemaSubject"
      :origin-schema-registry-id="localArtifact.payloadSchema?.schemaRegistryId"
      :origin-schema-id="localArtifact.payloadSchema?.schemaId"
      v-on:selectedSchemaRegistryChanged="onSelectedSchemaRegistryChanged"
      v-on:selectedSubjectChanged="onSelectedSubjectChanged"
      class="col"
      v-if="formatAvro"
    />
  </div>
  <q-input class="q-pt-md"
           v-model="localArtifact.payload"
           type="textarea"
           label="Payload"
  />
  <div>
    <q-input class="q-pt-md"
             v-model="localArtifact.repeatTimes"
             type="number"
             style="max-width: 200px"
             label="Repeat"
             hint="Available as {{ $p_index }} variable"
             :hide-hint="true"
    />
    <q-linear-progress :value="produced / total" class="q-mt-md" />
  </div>
</template>
<script lang="ts">
import {computed, defineComponent, onMounted, PropType, ref, watch} from 'vue';
import {ArtifactSchemaType, ArtifactTextFormat, IArtifact} from 'src/interfaces/workbooks/IArtifact';
import SchemaRegistrySubjectSelector from 'components/workbook/schema/SchemaRegistrySubjectSelector.vue';
import {ISubjectSelector} from 'src/interfaces/selectors/ISubjectSelector';
import ArtifactSchemaTypeSelect from 'components/workbook/artifact/ArtifactSchemaTypeSelect.vue';
import ArtifactTextFormatSelect from 'components/workbook/artifact/ArtifactTextFormatSelect.vue';
import {IArtifactSchemaTypeSelector} from 'src/interfaces/selectors/IArtifactSchemaTypeSelector';
import {IArtifactTextFormatSelector} from 'src/interfaces/selectors/IArtifactTextFormatSelector';

// TODO RENAME
export default defineComponent({
  name: 'PayloadMessage',
  components: {ArtifactSchemaTypeSelect, ArtifactTextFormatSelect, SchemaRegistrySubjectSelector},
  props: {
    artifact: {type: Object as PropType<IArtifact>, required: true},
    produced: {type: Number, default: 0},
    total: {type: Number, default: 0}
  },
  emits: {
    artifactChanged: null
  },
  setup(props, context) {
    const localArtifact = ref(props.artifact);

    const onSelectedSchemaRegistryChanged = (value: string) => {
      localArtifact.value.payloadSchema = localArtifact.value.payloadSchema || {};
      localArtifact.value.payloadSchema.schemaRegistryId = value || '';
      context.emit('artifactChanged', localArtifact.value);
    }

    const onSelectedSubjectChanged = (value: ISubjectSelector) => {
      localArtifact.value.payloadSchema = localArtifact.value.payloadSchema || {};
      localArtifact.value.payloadSchema.schemaSubject = value?.value || undefined;
      localArtifact.value.payloadSchema.schemaId = value?.schemaId || undefined;
      context.emit('artifactChanged', localArtifact.value);
    }

    const onSchemaTypeChanged = (value: IArtifactSchemaTypeSelector) => {
      localArtifact.value.schemaType = ArtifactSchemaType[value.value as keyof typeof  ArtifactSchemaType];
      context.emit('artifactChanged', localArtifact.value);
    }

    const onTextFormatChanged = (value: IArtifactTextFormatSelector) => {
      localArtifact.value.textFormat = ArtifactTextFormat[value.value as keyof typeof ArtifactTextFormat];
      context.emit('artifactChanged', localArtifact.value);
    }

    watch(() => localArtifact.value.payload, value => {
      localArtifact.value.payload = value as string;
      context.emit('artifactChanged', localArtifact.value);
    })

    const formatAvro = computed(() => localArtifact.value.schemaType !== ArtifactSchemaType.PLAIN);

    onMounted(() => {
      localArtifact.value = props.artifact;
    });

    return {
      localArtifact,
      formatAvro,
      onSelectedSchemaRegistryChanged,
      onSelectedSubjectChanged,
      onSchemaTypeChanged,
      onTextFormatChanged
    }
  }
});
</script>
