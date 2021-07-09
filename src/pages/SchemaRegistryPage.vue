<template>
  <q-page class="row">
    <SchemaRegistryTree/>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import SchemaRegistryTree from 'components/schemas/SchemaRegistryTree.vue';

export default defineComponent({
  name: 'SchemaRegistryPage',
  components: { SchemaRegistryTree },
  setup() {
    return {};
  }
});
</script>
