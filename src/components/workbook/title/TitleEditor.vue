<template>
  <div class="q-mb-sm">
    <div class="text-h6" v-if="editMode">
      <q-input
        v-model="localName"
        @blur="nonEditable"
        @keydown.enter.prevent="$event.target.blur()"
        lazy-rules="ondemand"
        :rules="[ val => val && val.length > 0 || 'Please type something']"
      />
    </div>
    <div
      v-bind:class="editStyle"
      class="text-primary"
      v-else>
      {{ localName }}
      <q-icon name="edit" @click="editable" v-if="!editMode"/>
    </div>
  </div>
</template>
<script lang="ts">
import {defineComponent, ref, watch} from 'vue'

export default defineComponent({
  name: 'TitleEditor',
  props: {name: {type: String, default: '', required: true}, editStyle: {type:String, default: 'text-h6'}},
  emits: {
    titleChanged: null
  },
  setup(props, context) {
    const localName = ref(props.name)
    const editMode = ref(false)

    watch(() => localName.value, (newValue) => context.emit('titleChanged', newValue))
    watch(() => props.name, (newValue) => localName.value = newValue)

    const editable = () => editMode.value = true
    const nonEditable = () => editMode.value = false

    const updateLocalName = () => context.emit('titleChanged', localName.value)

    return {
      localName,
      editMode,
      editable,
      nonEditable,
      updateLocalName
    }
  }
})
</script>
