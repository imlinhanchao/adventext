<template>
  <div class="relative !h-full w-full overflow-hidden" ref="el"></div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, onUnmounted, watchEffect, watch, unref, nextTick } from 'vue';
  import { useWindowResize } from '@/hooks/event/useWindowResize';
  import CodeMirror from 'codemirror';
  import { MODE } from '../typing';
  // css
  import './codemirror.css';
  import 'codemirror/theme/idea.css';
  import 'codemirror/theme/material-palenight.css';
  // modes
  import 'codemirror/mode/javascript/javascript';
  import 'codemirror/mode/css/css';
  import 'codemirror/mode/htmlmixed/htmlmixed';
  import { useDark } from '@vueuse/core';

  const isDark = useDark();

  const props = defineProps({
    mode: {
      type: String as PropType<MODE>,
      default: MODE.JSON,
      validator(value: any) {
        // 这个值必须匹配下列字符串中的一个
        return Object.values(MODE).includes(value);
      },
    },
    value: { type: String, default: '' },
    readonly: { type: Boolean, default: false },
  });

  const emit = defineEmits(['change']);

  const el = ref();
  let editor: Nullable<CodeMirror.Editor>;

  watch(
    () => props.value,
    async (value) => {
      await nextTick();
      const oldValue = editor?.getValue();
      if (value !== oldValue) {
        editor?.setValue(value ? value : '');
      }
    },
    { flush: 'post' },
  );

  watchEffect(() => {
    editor?.setOption('mode', props.mode);
  });

  watch(
    () => isDark.value,
    async () => {
      setTheme();
    },
    {
      immediate: true,
    },
  );

  function setTheme() {
    unref(editor)?.setOption('theme', !isDark.value ? 'idea' : 'material-palenight');
  }

  function refresh() {
    editor?.refresh();
  }

  async function init() {
    const addonOptions = {
      autoCloseBrackets: true,
      autoCloseTags: true,
      foldGutter: true,
      gutters: ['CodeMirror-linenumbers'],
    };

    editor = CodeMirror(el.value!, {
      value: '',
      mode: props.mode,
      readOnly: props.readonly,
      tabSize: 2,
      theme: 'material-palenight',
      lineWrapping: true,
      lineNumbers: true,
      ...addonOptions,
    });
    editor?.setValue(props.value);
    setTheme();
    editor?.on('change', () => {
      emit('change', editor?.getValue());
    });
  }

  onMounted(async () => {
    await nextTick();
    init();
    useWindowResize(refresh);
  });

  onUnmounted(() => {
    editor = null;
  });
</script>
