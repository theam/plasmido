<template>
  <q-form @submit="saveWorkbook" @reset="initWorkbook(currentWorkbook._id)" class="q-gutter-sm">
    <q-toolbar class="bg-grey-3 text-primary">
      <q-toolbar-title>
        Workbook: {{ currentWorkbook.uuid }}
      </q-toolbar-title>
      <q-btn flat outline round dense icon="o_delete" class="gt-xs" v-if="currentWorkbook._id !== ''"/>
      <q-btn outline round dense icon="o_refresh" class="q-ml-md" type="reset"/>
      <q-btn round dense icon="o_save" color="primary" class="q-ml-md" type="submit"/>
    </q-toolbar>

    <q-toolbar class="q-pa-md">
      <q-toolbar-title>
        <TitleEditor
          v-model:name="currentWorkbook.name"
          v-on:title-changed="onWorkbookTitleChanged"
        />
      </q-toolbar-title>
      <StartStopButton
        :current-workbook="currentWorkbook"
        :current-execution-status="currentExecutionStatus"
      />
    </q-toolbar>
    <q-separator/>
    <div class="q-gutter-md q-pt-xs">
      <q-tabs align="left" v-model="selectedTabArtifact" inline-label no-caps>
        <q-tab
          v-for="artifact in artifactsSelector"
          :key="artifact.uuid"
          v-bind="artifact"
        >
          <q-badge
            color="blue"
            v-if="isConsumerRunning(artifact.artifact.uuid, currentExecutionStatus)"
            floating
          >
            {{ consumedEventForArtifact(artifact.artifact.uuid) }}
          </q-badge>
          <q-badge
            color="green"
            v-if="isProducerRunning(artifact.artifact.uuid, currentExecutionStatus)"
            floating
          >
            {{ producedEventForArtifact(artifact.artifact.uuid) }}
          </q-badge>

        </q-tab>
        <q-btn-dropdown auto-close stretch flat label="Add...">
          <q-list>
            <q-item clickable @click="addProducer">
              <q-item-section>New Producer</q-item-section>
            </q-item>
            <q-item clickable @click="addConsumer">
              <q-item-section>New Consumer</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-tabs>
      <NewArtifact
        :add-consumer="addConsumer"
        :add-producer="addProducer"
        :workbook-artifacts="artifactsSelector"/>
      <q-tab-panels
        v-model="selectedTabArtifact"
        keep-alive
        class="bg-grey-1 q-mt-none">
        <q-tab-panel
          v-for="artifact in producersSelector" :key="artifact.uuid" v-bind="artifact">
          <ProducerForm
            :name="artifact.label"
            :artifact="artifact.artifact"
            :produced="producedEventForArtifact(artifact.artifact.uuid)"
            :total="parseInt(artifact.artifact.repeatTimes)"
          />
        </q-tab-panel>
        <q-tab-panel
          v-for="artifact in consumersSelector" :key="artifact.uuid" v-bind="artifact">
          <ConsumerForm
            :name="artifact.label"
            :artifact="artifact.artifact"
            :consumed-events="consumedEvents.filter(value => value.artifactUUID === artifact.artifact.uuid)"
          />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-form>
</template>

<script lang="ts">
import {defineComponent, onMounted, onUnmounted, provide, ref, watch} from 'vue';
import ProducerForm from 'components/workbook/producer/ProducerForm.vue';
import StartStopButton from 'components/workbook/StartStopButton.vue';
import TitleEditor from 'components/workbook/title/TitleEditor.vue';
import {useQuasar} from 'quasar';
import {useRoute, useRouter} from 'vue-router';
import useWorkbooksRepository from 'src/composables/useWorkbooksRepository';
import ConsumerForm from 'components/workbook/consumer/ConsumerForm.vue';
import NewArtifact from 'components/workbook/NewArtifact.vue';
import useExecution from 'src/composables/useExecution';
import {WorkBookStatus} from 'src/enums/WorkBookStatus';
import {IWorkbook} from 'src/interfaces/workbooks/IWorkbook';

const savedNotifyOptions = (name: string) => ({
  color: 'green-4',
  textColor: 'white',
  icon: 'cloud_done',
  message: 'Workbook `' + name + '` saved'
});

const producedNotifyOptions = (totalProduced: number) => ({
  color: 'yellow-1',
  textColor: 'black',
  icon: 'cloud_done',
  message: `Produced events: ${totalProduced}`
});

