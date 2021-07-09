<template>
  <q-btn
    :icon="buttonIcon"
    :color="buttonColor"
    :disable="buttonDisabled"
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

// TODO move it to helper
const artifactsReadyToRun = (workbook: IWorkbook) => {
  if (workbook.artifacts.length === 0) {
    return false;
  }

  if (workbook.artifacts
    .some(value1 => value1.type === ArtifactType.PRODUCER &&
      (value1.brokerId === '' ||
      value1.topicName === '' ||
      value1.payload === ''))) {
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
    const buttonColor = ref('primary');
    const buttonDisabled = ref(false);
    const buttonLoading = ref(false);

    onMounted(() => {
      const {
        color,
        disabled,
        icon,
        loading
      } = calculateButtonState(props.currentExecutionStatus, props.currentWorkbook);
      buttonIcon.value = icon;
      buttonColor.value = color;
      buttonDisabled.value = disabled;
      buttonLoading.value = loading;
    });

    watch(() => props.currentExecutionStatus, () => {
      const {
        color,
        disabled,
        icon,
        loading
      } = calculateButtonState(props.currentExecutionStatus, props.currentWorkbook);
      buttonIcon.value = icon;
      buttonColor.value = color;
      buttonDisabled.value = disabled;
      buttonLoading.value = loading;
    });

    watch(() => cloneDeep(props.currentWorkbook), () => {
      const {
        color,
        disabled,
        icon,
        loading
      } = calculateButtonState(props.currentExecutionStatus, props.currentWorkbook);
      buttonIcon.value = icon;
      buttonColor.value = color;
      buttonDisabled.value = disabled;
      buttonLoading.value = loading;
    });

    const calculateButtonState = (value: string, workbook: IWorkbook) => {
      let disabled = !artifactsReadyToRun(workbook);
      switch (value) {
        case (WorkBookStatus.STOPPED):
          return {icon: 'o_play_arrow', color: 'primary', disabled: disabled, loading: false};
        case (WorkBookStatus.RUNNING):
          return {icon: 'o_cancel', color: 'red', disabled: disabled, loading: true};
        case (WorkBookStatus.STOPPING):
          return {icon: 'o_cancel', color: 'black', disabled: true, loading: false};
        default:
          return {icon: 'o_play_arrow', color: 'primary', disabled: disabled, loading: false};
      }
    }

    return {
      changeWorkbookStatus,
      buttonIcon,
      buttonColor,
      buttonDisabled,
      buttonLoading
    }
  }
});
</script>

<style scoped>

</style>
