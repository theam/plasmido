/* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return */
import {IWorkbook} from 'src/interfaces/workbooks/IWorkbook';
import {WorkBookActions} from 'src/enums/WorkBookActions';
import {WorkBookStatus} from 'src/enums/WorkBookStatus';
import {Events} from 'src/enums/Events';
import {getSocket, syncEmit} from 'src/global';
import {onMounted, onUnmounted, ref} from 'vue';
import {IExecutionWorkbook} from 'src/interfaces/executions/IExecutionWorkbook';
import {IExecutionStart} from 'src/interfaces/executions/IExecutionStart';
import {IExecutionArtifact} from 'src/interfaces/executions/IExecutionArtifact';
import {cloneDeep} from 'lodash';
import {IConsumedEvent} from 'src/interfaces/IConsumedEvent';
import {IProducedEventCount} from 'src/interfaces/IProducedEventCount';
import {IConsumedEventCount} from 'src/interfaces/IConsumedEventCount';
import {IConsumedEventElement} from 'src/interfaces/IConsumedEventElement';
import {IProducedEventElement} from 'src/interfaces/IProducedEventElement';

const PLASMIDO_VUE_USE_EXECUTIONS = 'PLASMIDO_VUE_USE:useExecutions';


export default function useExecution() {
  const socket = getSocket();
  const currentExecutionStatus = ref(WorkBookStatus.STOPPED as WorkBookStatus);
  const currentExecutionWorkbook = ref(null as null | IExecutionWorkbook);
  const currentExecutionArtifacts = ref([] as Array<IExecutionArtifact>);
  const producedEventsCount = ref([] as Array<IProducedEventCount>);
  const consumedEventsCount = ref([] as Array<IConsumedEventCount>);

  const listenersOff = () => {
    socket.off(Events.PLASMIDO_OUTPUT_PRODUCER_PRODUCED_EVENT);
    socket.off(Events.PLASMIDO_OUTPUT_CONSUMER_CONSUMED_EVENT);
    console.info(PLASMIDO_VUE_USE_EXECUTIONS, ':listenersOff:DONE:');
  };

  const eventProduced = (data: IProducedEventElement) => {
    if (data !== null) {
      if (producedEventsCount.value && producedEventsCount.value.length > 0) {
        const count = producedEventsCount.value.find(value => value.artifactUUID === data.artifactUUID);
        if (count) {
          count.size += data.size;
        } else {
          producedEventsCount.value.push({size: 1, artifactUUID: data.artifactUUID});
        }
      } else {
        producedEventsCount.value.push({size: data.size, artifactUUID: data.artifactUUID});
      }
    }
  };

  const eventConsumed = (data: IConsumedEventElement) => {
    if (data !== null) {
      if (consumedEventsCount.value && consumedEventsCount.value.length > 0) {
        const count = consumedEventsCount.value.find(value => value.artifactUUID === data.artifactUUID);
        if (count) {
          count.size += 1;
        } else {
          consumedEventsCount.value.push({size: 1, artifactUUID: data.artifactUUID});
        }
      } else {
        consumedEventsCount.value.push({size: 1, artifactUUID: data.artifactUUID});
      }
    }
  };

  const listenersOn = () => {
    listenersOff();
    socket.on(Events.PLASMIDO_OUTPUT_WORKBOOK_STARTED, (workbookUUID: string) => {
      if (currentExecutionWorkbook.value?.workbookUUID === workbookUUID) {
        currentExecutionStatus.value = WorkBookStatus.RUNNING;
      }
    });
    socket.on(Events.PLASMIDO_OUTPUT_WORKBOOK_STOPPED, (workbookUUID: string) => {
      if (currentExecutionWorkbook.value?.workbookUUID === workbookUUID) {
        currentExecutionStatus.value = WorkBookStatus.STOPPED;
      }
    });
    socket.on(Events.PLASMIDO_OUTPUT_PRODUCER_PRODUCED_EVENT, (data: IProducedEventElement) => {
      eventProduced(data);
    });
    socket.on(Events.PLASMIDO_OUTPUT_CONSUMER_CONSUMED_EVENT, (data: IConsumedEventElement) => {
      eventConsumed(data);
    });
  }

  onMounted(() => {
    listenersOn();
  });

  onUnmounted(() => {
    restartExecutionStatus();
    listenersOff();
  });

  const startWorkbook = async (workbook: IWorkbook) => {
    restartExecutionStatus();
    workbook.action = WorkBookActions.RUN;
    workbook.status = WorkBookStatus.STOPPED;
    const execution = await syncEmit(Events.PLASMIDO_INPUT_WORKBOOK_START_SYNC, workbook) as IExecutionStart;
    currentExecutionWorkbook.value = execution.executionWorkbook;
    currentExecutionStatus.value = WorkBookStatus.RUNNING;
    execution?.executionArtifacts.forEach(value => {
      currentExecutionArtifacts.value.push(value);
    });
  }

  const stopWorkbook = async (workbook: IWorkbook) => {
    const newWorkbook = cloneDeep(workbook);
    newWorkbook.action = WorkBookActions.STOP;
    currentExecutionStatus.value = WorkBookStatus.STOPPING;
    currentExecutionWorkbook.value = await syncEmit(Events.PLASMIDO_INPUT_WORKBOOK_STOP_SYNC, newWorkbook) as IExecutionWorkbook;
    currentExecutionStatus.value = WorkBookStatus.STOPPED;
  }

  const restartExecutionStatus = () => {
    currentExecutionWorkbook.value = null;
    currentExecutionArtifacts.value.length = 0;
    producedEventsCount.value.length = 0;
    consumedEventsCount.value.length = 0;
    currentExecutionStatus.value = WorkBookStatus.STOPPED;
  }

  const truncateExecutions = async () => {
    return await syncEmit(Events.PLASMIDO_INPUT_EXECUTIONS_TRUNCATE) as boolean;
  }

  const getConsumedCountByArtifact = async (artifactUUID: string, filter: string) => {
    return await syncEmit(Events.PLASMIDO_INPUT_EXECUTIONS_CONSUMED_COUNT, {artifactUUID, filter}) as number;
  }

  const getConsumedByArtifact = async (artifactUUID: string, filter: string, startRow: number, count: number) => {
    return await syncEmit(Events.PLASMIDO_INPUT_EXECUTIONS_CONSUMED, {
      artifactUUID,
      filter,
      startRow,
      count
    }) as Array<IConsumedEvent>;
  }


  return {
    currentExecutionStatus,
    currentExecutionWorkbook,
    currentExecutionArtifacts,
    consumedEventsCount,
    producedEventsCount,
    startWorkbook,
    stopWorkbook,
    truncateExecutions,
    getConsumedByArtifact,
    getConsumedCountByArtifact
  }

}
