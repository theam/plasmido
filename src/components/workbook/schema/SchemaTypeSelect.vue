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
import {SchemaType, SchemaTypeDescription} from 'src/enums/SchemaType'
import {schemaTypeToArtifactSchemaTypeSelector} from 'src/interfaces/selectors/ISchemaTypeSelector'

export default defineComponent({
  name: 'SchemaTypeSelect',
  props: {
    formatArtifact: {
      type: Object as PropType<SchemaType>, default: SchemaType.AVRO
    }
  },
  emits: {
    schemaTypeChanged: null
  },
  setup(props, context) {
    const options = Object.values(SchemaType)
      .map(value => ({
      label: SchemaTypeDescription[value as keyof typeof SchemaTypeDescription],
      value: value
    }))
    const localFormatArtifact = ref(schemaTypeToArtifactSchemaTypeSelector(props.formatArtifact))

    watch(() => localFormatArtifact.value, (newValue) => context.emit('schemaTypeChanged', newValue))
    watch(() => props.formatArtifact, (newValue) => localFormatArtifact.value = schemaTypeToArtifactSchemaTypeSelector(newValue))

    return {
      localFormatArtifact,
      options
    }
  }
})
</script>
