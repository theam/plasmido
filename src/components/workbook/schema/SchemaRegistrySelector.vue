<template>
  <div class="full-width row  justify-between items-center">
    <div class="col" style="overflow: auto;">
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
  </div>
</template>
<script lang="ts">
import {computed, defineComponent, onMounted, ref, watch} from 'vue';
import useSchemaRegistryRepository from 'src/composables/useSchemaRegistryRepository';
import useSchemaRegistry from 'src/composables/useSchemaRegistry';
import {ISchemaRegistry} from 'src/interfaces/schemaRegistry/ISchemaRegistry';
import {
  ISchemaRegistrySelector,
  schemaRegistryToSchemaRegistrySelector
} from 'src/interfaces/selectors/ISchemaRegistrySelector';

export default defineComponent({
  name: 'SchemaRegistrySelector',
  props: {
    originSchemaRegistryId: {type: String, default: ''},
    originSchemaId: {type: Number, default: 0}
  },
  emits: {
    selectedSchemaRegistryChanged: null
  },
  setup(props, context) {
    const selectedSchemaRegistry = ref(null as null | ISchemaRegistrySelector);
    const isSelectedSchemaRegistryEmpty = ref(true);
    const {schemasRegistries, currentSchemaRegistry, initSchemaRegistry} = useSchemaRegistryRepository();
    const {searchingSchemas} = useSchemaRegistry();

    onMounted(() => {
      try {
        initSchemaRegistry(props.originSchemaRegistryId);
      } catch (e) {
        console.error(e);
      }
      selectedSchemaRegistry.value = schemaRegistryToSchemaRegistrySelector(currentSchemaRegistry.value);
      isSelectedSchemaRegistryEmpty.value = selectedSchemaRegistry.value === null;
    });

    const schemaRegistriesSelector = computed(() => schemasRegistries.value?.map(schemaRegistry => schemaRegistryToSchemaRegistrySelector(schemaRegistry)));

    const onSelectedSchemaRegistryUpdated = () => {
      const schemaRegistrySelector = selectedSchemaRegistry.value;
      isSelectedSchemaRegistryEmpty.value = schemaRegistrySelector === null;
      const schemaRegistry = schemaRegistrySelector?.schemaRegistry;
      emitSelectedSchemaRegistryChanged(schemaRegistry);
    }

    watch(selectedSchemaRegistry, () => onSelectedSchemaRegistryUpdated());

    const emitSelectedSchemaRegistryChanged = (value: ISchemaRegistry | undefined) => {
      context.emit('selectedSchemaRegistryChanged', value?._id);
    };

    return {
      selectedSchemaRegistry: selectedSchemaRegistry,
      schemaRegistriesSelector: schemaRegistriesSelector,
      isSelectedSchemaRegistryEmpty: isSelectedSchemaRegistryEmpty,
      searchingSchemas
    }
  }
});
</script>

