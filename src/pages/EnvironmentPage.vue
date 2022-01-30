<template>
  <q-page class="row">
    <EnvironmentTree/>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import EnvironmentTree from 'components/environment/EnvironmentTree.vue'

export default defineComponent({
  name: 'EnvironmentPage',
  components: { EnvironmentTree },
  setup() {
    return {}
  }
})
</script>
