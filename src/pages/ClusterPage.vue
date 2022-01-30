<template>
  <q-page class="row">
    <ClusterTree/>
  </q-page>
</template>

<script lang="ts">
import ClusterTree from 'components/cluster/ClusterTree.vue'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ClusterPage',
  components: { ClusterTree },
  setup() {
    return {}
  }
})
</script>
