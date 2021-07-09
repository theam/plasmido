<template>
  <div class="full-width row  justify-between items-center">
    <div class="col" style="overflow: auto;">
      <!--      TODO Improve rules-->
      <q-select
        v-model="selectedSchemaRegistry"
        :options="schemaRegistriesSelector"
        label="Schema Registry"
        class="q-pb-none"
        dense
      >
        <template v-slot:selected-item="scope">
          <div class="ellipsis">{{ scope.opt.label }}</div>
          <q-tooltip>{{ scope.opt.label }}</q-tooltip>
        </template>

        <template v-slot:option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section>
              <q-item-label v-html="scope.opt.label"/>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>
    <div class="col" style="overflow: auto; min-width: 40px; max-width: 40px;">
      <q-btn class="gt-xs" size="12px" flat dense round icon="more_vert">
        <q-menu anchor="bottom left" self="top left">
          <q-list style="min-width: 100px">
            <q-item clickable @click="openAddSchemaRegistry()">
              <q-item-section>Add</q-item-section>
            </q-item>
            <q-item clickable @click="openEditSchemaRegistry()" :disable="isSelectedSchemaRegistryEmpty">
              <q-item-section>Edit</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>
    <div class="col" style="overflow: auto;">
      <q-select
        v-model="selectedSubject"
        :options="subjectSelector"
        @update:modelValue="emitSelectedSubjectChanged"
        :class="{ disabled: disableSubjects }"
        :loading="searchingSchemas"
        label="Schemas"
        class="q-pb-none"
        dense
      >
        <template v-slot:selected-item="scope">
          <div class="ellipsis">{{ scope.opt.label }}</div>
          <q-tooltip>{{ scope.opt.label }}</q-tooltip>
        </template>
      </q-select>
    </div>
    <div class="col" style="overflow: auto; min-width: 40px; max-width: 40px;">
      <q-btn dense round flat icon="o_open_in_full" @click="openSubjects()" :class="{ disabled: disableSubjects }"/>
    </div>
  </div>
</template>
<script lang="ts">
import {computed, defineComponent, onMounted, ref, watch} from 'vue';
import {useQuasar} from 'quasar';
import useSchemaRegistryRepository from 'src/composables/useSchemaRegistryRepository';
import useSchemaRegistry from 'src/composables/useSchemaRegistry';
import {ISubjectSelector, subjectToSubjectSelector} from 'src/interfaces/selectors/ISubjectSelector';
import {ISchemaRegistry} from 'src/interfaces/schemaRegistry/ISchemaRegistry';
import {
  ISchemaRegistrySelector,
  schemaRegistryToSchemaRegistrySelector
} from 'src/interfaces/selectors/ISchemaRegistrySelector';

const dialogSchemaRegistryNotifyOptions = (selectedSchemaRegistryId: string | null) => ({
  // component: SchemaRegistryDialog,
  // componentProps: {schemaRegistryId: selectedSchemaRegistryId}
});

// TODO
const dialogSubjectNotifyOptions = (schemaRegistry: ISchemaRegistry,
                                  subject: string) => ({
  // component: SchemaDialog,
  // componentProps: {
  //   selectedSchemaRegistry: schemaRegistry,
  //   schemaRegistryOptions: buildConnectionOptions(schemaRegistry),
  //   selectedSubject: schemaName
  // }
});

