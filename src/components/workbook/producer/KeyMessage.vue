<template>
  <div class="q-pt-sm q-pb-sm">
    <q-option-group
      v-model="typeGroup"
      :options="[{
          label: 'JSON',
          value: 'json'
        },{
          label: 'Avro (SR)',
          value: 'avro'
        }]"
      color="primary"
      inline
    />
  </div>
  <SchemaSelector/>
</template>
<script lang="ts">
import SchemaSelector from 'components/workbook/schema/SchemaSelector.vue';
import {ref} from 'vue';

export default {
  name: 'KeyMessage',
  components: {SchemaSelector},
  setup() {
    const typeGroup = ref('json');

    return {
      typeGroup
    }
  }
}
</script>
