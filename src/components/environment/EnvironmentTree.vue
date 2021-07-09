<template>
  <div>
    <q-splitter
      v-model="splitterModel"
      class="absolute-full"
      :limits="[15, 40]"
    >
      <template v-slot:before>
        <div class="q-pa-md">
          <q-toolbar>
            <q-toolbar-title class="text-primary">
              Environments
            </q-toolbar-title>
            <q-btn flat round dense icon="add" :to="{name: 'environment_path', params: {}}"/>
          </q-toolbar>
          <q-separator/>
          <q-list v-for="item in environmentItems" :key="item.name">
            <q-item clickable v-ripple :to="{ path: item.to }">
              <q-item-section>
                <q-item-label lines="1">
                  {{ item.name }}
                </q-item-label>
              </q-item-section>
              <q-item-section top side>
                <div class="text-grey-8 q-gutter-xs">
                  <q-btn class="gt-xs" size="12px" flat dense round icon="more_vert"/>
                </div>
              </q-item-section>
            </q-item>
            <q-separator/>
          </q-list>
        </div>
      </template>

      <template v-slot:after>
        <router-view :key="$route.path"/>
      </template>
    </q-splitter>
  </div>
</template>
<script lang="ts">
import {computed, defineComponent, ref} from 'vue'
import useEnvironmentsRepository from 'src/composables/useEnvironmentsRepository';
import IEnvironmentTreeItem from 'src/interfaces/trees/IEnvironmentTreeItem';

export default defineComponent({
  name: 'EnvironmentTree',
  setup() {
    const {environments} = useEnvironmentsRepository();

    const environmentItems = computed(() =>
      environments.value.map(value => {
        const id = value._id || '';
        return {
          to: '/environments/' + id,
          name: value.name
        } as IEnvironmentTreeItem;
      }));

    return {
      splitterModel: ref(25),
      environmentItems
    }
  }
});
</script>

<style scoped>

</style>
