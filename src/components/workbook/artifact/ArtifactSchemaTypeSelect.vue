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
import {defineComponent, PropType, ref, watch} from 'vue'
import {artifactSchemaTypeToArtifactSchemaTypeSelector} from 'src/interfaces/selectors/IArtifactSchemaTypeSelector'
import {ArtifactSchemaType, ArtifactSchemaTypeDescription} from 'src/enums/ArtifactSchemaType'

export default defineComponent({
  name: 'ArtifactSchemaTypeSelect',
  props: {
    formatArtifact: {
      type: Object as PropType<ArtifactSchemaType>, default: ArtifactSchemaType.SCHEMA_REGISTRY
    }
  },
  emits: {
    schemaTypeChanged: null
  },
  setup(props, context) {
    const options = Object.values(ArtifactSchemaType)
      .map(value => ({
      label: ArtifactSchemaTypeDescription[value as keyof typeof ArtifactSchemaTypeDescription],
      value: value
    }))
    const localFormatArtifact = ref(artifactSchemaTypeToArtifactSchemaTypeSelector(props.formatArtifact))

    watch(() => localFormatArtifact.value, (newValue) => context.emit('schemaTypeChanged', newValue))
    watch(() => props.formatArtifact, (newValue) => localFormatArtifact.value = artifactSchemaTypeToArtifactSchemaTypeSelector(newValue))

    return {
      localFormatArtifact,
      options
    }
  }
})
</script>
