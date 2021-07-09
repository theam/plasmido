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
import {IProducedEvent} from 'src/interfaces/IProducedEvent';

const PLASMIDO_VUE_USE_EXECUTIONS = 'PLASMIDO_VUE_USE:useExecutions';


export default function useExecution() {
  const socket = getSocket();
  // const currentWorkbookUUID = ref('');
  const currentExecutionStatus = ref(WorkBookStatus.STOPPED as WorkBookStatus);
  const currentExecutionWorkbook = ref(null as null | IExecutionWorkbook);
  const currentExecutionArtifacts = ref([] as Array<IExecutionArtifact>);
  const producedEvents = ref([] as Array<IProducedEvent>);
  const consumedEvents = ref([] as Array<IConsumedEvent>);
  const totalConsumed = ref(0);
  const totalProduced = ref(0);

  const listenersOff = () => {
    socket.off(Events.PLASMIDO_OUTPUT_PRODUCER_PRODUCED_EVENT);
    socket.off(Events.PLASMIDO_OUTPUT_CONSUMER_CONSUMED_EVENT);
    console.info(PLASMIDO_VUE_USE_EXECUTIONS, ':listenersOff:DONE:');
  };

  const eventProduced = (data: IProducedEvent) => {
    if (data !== null) {
      totalProduced.value += 1;
      producedEvents.value.push({...data});
    }
  };

  const eventConsumed = (data: IConsumedEvent) => {
    if (data !== null) {
      totalConsumed.value += 1;
      consumedEvents.value.push({...data});
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
    socket.on(Events.PLASMIDO_OUTPUT_PRODUCER_PRODUCED_EVENT, (data: IProducedEvent) => {
      eventProduced(data);
    });
    socket.on(Events.PLASMIDO_OUTPUT_CONSUMER_CONSUMED_EVENT, (data: IConsumedEvent) => {
      eventConsumed(data);
    });
  }

  onMounted(() => {
    listenersOn();
  });

  onUnmounted(() => {
    restartExecutionStatus();
    restartExecutionsCount()
    listenersOff();
  });

  const startWorkbook = async (workbook: IWorkbook) => {
    restartExecutionStatus();
    restartExecutionsCount();
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
    const execution = await syncEmit(Events.PLASMIDO_INPUT_WORKBOOK_STOP_SYNC, newWorkbook) as IExecutionWorkbook;
    currentExecutionWorkbook.value = execution;
    currentExecutionStatus.value = WorkBookStatus.STOPPED;
    // restartExecutionStatus();
  }

  const restartExecutionStatus = () => {
    currentExecutionWorkbook.value = null;
    currentExecutionArtifacts.value.length = 0;
    consumedEvents.value.length = 0;
    producedEvents.value.length = 0;
    currentExecutionStatus.value = WorkBookStatus.STOPPED;
  }

  const restartExecutionsCount = () => {
    totalProduced.value = 0;
    totalConsumed.value = 0;
  }

  return {
    currentExecutionStatus,
    currentExecutionWorkbook,
    currentExecutionArtifacts,
    consumedEvents,
    producedEvents,
    totalConsumed,
    totalProduced,
    startWorkbook,
    stopWorkbook
  }

}
