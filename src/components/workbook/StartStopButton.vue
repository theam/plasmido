<template>
  <q-btn
    :icon-right="buttonIcon"
    :color="buttonColor"
    :disable="buttonDisabled"
    :label="buttonLabel"
    @click="changeWorkbookStatus"
  >
  </q-btn>
</template>


<script lang="ts">

import {defineComponent, inject, onMounted, PropType, ref, watch} from 'vue';
import {WorkBookStatus} from 'src/enums/WorkBookStatus';
import {IWorkbook} from 'src/interfaces/workbooks/IWorkbook';
import {ArtifactType} from 'src/enums/ArtifactType';
import {cloneDeep} from 'lodash';
import {isJsonString} from 'src/global';
import {ArtifactSchemaType} from 'src/enums/ArtifactSchemaType';
import {ArtifactTextFormat} from 'src/enums/ArtifactTextFormat';

const artifactsReadyToRun = (workbook: IWorkbook) => {
  if (workbook.artifacts.length === 0) {
    return false;
  }

  if (workbook.artifacts
    .some(value1 => value1.type === ArtifactType.PRODUCER &&
      (value1.brokerId === '' ||
        value1.topicName === '' ||
        value1.payload === ''))
  ) {
    return false;
  }

  if (workbook.artifacts.some(value1 => value1.type === ArtifactType.PRODUCER &&
    value1.schemaType !== ArtifactSchemaType.PLAIN &&
    value1.textFormat == ArtifactTextFormat.JSON &&
    (!isJsonString(value1.payload || '')))) {
    return false;
  }

  if (workbook.artifacts.some(value1 => value1.type === ArtifactType.PRODUCER &&
    value1.schemaType !== ArtifactSchemaType.PLAIN &&
    value1.payloadSchema === {})) {
    return false;
  }

  if (workbook.artifacts.some(value1 => value1.type === ArtifactType.PRODUCER &&
    value1.schemaType !== ArtifactSchemaType.PLAIN &&
    (value1.payloadSchema.schemaRegistryId === undefined || value1.payloadSchema.schemaId === undefined))) {
    return false;
  }

  return !workbook.artifacts
    .some(value1 => value1.type === ArtifactType.CONSUMER &&
      (value1.brokerId === '' ||
        value1.topicName === ''));

};

export default defineComponent({
  name: 'StartStopButton',
  props: {
    currentWorkbook: {type: Object as PropType<IWorkbook>, required: true},
    currentExecutionStatus: {type: String, required: true, default: WorkBookStatus.STOPPED}
  },
  setup(props) {
    const changeWorkbookStatus = inject('changeWorkbookStatus');
    const buttonIcon = ref('play_arrow');
    const buttonLabel = ref('Start');
    const buttonColor = ref('primary');
    const buttonDisabled = ref(false);
    const buttonLoading = ref(false);

    function updateButton() {
      const {
        color,
        disabled,
        icon,
        loading,
        label
      } = calculateButtonState(props.currentExecutionStatus, props.currentWorkbook);
      buttonIcon.value = icon;
      buttonColor.value = color;
      buttonDisabled.value = disabled;
      buttonLoading.value = loading;
      buttonLabel.value = label;
    }

    onMounted(() => {
      updateButton();
    });

    watch(() => props.currentExecutionStatus, () => {
      updateButton();
    });

    watch(() => cloneDeep(props.currentWorkbook), () => {
      updateButton();
    });

    const calculateButtonState = (value: string, workbook: IWorkbook) => {
      let disabled = !artifactsReadyToRun(workbook);
      switch (value) {
        case (WorkBookStatus.STOPPED):
          return {icon: 'o_play_arrow', color: 'primary', disabled: disabled, loading: false, label: 'Start'};
        case (WorkBookStatus.RUNNING):
          return {icon: 'o_cancel', color: 'red', disabled: disabled, loading: true, label: 'Stop'};
        case (WorkBookStatus.STOPPING):
          return {icon: 'o_cancel', color: 'black', disabled: true, loading: false, label: 'Stopping'};
        default:
          return {icon: 'o_play_arrow', color: 'primary', disabled: disabled, loading: false, label: 'Start'};
      }
    }

    return {
      changeWorkbookStatus,
      buttonIcon,
      buttonColor,
      buttonDisabled,
      buttonLoading,
      buttonLabel
    }
  }
});
</script>

<style scoped>

</style>