export default defineComponent({
  name: 'SchemaRegistrySubjectSelector',
  props: {
    originSchemaRegistryId: {type: String, default: ''},
    originSubject: {type: String, default: ''},
    originSchemaId: {type: Number, default: 0}
  },
  emits: {
    selectedSchemaRegistryChanged: null,
    selectedSubjectChanged: null
  },
  setup(props, context) {
    const $q = useQuasar();
    const selectedSchemaRegistry = ref(null as null | ISchemaRegistrySelector);
    const selectedSubject = ref(null as null | ISubjectSelector);
    const isSelectedSchemaRegistryEmpty = ref(true);
    const {schemasRegistries, currentSchemaRegistry, initSchemaRegistry} = useSchemaRegistryRepository();
    const {schemas, getSchemas, searchingSchemas, resetSchemas, resetConnection} = useSchemaRegistry();

    onMounted(() => {
      initSchemaRegistry(props.originSchemaRegistryId);
      selectedSchemaRegistry.value = schemaRegistryToSchemaRegistrySelector(currentSchemaRegistry.value);
      isSelectedSchemaRegistryEmpty.value = selectedSchemaRegistry.value === null;
      if (props.originSchemaRegistryId === '') {
        resetSchemas();
      }
    });

    const schemaRegistriesSelector = computed(() => schemasRegistries.value?.map(schemaRegistry => schemaRegistryToSchemaRegistrySelector(schemaRegistry)));
    const subjectSelector = computed(() => schemas.value?.map(schema => subjectToSubjectSelector(schema.subject, schema.id)));
    const disableSubjects = computed(() => isSelectedSchemaRegistryEmpty.value || schemas.value?.length === 0);

    const onSelectedSchemaRegistryUpdated = async (prevValue: ISchemaRegistrySelector | null) => {
      const schemaRegistrySelector = selectedSchemaRegistry.value;
      isSelectedSchemaRegistryEmpty.value = schemaRegistrySelector === null;
      const schemaRegistry = schemaRegistrySelector?.schemaRegistry;
      emitSelectedSchemaRegistryChanged(schemaRegistry);

      resetConnection();
      await getSchemas(schemaRegistry);
      selectedSubject.value = prevValue === null ? subjectToSubjectSelector(props.originSubject, props.originSchemaId) : null;
      emitSelectedSubjectChanged(selectedSubject.value);
    }

    watch(selectedSchemaRegistry, (newValue, prevValue) => void onSelectedSchemaRegistryUpdated(prevValue));

    const openAddSchemaRegistry = () => {
      $q.dialog(dialogSchemaRegistryNotifyOptions(null))
        .onOk((data: ISchemaRegistry) => {
          selectedSchemaRegistry.value = schemaRegistryToSchemaRegistrySelector(data);
        });
    };

    const openEditSchemaRegistry = () => {
      const selectedSchemaRegistryId = selectedSchemaRegistry.value?.value || '';
      $q.dialog(dialogSchemaRegistryNotifyOptions(selectedSchemaRegistryId))
        .onOk((data: ISchemaRegistry) => {
          selectedSchemaRegistry.value = schemaRegistryToSchemaRegistrySelector(data);
        });
    };

    const openSubjects = () => {
      const schemaRegistry = selectedSchemaRegistry.value?.schemaRegistry;
      const subject = selectedSubject.value?.value;
      if (schemaRegistry === undefined) {
        return null;
      }
      $q.dialog(dialogSubjectNotifyOptions(schemaRegistry, subject || ''))
        .onOk((subject: string, schemaId: number) => {
          selectedSubject.value = subjectToSubjectSelector(subject, schemaId);
          emitSelectedSubjectChanged(selectedSubject.value);
        });
    };

    const emitSelectedSchemaRegistryChanged = (value: ISchemaRegistry | undefined) => {
      context.emit('selectedSchemaRegistryChanged', value?._id);
    };

    const emitSelectedSubjectChanged = (value: null | ISubjectSelector) => {
      context.emit('selectedSubjectChanged', value);
    };

    return {
      selectedSchemaRegistry: selectedSchemaRegistry,
      selectedSubject: selectedSubject,
      schemaRegistriesSelector: schemaRegistriesSelector,
      subjectSelector,
      isSelectedSchemaRegistryEmpty: isSelectedSchemaRegistryEmpty,
      disableSubjects,
      searchingSchemas,
      emitSelectedSubjectChanged,
      openAddSchemaRegistry,
      openEditSchemaRegistry,
      openSubjects,
    }
  }
});
</script>

