<template>
  <q-page class="row">
    <WorkBookTree/>
  </q-page>
</template>

<script lang="ts">
import WorkBookTree from 'components/workbook/WorkBookTree.vue';
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'WorkBooksPage',
  components: {WorkBookTree},
  setup() {
    return {};
  }
});
</script>
