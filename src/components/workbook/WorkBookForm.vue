<template>
  <q-form @submit="saveWorkbook" @reset="initWorkbook(currentWorkbook._id)" class="q-gutter-sm">
    <q-toolbar class="q-pt-lg q-pl-md q-pr-md">
      <q-toolbar-title>
        <TitleEditor
          v-model:name="currentWorkbook.name"
          v-on:title-changed="onWorkbookTitleChanged"
        />
      </q-toolbar-title>
      <q-btn
        outline
        icon-right="o_save"
        class="q-ml-sm q-mr-lg"
        color="primary"
        type="submit"
        label="Save"
        :disable="!hasChanges"
      />
      <StartStopButton
        :current-workbook="currentWorkbook"
        :current-execution-status="currentExecutionStatus"
      />
    </q-toolbar>
    <q-separator/>
    <div class="q-gutter-md q-pt-xs">
      <q-tabs
        indicator-color="transparent"
        active-color="primary"
        inline-label
        dense
        align="left"
        no-caps
        v-model="selectedTabArtifact"
      >
        <q-tab
          v-for="artifact in artifactsSelector"
          :key="artifact.uuid"
          v-bind="artifact"
        >
          <q-icon :name="artifactIco(artifact)" size="1rem" right/>
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
        <q-btn-dropdown auto-close stretch flat no-caps label="Add...">
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
        class="bg-grey-1 q-mt-none q-pl-md q-pr-md">
        <q-tab-panel
          v-for="artifact in producersSelector" :key="artifact.artifact.uuid" v-bind="artifact"
        >
          <ProducerForm
            :name="artifact.label"
            :artifact="artifact.artifact"
            :produced="producedEventForArtifact(artifact.artifact.uuid)"
            :total="artifact.artifact.repeatTimes"
          />
        </q-tab-panel>
        <q-tab-panel
          v-for="artifact in consumersSelector" :key="artifact.artifact.uuid" v-bind="artifact">
          <ConsumerForm
            :name="artifact.label"
            :artifact="artifact.artifact"
            :consumed-events-total="consumedEventForArtifact(artifact.artifact.uuid)"
            :status="currentExecutionStatus"
          />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-form>
</template>

<script lang="ts">
import {defineComponent, onMounted, provide, ref, watch} from 'vue'
import ProducerForm from 'components/workbook/producer/ProducerForm.vue'
import StartStopButton from 'components/workbook/StartStopButton.vue'
import TitleEditor from 'components/workbook/title/TitleEditor.vue'
import {QDialogOptions, useQuasar} from 'quasar'
import {
  useRoute,
  useRouter,
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
} from 'vue-router'
import useWorkbooksRepository from 'src/composables/useWorkbooksRepository'
import ConsumerForm from 'components/workbook/consumer/ConsumerForm.vue'
import NewArtifact from 'components/workbook/NewArtifact.vue'
import useExecution from 'src/composables/useExecution'
import {WorkBookStatus} from 'src/enums/WorkBookStatus'
import {IWorkbook} from 'src/interfaces/workbooks/IWorkbook'
import ConfirmExitDialog from 'components/ConfirmExitDialog.vue'
import {IArtifact} from 'src/interfaces/workbooks/IArtifact'
import {ArtifactType} from 'src/enums/ArtifactType'

const savedNotifyOptions = (name: string) => ({
  color: 'green-4',
  textColor: 'white',
  icon: 'cloud_done',
  message: 'Workbook `' + name + '` saved'
})

const confirmDialogOptions = () => ({
  component: ConfirmExitDialog,
  componentProps: {}
} as QDialogOptions)


