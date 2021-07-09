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
              Workbooks
            </q-toolbar-title>
            <q-btn flat round dense icon="add" :to="{name: 'workbook_path', params: {}}"/>
          </q-toolbar>
          <q-separator/>
          <q-list v-for="item in workbookItems" :key="item.name">
            <q-item clickable v-ripple :to="{ path: item.to }">
              <q-item-section>
                <q-item-label lines="1">
                  {{ item.name }}
                </q-item-label>
                <q-item-label caption lines="2">
                  <span>Producers:{{ item.producersSize }} Consumers:{{item.consumersSize}}</span>
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
import {computed, ref} from 'vue';
import {ArtifactType} from 'app/src/enums/ArtifactType';
import IWorkbookTreeItem from 'src/interfaces/trees/IWorkbookTreeItem';
import useWorkbooksRepository from 'src/composables/useWorkbooksRepository';

export default {
  name: 'WorkBookTree',
  setup() {
    const {workbooks} = useWorkbooksRepository();

    const workbookItems = computed(() =>
      workbooks.value.map(value => {
        const newId = value._id || '';
        const artifacts = value.artifacts;
        let producersSize = 0;
        let consumersSize = 0;
        if (artifacts) {
          producersSize = artifacts.filter(artifact => artifact.type === ArtifactType.PRODUCER).length;
          consumersSize = artifacts.filter(artifact => artifact.type === ArtifactType.CONSUMER).length;
        }
        return {
          to: `/workbooks/${newId}`,
          name: value.name,
          producersSize: producersSize,
          consumersSize: consumersSize,
          icon: '' // TODO icon?
        } as IWorkbookTreeItem;
      }));

    return {
      splitterModel: ref(25),
      workbookItems,
    }
  }
}
</script>

<style scoped>

</style>
