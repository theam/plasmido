<template>
  <q-btn-dropdown
    flat
    outline
    round
    dense
    unelevated
    fab-mini
    :label="buttonLabel"
    dropdown-icon="o_more_vert">
    <q-list>
      <q-item clickable v-close-popup @click="onClone(value)">
        <q-item-section>
          <q-item-label>Duplicate</q-item-label>
        </q-item-section>
      </q-item>
      <q-separator/>
      <q-item clickable v-close-popup @click="onDelete(value)">
        <q-item-section>
          <q-item-label class="text-red">Remove</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>
<script lang="ts">
import {defineComponent} from 'vue'

export default defineComponent({
  name: 'BasicOptions',
  props: {
    onClone: {},
    onDelete: {},
    value: {type: String, default:''},
    buttonLabel: {type: String, default: ''}
  },
  setup() {
    return {}
  }
})
</script>