export default defineComponent({
  name: 'WorkBookForm',
  components: {TitleEditor, ProducerForm, ConsumerForm, NewArtifact, StartStopButton},
  setup() {
    const $q = useQuasar()
    const router = useRouter()
    const route = useRoute()
    const workbookId = route.params.id as string
    const selectedTabArtifact = ref('')

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
      deleteArtifact,
      hasChanges,
      resetWorkbook
    } = useWorkbooksRepository()

    const {
      currentExecutionStatus,
      currentExecutionWorkbook,
      currentExecutionArtifacts,
      consumedEventsCount,
      producedEventsCount,
      startWorkbook,
      stopWorkbook,
      getConsumedByArtifact,
      getConsumedCountByArtifact
    } = useExecution()

    onMounted(() => {
      initWorkbook(workbookId)
    })

    const stopIfNeeded = async () => {
      try {
        if (currentWorkbook.value?._id !== '' && currentExecutionStatus.value !== WorkBookStatus.STOPPED) {
          const workbook = {...currentWorkbook.value} as IWorkbook
          await stopWorkbook(workbook)
        }
      } catch (e) {
        console.error('Couldn\'t stop workbook', e)
      }
    }

    const asyncConfirmExistDialog = () => new Promise((resolve) => {
      $q.dialog(confirmDialogOptions())
        .onOk((dialogResult: { action: string }) => {
          if (dialogResult.action === 'ok') {
            void saveWorkbook()
          } else {
            resetWorkbook()
          }
          resolve(true)
        })
        .onDismiss(() => resolve(false))
    })

    const checkExit = async () => {
      let result = true
      if (hasChanges.value) {
        const confirm = !!await asyncConfirmExistDialog()
        if (confirm) {
          await stopIfNeeded()
        }
        return confirm
      } else {
        await stopIfNeeded()
      }
      return result
    }

    onBeforeRouteLeave(async () => {
      return await checkExit()
    })

    onBeforeRouteUpdate(async () => {
      return await checkExit()
    })


    const onWorkbookTitleChanged = (newName: string) => {
      updateWorkbookName(newName)
    }

    watch(inserted, () => {
      if (inserted.value) {
        $q.notify(savedNotifyOptions(currentWorkbook.value.name))
        void router.push({name: 'workbook_path', params: {id: currentWorkbook.value._id}})
      }
    })

    watch(updated, () => {
      if (updated.value) $q.notify(savedNotifyOptions(currentWorkbook.value.name))
    })

    watch(currentArtifact, () => {
      if (currentArtifact.value !== '') {
        selectedTabArtifact.value = currentArtifact.value
      }
    })

    const changeWorkbookStatus = async () => {
      const workbook = {...currentWorkbook.value} as IWorkbook
      if (currentExecutionStatus.value === WorkBookStatus.STOPPED) {
        await startWorkbook(workbook)
      } else {
        await stopWorkbook(workbook)
      }
    }

    const consumedEventForArtifact = (artifactUUID: string) => {
      const filter = consumedEventsCount.value?.filter(value => value.artifactUUID === artifactUUID)
      if (filter && filter.length > 0) {
        return filter[0].size
      }
      return 0
    }

    const producedEventForArtifact = (artifactUUID: string) => {
      if (currentExecutionStatus.value === WorkBookStatus.STOPPED) {
        return 0
      }
      const filter = producedEventsCount.value?.filter(value => value.artifactUUID === artifactUUID)
      if (filter && filter.length > 0) {
        return filter[0].size
      }
      return 0
    }

    const onDeleteArtifact = (artifactUUID: string) => {
      $q.dialog({
        title: 'Remove',
        message: 'Are you sure?',
        cancel: true,
        persistent: true
      }).onOk(() => {
        deleteArtifact(artifactUUID)
      })
    }

    const onCloneArtifact = (artifactUUID: string) => {
      cloneArtifact(artifactUUID)
    }

    const artifactIco = (artifact: IArtifact) => {
      return artifact.type === ArtifactType.PRODUCER ? 'north_east' : 'south_west'
    }

    provide('updateProducer', updateProducer)
    provide('updateConsumer', updateConsumer)
    provide('cloneArtifact', onCloneArtifact)
    provide('deleteArtifact', onDeleteArtifact)
    provide('changeWorkbookStatus', changeWorkbookStatus)
    provide('getConsumedByArtifact', getConsumedByArtifact)
    provide('getConsumedCountByArtifact', getConsumedCountByArtifact)

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
      onDeleteArtifact,
      hasChanges,
      artifactIco
    }
  }
})
</script>

