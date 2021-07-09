<template>
  <div class="row justify-center items-center self-center" style="height:200px" v-if="showMe">
    <div class="items-center">
      You don't have any Producer or Consumer.<p/>
      Create a new
      <q-btn
        dense
        flat
        size="12px"
        no-caps
        label="Producer"
        @click="addProducer"
      />
      or
      <q-btn
        dense
        flat
        size="12px"
        no-caps
        label="Consumer"
        @click="addConsumer"
      />
    </div>
  </div>
</template>
<script lang="ts">
import {computed, defineComponent, PropType} from 'vue';
import {IArtifact} from 'src/interfaces/workbooks/IArtifact';

export default defineComponent({
  name: 'NewArtifact',
  props: {
    addConsumer: {type: Function, required: true},
    addProducer: {type: Function, required: true},
    workbookArtifacts: {type: Object as PropType<Array<IArtifact>>}
  },
  setup(props) {

    // computed
    const showMe = computed(() => {
      return !props.workbookArtifacts || props.workbookArtifacts.length === 0
    });

    return {showMe}
  }
});
</script>
