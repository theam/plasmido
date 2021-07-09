<template>
  <q-toolbar class="bg-grey-3 text-primary">
    <q-toolbar-title>
      {{ localEnvironment?.name || '...' }}
    </q-toolbar-title>
  </q-toolbar>
  <q-separator/>
  <div class="q-gutter-md">
    <q-form @submit="saveEnvironment" @reset="onReset" class="q-gutter-sm">
      <q-toolbar>
        <q-toolbar-title class="text-primary">
          Configuration
        </q-toolbar-title>
        <q-btn outline round dense icon="refresh" class="q-ml-md" type="reset"/>
        <q-btn round dense icon="o_save" color="primary" class="q-ml-md" type="submit"/>
      </q-toolbar>
      <q-separator/>
      <q-input v-model="localEnvironment.name"
               :rules="[ val => val && val.length > 0 || 'Please type something']"
               error-message="Required field"
               label="Name"
               class="q-pa-md"
      />
      <div class="q-pa-md">
        <q-table
          title="Variables"
          :rows="localEnvironment.variables"
          :columns="columns"
          row-key="name"
          :filter="filter"
          :loading="loading"
        >
          <template v-slot:top>
            <q-btn unelevated round dense color="primary" :disable="loading" icon="add" @click="addRow"/>
            <q-space/>
            <q-input borderless dense debounce="300" color="primary" v-model="filter" placeholder="Search">
              <template v-slot:append>
                <q-icon name="search"/>
              </template>
            </q-input>
          </template>

          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="name" :props="props">
                {{ props.row.name }}
                <q-popup-edit v-model="props.row.name">
                  <q-input v-model="props.row.name" dense autofocus/>
                </q-popup-edit>
              </q-td>
              <q-td key="value" :props="props">
                {{ props.row.value }}
                <q-popup-edit v-model="props.row.value">
                  <q-input v-model="props.row.value" dense autofocus/>
                </q-popup-edit>
              </q-td>
              <q-td key="actions" :props="props">
                <q-btn flat rounded dense size=sm icon="close" @click="deleteRow(props.row)"/>
              </q-td>
            </q-tr>
          </template>
          {/* eslint-disable-next-line vue/no-unused-vars */}
<!--          <template v-slot:no-data="{ icon, message, filter }">-->
<!--            <div class="full-width row flex-center text-grey-6 q-gutter-sm">-->
<!--              Add variables to the environment-->
<!--            </div>-->
<!--          </template>-->
        </q-table>
      </div>
    </q-form>
  </div>
</template>

<script lang="ts">
import {defineComponent, onMounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {IEnvironment} from 'src/interfaces/environment/IEnvironment';
import useEnvironmentsRepository from 'src/composables/useEnvironmentsRepository';
import {cloneDeep} from 'lodash';
import {QDialogOptions, useQuasar} from 'quasar';
import {IEnvironmentVariable} from 'src/interfaces/environment/IEnvironmentVariable';
import {v4} from 'uuid';
import NewEnvironmentVariableDialog from 'components/environment/NewEnvironmentVariableDialog.vue';

const columns = [
  {
    name: 'name',
    required: true,
    label: 'name',
    caption: true,
    align: 'left',
    field(row: IEnvironmentVariable) {
      return row.name
    },
    format(value: string) {
      return `${value}`
    },
    sortable: true
  },
  {
    name: 'value',
    required: true,
    label: 'value',
    caption: true,
    align: 'left',
    field(row: IEnvironmentVariable) {
      return row.value
    },
    format(value: string) {
      return `${value}`
    },
    sortable: true
  },
  {
    name: 'actions',
    label: '',
    field: 'actions'
  }
];

const savedNotifyOptions = (name: string) => ({
  color: 'green-4',
  textColor: 'white',
  icon: 'cloud_done',
  message: 'Environment `' + name + '` saved'
});

const addEnvironmentVariableDialogOptions = () => ({
  component: NewEnvironmentVariableDialog,
  componentProps: {name: '', value: ''}
} as QDialogOptions);


export default defineComponent({
  name: 'EnvironmentForm',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const $q = useQuasar();
    const {
      currentEnvironment,
      inserted,
      updated,
      initEnvironment,
      newEnvironment,
      assignNewEnvironment,
      saveEnvironment
    } = useEnvironmentsRepository();

    const environmentId = route.params.id as string;
    const localEnvironment = ref(newEnvironment());
    const loading = ref(false);
    const filter = ref('');

    onMounted(() => {
      initEnvironment(environmentId);
    });

    const addRow = () => {
      loading.value = true;
      $q.dialog(addEnvironmentVariableDialogOptions())
        .onOk((result: { name: string, value: string }) => {
          return localEnvironment.value.variables.push({
            uuid: v4(),
            name: result.name,
            value: result.value
          });
        })
        .onDismiss(() => loading.value = false);
    };

    const deleteRow = (row: IEnvironmentVariable) => {
      const index = localEnvironment.value.variables.findIndex(value => value.uuid === row.uuid);
      confirm('Are you sure you want to delete this item?') && localEnvironment.value.variables.splice(index, 1);
    };

    const onUpdatedEnvironment = (env: IEnvironment) => {
      assignNewEnvironment(env);
    }

    watch(() => localEnvironment.value._id, () => {
      void router.push({name: 'environment_path', params: {id: localEnvironment.value._id}});
    });

    watch(() => cloneDeep(currentEnvironment.value), () => {
      Object.assign(localEnvironment.value, currentEnvironment.value);
    });

    watch(() => cloneDeep(localEnvironment.value), () => {
      onUpdatedEnvironment(localEnvironment.value);
    });

    watch(inserted, () => {
      if (inserted) {
        $q.notify(savedNotifyOptions(localEnvironment.value.name));
        onUpdatedEnvironment(localEnvironment.value);
      }
    });

    watch(updated, () => {
      if (updated) {
        $q.notify(savedNotifyOptions(localEnvironment.value.name));
        onUpdatedEnvironment(localEnvironment.value);
      }
    });

    const onReset = () => {
      initEnvironment(environmentId);
    };


    return {
      environmentId,
      localEnvironment,
      columns,
      onUpdatedEnvironment,
      saveEnvironment,
      onReset,
      loading,
      filter,
      addRow,
      deleteRow
    }
  }
});
</script>

