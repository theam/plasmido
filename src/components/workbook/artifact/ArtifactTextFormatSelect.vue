<template>
  <q-select
    v-model="localTextFormat"
    label="Format as:"
    :options="options"
    dense
    class="col-2 q-pr-lg"
  />
</template>

<script lang="ts">
import {defineComponent, PropType, ref, watch} from 'vue'
import {
  artifactTextFormatToArtifactTextFormatSelector,
} from 'src/interfaces/selectors/IArtifactTextFormatSelector'
import {ArtifactTextFormat, ArtifactTextFormatDescription} from 'src/enums/ArtifactTextFormat'

export default defineComponent({
  name: 'ArtifactTextFormatSelect',
  props: {
    textFormatArtifact: {
      type: Object as PropType<ArtifactTextFormat>, default: () => ArtifactTextFormat.JSON
    }
  },
  emits: {
    textFormatChanged: null
  },
  setup(props, context) {
    const options = Object.values(ArtifactTextFormat).map(value => ({
      label: ArtifactTextFormatDescription[value as keyof typeof ArtifactTextFormatDescription],
      value: value
    }))
    const localTextFormat = ref(artifactTextFormatToArtifactTextFormatSelector(props.textFormatArtifact))

    watch(() => localTextFormat.value, (newValue) => context.emit('textFormatChanged', newValue))
    watch(() => props.textFormatArtifact, (newValue) => localTextFormat.value = artifactTextFormatToArtifactTextFormatSelector(newValue))

    return {
      localTextFormat,
      options
    }
  }
})
</script>
