<template>
  <q-form @reset="refreshGroups" class="q-gutter-sm">
    <div class="q-py-none">
      <q-table
          grid
          title="Consumer Groups"
          :rows="groupsDescriptions"
          :columns="columns"
          row-key="name"
          :filter="filter"
          hide-header
          no-data-label="No Groups"
          separator="none"
      >

        <template v-slot:top-right>
          <q-input
              dense
              debounce="300"
              v-model="filter"
              placeholder="Search"
          >
            <template v-slot:append>
              <q-icon name="search"/>
            </template>
          </q-input>
          <q-btn
              outline
              class="q-ml-md"
              icon-right="refresh"
              label="Refresh"
              type="reset"
              @click="refreshGroups"
          />
        </template>


        <template v-slot:item="props">
          <div class="q-pa-xs row col-12 items-start q-gutter-md grid-style-transition">
            <q-card class="my-card" :class="props.selected ? 'bg-grey-2' : ''">
              <q-card-section>
                <div class="row no-wrap q-pt-sm q-pb-none items-center">
                  <div class="col text-subtitle2">
                    {{ props.row.groupId }}
                  </div>
                </div>
                <q-separator v-if="showDetails"/>
              </q-card-section>

              <div v-if="showDetails">
                <q-card-actions>
                  <q-btn
                      dense
                      flat
                      size="md"
                      icon="o_delete"
                      @click="deleteGroups(props.row.groupId)"
                  />
                  <q-space/>
                  <q-btn
                      color="grey"
                      flat
                      dense
                      label="show details"
                      key="props.rowIndex"
                      :icon="props.expand ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
                      @click="props.expand = !props.expand"
                  />
                </q-card-actions>

                <q-slide-transition>
                  <div v-show="props.expand">
                    <q-separator/>
                    <q-card-section class="q-pt-none q-pb-none">
                      <div class="text-caption text-grey q-pb-none">
                        <div class="row">
                          <div class="col-2">Error code</div>
                          <div class="col-2">State</div>
                          <div class="col-2">Protocol</div>
                          <div class="col-2">Protocol Type</div>
                        </div>
                      </div>
                    </q-card-section>
                    <q-card-section class="q-pt-none q-pb-none">
                      <div class="text-caption text-grey q-pb-none">
                        <div class="row">
                          <div class="col-2">{{ props.row.errorCode }}</div>
                          <div class="col-2">{{ props.row.state }}</div>
                          <div class="col-2">{{ props.row.protocol }}</div>
                          <div class="col-2">{{ props.row.protocolType }}</div>
                        </div>
                      </div>
                    </q-card-section>
                    <q-card-section class="q-pt-md q-pb-none" v-if="props.row.members !== undefined">
                      <div class="text-caption text-grey q-pb-none">
                        <div class="row">
                          <div class="col-2">Client Host</div>
                          <div class="col-2">Client id</div>
                          <div class="col-6">Member id</div>
                        </div>
                      </div>
                    </q-card-section>
                    <q-card-section class="q-pt-none q-pb-none">
                      <div class="text-caption text-grey q-pb-none">
                        <div class="row" v-for="member in props.row.members" :key="member.memberId">
                          <div class="col-2">{{ member.clientHost }}</div>
                          <div class="col-2">{{ member.clientId }}</div>
                          <div class="col-6">{{ member.memberId }}</div>
                        </div>
                      </div>
                    </q-card-section>

                  </div>
                </q-slide-transition>
              </div>
            </q-card>
          </div>
        </template>

      </q-table>
    </div>

  </q-form>
</template>

<script lang="ts">
import {defineComponent, onMounted, PropType, ref, watch} from 'vue'
import useAdminRepository from 'src/composables/useAdminRepository'
import {IBroker} from 'src/interfaces/broker/IBroker'
import {GroupDescription} from 'kafkajs'
import {useQuasar} from 'quasar'

const deletingErrorNotifyOptions = (groupId: string) => ({
  color: 'red-4',
  textColor: 'white',
  icon: 'cloud_done',
  message: `Could not delete to ${groupId}`
})

export default defineComponent({
  name: 'ClientGroupList',
  props: {
    broker: {type: Object as PropType<IBroker>, required: true},
    showDetails: {type: Boolean, default: true}
  },
  setup(props) {
    const $q = useQuasar()

    const columns = [
      {
        name: 'groupId', required: true, label: 'groupId', align: 'left', sortable: true,
        field(row: GroupDescription) {
          return row.groupId
        },
        format(val: string) {
          return `${val}`
        }
      }
    ]

    const {
      groupsDescriptions,
      listGroups,
      resetGroups,
      deleteGroup
    } = useAdminRepository()

    const loadGroups = async () => {
      await listGroups(props.broker)
    }

    onMounted(() => {
      void loadGroups()
    })

    watch(() => props.broker, () => void loadGroups(), {deep: true})

    const refreshGroups = async () => {
      resetGroups()
      await loadGroups()
    }

    const deleteGroups = (value: string) => {
      $q.dialog({
        title: 'Confirm',
        message: 'Are you sure to delete consumer group....?',
        ok: 'Delete',
        cancel: true,
        persistent: true
      })
          .onOk(async () => {
            const deleteGroupsResults = await deleteGroup([value], props.broker)
            if (deleteGroupsResults.length === 0) {
              $q.notify(deletingErrorNotifyOptions(value))
            }
            return
          })
    }


    return {
      groupsDescriptions,
      columns,
      filter: ref(''),
      refreshGroups,
      deleteGroups
    }
  }
})
</script>

<style scoped lang="sass">
.my-card
  width: 100%
  max-width: 100%

.grid-style-transition
  transition: transform .28s, background-color .28s

</style>