export default defineComponent({
  name: 'WorkBookForm',
  components: {TitleEditor, ProducerForm, ConsumerForm, NewArtifact, StartStopButton},
  setup(props) {
    const $q = useQuasar();
    const router = useRouter();
    const route = useRoute();
    const workbookId = route.params.id as string;
    const selectedTabArtifact = ref('');

    const {
      currentWorkbook,
      workbooks,
      inserted,
      updated,
      currentArtifact,
      artifactsSelector,
      producersSelector,
      consumersSelector,
      saveWorkbook,
      initWorkbook,
      updateWorkbookName,
      addProducer,
      updateProducer,
      addConsumer,
      updateConsumer,
      isConsumerRunning,
      isProducerRunning,
      cloneArtifact,
      deleteArtifact
    } = useWorkbooksRepository();

    const {
      currentExecutionStatus,
      currentExecutionWorkbook,
      currentExecutionArtifacts,
      consumedEvents,
      producedEvents,
      totalConsumed,
      totalProduced,
      startWorkbook,
      stopWorkbook
    } = useExecution();

    onMounted(() => {
      initWorkbook(workbookId);
    });

    onUnmounted(() => {
      void (async () => {
        try {
          if (currentWorkbook.value?._id !== '' && currentWorkbook.value?.status !== WorkBookStatus.STOPPED) {
            const workbook = {...currentWorkbook.value} as IWorkbook;
            await stopWorkbook(workbook);
          }
        } catch (e) {
          console.error('Couldn\'t stop workbook', e);
        }
      })();
    });

    const onWorkbookTitleChanged = (newName: string) => {
      updateWorkbookName(newName);
    }

    watch(inserted, () => {
      if (inserted.value) {
        $q.notify(savedNotifyOptions(currentWorkbook.value.name));
        void router.push({name: 'workbook_path', params: {id: currentWorkbook.value._id}});
      }
    });

    watch(updated, () => {
      if (updated.value) $q.notify(savedNotifyOptions(currentWorkbook.value.name));
    });

    watch(currentArtifact, () => {
      if (currentArtifact.value !== '') {
        selectedTabArtifact.value = currentArtifact.value;
      }
    });

    const changeWorkbookStatus = async () => {
      const workbook = {...currentWorkbook.value} as IWorkbook;
      if (currentExecutionStatus.value === WorkBookStatus.STOPPED) {
        await startWorkbook(workbook);
      } else {
        await stopWorkbook(workbook);
      }
    }

    const consumedEventForArtifact = (artifactUUID: string) => consumedEvents.value?.filter(value => value.artifactUUID === artifactUUID).length;
    const producedEventForArtifact = (artifactUUID: string) => {
      if (currentExecutionStatus.value === WorkBookStatus.STOPPED) {
        return 0;
      }
      return producedEvents.value?.filter(value => value.artifactUUID === artifactUUID).length;
    };

    const onDeleteArtifact = (artifactUUID:string) => {
      $q.dialog({
        title: 'Remove',
        message: 'Are you sure?',
        cancel: true,
        persistent: true
      }).onOk(() => {
        deleteArtifact(artifactUUID);
      });
    }

    const onCloneArtifact = (artifactUUID:string) => {
      cloneArtifact(artifactUUID);
    }

    provide('updateProducer', updateProducer);
    provide('updateConsumer', updateConsumer);
    provide('cloneArtifact', onCloneArtifact);
    provide('deleteArtifact', onDeleteArtifact);
    provide('changeWorkbookStatus', changeWorkbookStatus);

    return {
      currentWorkbook,
      workbooks,
      selectedTabArtifact,
      artifactsSelector,
      producersSelector,
      consumersSelector,
      currentExecutionStatus,
      currentExecutionWorkbook,
      currentExecutionArtifacts,
      consumedEvents,
      producedEvents,
      totalConsumed,
      totalProduced,
      consumedEventForArtifact,
      producedEventForArtifact,
      saveWorkbook,
      initWorkbook,
      onWorkbookTitleChanged,
      addProducer,
      addConsumer,
      changeWorkbookStatus,
      isConsumerRunning,
      isProducerRunning,
      onCloneArtifact,
      onDeleteArtifact
    }
  }
});
</script>

