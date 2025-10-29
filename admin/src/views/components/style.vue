<script setup lang="ts">
  const props = defineProps<{
    modelValue?: string;
    placeholder?: string;
  }>();
  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
  }>();
  const customStyle = ref(props.modelValue);
  watch(customStyle, (val) => {
    emit('update:modelValue', val || '');
  });
  watch(
    () => props.modelValue,
    (val) => {
      customStyle.value = val;
    },
  );
  const codeVisible = ref(false);
</script>
<template>
  <el-form-item label="自定义样式" prop="customStyle">
    <section class="relative group w-full">
      <el-input
        v-model="customStyle"
        type="textarea"
        :placeholder="placeholder"
        :autosize="{
          minRows: 3,
          maxRows: 10,
        }"
      />
      <ButtonEx
        icon="i-lets-icons:full-alt"
        link
        class="group-hover:opacity-60 absolute right-1 bottom-1 z-100 opacity-0"
        @click="codeVisible = true"
      />
    </section>
  </el-form-item>
  <el-dialog title="自定义样式" v-model="codeVisible" fullscreen destroy-on-close>
    <section class="flex flex-col w-full h-full">
      <section
        class="relative group h-full bg-gray-100 dark:bg-gray-900 border-l border-r border-[var(--el-border-color)] overflow-auto"
      >
        <CodeEditor v-model:value="customStyle" class="h-full" default="css" />
        <ButtonEx
          icon="i-gridicons:fullscreen-exit"
          link
          class="group-hover:opacity-60 absolute right-1 bottom-1 z-100 opacity-0"
          @click="codeVisible = false"
        />
      </section>
    </section>
  </el-dialog>
</template>
