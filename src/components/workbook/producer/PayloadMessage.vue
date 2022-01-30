<template>
  <div class="row">
    <ArtifactTextFormatSelect :text-format-artifact="localArtifact.textFormat"
                              v-on:textFormatChanged="onTextFormatChanged"/>
    <ArtifactSchemaTypeSelect :format-artifact="localArtifact.schemaType" v-on:schemaTypeChanged="onSchemaTypeChanged"/>
    <SchemaRegistrySubjectSelector
        :origin-subject="localArtifact.payloadSchema?.schemaSubject"
        :origin-schema-registry-id="localArtifact.payloadSchema?.schemaRegistryId"
        :origin-schema-id="localArtifact.payloadSchema?.schemaId"
        v-on:selectedSchemaRegistryChanged="onSelectedSchemaRegistryChanged"
        v-on:selectedSubjectChanged="onSelectedSubjectChanged"
        class="col"
        v-if="formatSchemaRegistry"
    />
  </div>
  <JsonEditor
      :value="localArtifact.payload"
      :options="{mode: 'code', mainMenuBar: false, navigationBar: false, statusBar: false}"
      v-on:json-changed="onJsonChanged"
      v-on:json-invalid="onJsonInvalid"
      v-if="textFormatJson"
  />
  <q-input class="q-pt-md"
           v-model="localArtifact.payload"
           type="textarea"
           label="Payload"
           v-if="!textFormatJson"
  />
  <div class="fit row">
    <q-input class=" q-pt-md q-mr-md"
             v-model="localArtifact.repeatTimes"
             type="number"
             style="max-width: 100px"
             label="Repeat"
             dense
             hint="Available as {{ $p_index }} variable"
             :rules="[ val => val && val > 0 || 'Please a valid number']"
             :hide-hint="true"
    />
    <q-input class="q-pt-md"
             v-model="localArtifact.batchSize"
             type="number"
             style="max-width: 100px"
             label="Batch size"
             dense
             :rules="[ val => val && val > 0 || 'Please type a valid number']"
    />
  </div>
</template>
<script lang="ts">
import {computed, defineComponent, onMounted, PropType, ref, watch} from 'vue'
import {IArtifact} from 'src/interfaces/workbooks/IArtifact'
import SchemaRegistrySubjectSelector from 'components/workbook/schema/SchemaRegistrySubjectSelector.vue'
import {ISubjectSelector} from 'src/interfaces/selectors/ISubjectSelector'
import ArtifactSchemaTypeSelect from 'components/workbook/artifact/ArtifactSchemaTypeSelect.vue'
import ArtifactTextFormatSelect from 'components/workbook/artifact/ArtifactTextFormatSelect.vue'
import {IArtifactSchemaTypeSelector} from 'src/interfaces/selectors/IArtifactSchemaTypeSelector'
import {IArtifactTextFormatSelector} from 'src/interfaces/selectors/IArtifactTextFormatSelector'
import {ArtifactSchemaType} from 'src/enums/ArtifactSchemaType'
import {ArtifactTextFormat} from 'src/enums/ArtifactTextFormat'
import JsonEditor from 'components/JsonEditor.vue'

export default defineComponent({
  name: 'PayloadMessage',
  components: {JsonEditor, ArtifactSchemaTypeSelect, ArtifactTextFormatSelect, SchemaRegistrySubjectSelector},
  props: {
    artifact: {type: Object as PropType<IArtifact>, required: true},
    produced: {type: Number, default: 0},
    total: {type: Number, default: 0}
  },
  emits: {
    artifactChanged: null
  },
  setup(props, context) {
    const localArtifact = ref(props.artifact)

    const onSelectedSchemaRegistryChanged = (value: string) => {
      localArtifact.value.payloadSchema = localArtifact.value.payloadSchema || {}
      localArtifact.value.payloadSchema.schemaRegistryId = value || ''
      context.emit('artifactChanged', localArtifact.value)
    }

    const onSelectedSubjectChanged = (value: ISubjectSelector) => {
      localArtifact.value.payloadSchema = localArtifact.value.payloadSchema || {}
      localArtifact.value.payloadSchema.schemaSubject = value?.value || undefined
      localArtifact.value.payloadSchema.schemaId = value?.schemaId || undefined
      context.emit('artifactChanged', localArtifact.value)
    }

    const onSchemaTypeChanged = (value: IArtifactSchemaTypeSelector) => {
      localArtifact.value.schemaType = ArtifactSchemaType[value.value as keyof typeof ArtifactSchemaType]
      if (value.value === ArtifactSchemaType.PLAIN) {
        localArtifact.value.payloadSchema = {}
      }
      context.emit('artifactChanged', localArtifact.value)
    }

    const onTextFormatChanged = (value: IArtifactTextFormatSelector) => {
      localArtifact.value.textFormat = ArtifactTextFormat[value.value as keyof typeof ArtifactTextFormat]
      context.emit('artifactChanged', localArtifact.value)
    }

    const onJsonChanged = (value: string) => {
      localArtifact.value.payload = value
      context.emit('artifactChanged', localArtifact.value)
    }

    const onJsonInvalid = (errors: Array<unknown>) => {
      console.error(errors)
    }

    watch(() => localArtifact.value.repeatTimes, value => {
      localArtifact.value.repeatTimes = value
      context.emit('artifactChanged', localArtifact.value)
    })

    watch(() => localArtifact.value.batchSize, value => {
      localArtifact.value.batchSize = value
      context.emit('artifactChanged', localArtifact.value)
    })

    watch(() => localArtifact.value.payload, value => {
      localArtifact.value.payload = value as string
      context.emit('artifactChanged', localArtifact.value)
    })

    const textFormatJson = computed(() => localArtifact.value.textFormat == 'JSON')
    const formatSchemaRegistry = computed(() => localArtifact.value.schemaType === ArtifactSchemaType.SCHEMA_REGISTRY)

    onMounted(() => {
      localArtifact.value = props.artifact
    })

    return {
      localArtifact,
      formatSchemaRegistry,
      onSelectedSchemaRegistryChanged,
      onSelectedSubjectChanged,
      onSchemaTypeChanged,
      onTextFormatChanged,
      onJsonChanged,
      onJsonInvalid,
      textFormatJson
    }
  }
})
</script>
