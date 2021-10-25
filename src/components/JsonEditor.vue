<template lang="html">
  <div class="jsoneditor-container q-pt-md"
       style="height: 200px;">
    <div ref="jsonDiv"
         class="jsoneditor-box"/>
  </div>
  <div class="fit row wrap justify-end items-start content-start">
    <q-btn dense flat no-caps label="beautify" @click="beautify"/>
  </div>
</template>

<script lang="ts">
import {defineComponent, nextTick, onMounted, onUnmounted, PropType, ref, watch} from 'vue';
import JSONEditor, {JSONEditorOptions} from 'jsoneditor';
import jsonrepair from 'jsonrepair'
import {cloneDeep} from 'lodash';

export default defineComponent({
  name: 'JsonEditor',
  emits: ['jsonChanged', 'jsonInvalid', 'jsonError'],
  props: {
    options: {
      type: Object as PropType<JSONEditorOptions>,
      default: () => {
        return {}
      }
    },
    value: [Object, Array, Number, String, Boolean],
    height: {
      type: String
    }
  },
  setup(props, context) {
    const jsonDiv = ref(null as null | HTMLElement);
    const jsonEditor = ref(null as null | JSONEditor)
    const internalChange = ref(false);
    const localOptions = ref(props.options);

    const onChange = async () => {
      try {
        if (jsonEditor.value) {
          let json;
          try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
            json = jsonEditor.value.get();
            context.emit('jsonError', null);
          } catch (e) {
            json = jsonEditor.value.getText();
            context.emit('jsonError', e);
          }
          internalChange.value = true;
          context.emit('jsonChanged', JSON.stringify(json));
          await nextTick();
        }
        localOptions.value.onChange && localOptions.value.onChange();
      } catch (err) {
        context.emit('jsonError', err);
      } finally {
        internalChange.value = false
      }
    }

    const onError = (errors: Array<unknown>) => {
      if (errors && errors.length > 0) {
        context.emit('jsonInvalid', errors);
      }
    };

    const initView = () => {
      if (!jsonEditor.value) {
        const container = jsonDiv.value;
        const optionsBackup = cloneDeep(localOptions.value);
        delete localOptions.value.onChange;
        const newOptions = Object.assign(localOptions.value, {
          onChange: onChange,
          onValidationError: onError
        });

        if (container) {
          jsonEditor.value = new JSONEditor(container, newOptions);
        }
        localOptions.value.onChange = optionsBackup.onChange;
        localOptions.value.onValidationError = optionsBackup.onValidationError;
      }
      if (jsonEditor.value) {
        if (props.value) {
          try {
            jsonEditor.value.set(JSON.parse(props.value as string));
          } catch (e) {
            jsonEditor.value.set(props.value);
          }
        } else {
          jsonEditor.value.set({});
        }
      }
    }

    const beautify = () => {
      if (jsonEditor.value) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
        const json = jsonEditor.value.get();
        try {
          const repaired = jsonrepair(JSON.stringify(json));
          jsonEditor.value.set(JSON.parse(repaired));
        } catch (_) {
        }
      }
    }

    onMounted(() => {
      initView();
    });

    onUnmounted(() => {
      if (jsonEditor.value) {
        jsonEditor.value.destroy();
        jsonEditor.value = null;
      }
    });

    watch(() => props.value, (newValue) => {
      if (jsonEditor.value && newValue !== undefined && !internalChange.value) {
        jsonEditor.value.set(newValue);
      }
    });

    return {
      jsonDiv,
      internalChange,
      beautify
    }
  }
});
</script>

<style lang="css">
.jsoneditor-container {
  position: relative;
  min-width: 300px;
  width: 100%;
}

.jsoneditor-box {
  height: 100%;
}

.jsoneditor {
  background: darkgray;
  border-left: none;
  border-right: none;
  border-top: none;
  /*border-bottom: thick darkgray;*/
}

.ace-jsoneditor .ace_gutter {
  background: #ffffff;
  color: #027be3;
}
</style>
