<template>
  <router-view/>
</template>
<script lang="ts">
import {defineComponent, onMounted} from 'vue';
import useWorkbooksRepository from 'src/composables/useWorkbooksRepository';
import useBrokersRepository from 'src/composables/useBrokersRepository';
import useSchemaRegistryRepository from 'src/composables/useSchemaRegistryRepository';

export default defineComponent({
  name: 'App',
  setup() {
    const {findAllBrokers} = useBrokersRepository();
    const {findAllSchemasRegistries} = useSchemaRegistryRepository();
    const {findAllWorkbooks} = useWorkbooksRepository();

    const mount = async() => {
      await findAllBrokers();
      await findAllSchemasRegistries();
      await findAllWorkbooks();
    }

    onMounted(() => {
      void mount();
    })
  }

});


</script>

<style lang="sass">
</style>
