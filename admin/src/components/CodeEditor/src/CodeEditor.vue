<template>
  <div class="h-full">
    <CodeMirrorEditor
      :value="value"
      @change="handleValueChange"
      :mode="mode"
      :readonly="readonly"
    />
  </div>
</template>
<script lang="ts" setup>
  import CodeMirrorEditor from './codemirror/CodeMirrorEditor.vue';
  import { MODE } from './typing';

  defineProps({
    value: { type: String },
    mode: {
      type: String as PropType<MODE>,
      default: MODE.JS,
      validator(value: any) {
        // 这个值必须匹配下列字符串中的一个
        return Object.values(MODE).includes(value);
      },
    },
    readonly: { type: Boolean },
    autoFormat: { type: Boolean, default: true },
  });

  const emit = defineEmits(['change', 'update:value', 'format-error']);

  function handleValueChange(v) {
    emit('update:value', v);
    emit('change', v);
  }
</script>
