<template>
  <q-select
    v-model="localFormatArtifact"
    label="Type"
    :options="options"
    dense
    class="col-2 q-pr-lg"
  />
</template>

<script lang="ts">
import {defineComponent, PropType, ref, watch} from 'vue';
import {ArtifactSchemaType, ArtifactSchemaTypeDescription} from 'src/interfaces/workbooks/IArtifact';
import {artifactSchemaTypeToArtifactSchemaTypeSelector} from 'src/interfaces/selectors/IArtifactSchemaTypeSelector';

export default defineComponent({
  name: 'ArtifactSchemaTypeSelect',
  props: {
    formatArtifact: {
      type: Object as PropType<ArtifactSchemaType>, default: ArtifactSchemaType.AVRO
    }
  },
  emits: {
    schemaTypeChanged: null // no validation
  },
  setup(props, context) {
    const options = Object.values(ArtifactSchemaType).map(value => ({
      label: ArtifactSchemaTypeDescription[value as keyof typeof ArtifactSchemaTypeDescription],
      value: value
    }));
    const localFormatArtifact = ref(artifactSchemaTypeToArtifactSchemaTypeSelector(props.formatArtifact));

    watch(() => localFormatArtifact.value, (newValue) => context.emit('schemaTypeChanged', newValue));
    watch(() => props.formatArtifact, (newValue) => localFormatArtifact.value = artifactSchemaTypeToArtifactSchemaTypeSelector(newValue));

    return {
      localFormatArtifact,
      options
    }
  }
});
</script>
