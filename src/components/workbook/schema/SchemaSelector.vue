
<!-- TODO REMOVE IT -->

<template>
  <div class="row justify-between items-center ">
    <div class="col-grow">
      <q-select
        v-model="selectedSchemaRegistry"
        :options="['registry 1']"
        class="q-pb-none"
        label="Schema Registry"/>
    </div>
    <div class="col-auto">
      <q-btn dense round flat icon="add"/>
    </div>
    <div class="col-grow">
      <q-select
        v-model="selectedSubject"
        :options="['payment']"
        class="q-pb-none"
        label="Subject"/>
    </div>
    <div class="col-auto">
      <q-btn dense round flat icon="add"/>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: 'SchemaSelector',
  props: {
    clusters: {},
    selectedCluster: {},
    updateCurrentBroker: {}
  }
}
</script>
