<template>
  <q-btn-dropdown
    flat
    outline
    round
    dense
    dropdown-icon="o_settings">
    <q-list>
      <q-item clickable v-close-popup @click="onCloneArtifact">
        <q-item-section>
          <q-item-label>Duplicate</q-item-label>
        </q-item-section>
      </q-item>
      <q-separator/>
      <q-item clickable v-close-popup @click="onDeleteArtifact">
        <q-item-section>
          <q-item-label class="text-red">Remove</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>
<script lang="ts">
import {defineComponent, inject} from 'vue';

export default defineComponent({
  name: 'ArtifactOptions',
  props: {
    onCloneArtifact: {},
    onDeleteArtifact: {}
  },
  setup(props) {
    const cloneArtifact = inject('cloneArtifact') as (artifactUUID: string) => string;
    const deleteArtifact = inject('deleteArtifact') as (artifactUUID: string) => string;

    return {
      cloneArtifact,
      deleteArtifact
    }
  }
});
</script>
