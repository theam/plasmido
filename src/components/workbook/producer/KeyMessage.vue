<template>
  <div class="q-pt-sm q-pb-sm">
    <q-option-group
      v-model="typeGroup"
      :options="[{
          label: 'JSON',
          value: 'json'
        },{
          label: 'Schema (SR)',
          value: 'avro'
        }]"
      color="primary"
      inline
    />
  </div>
</template>
<script lang="ts">
import {ref} from 'vue'

export default {
  name: 'KeyMessage',
  setup() {
    const typeGroup = ref('json')

    return {
      typeGroup
    }
  }
}
</script>
