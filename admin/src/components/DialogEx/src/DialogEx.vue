<!-- filepath: /home/hancel/project/text-rpg/admin/src/components/ButtonEx/src/ButtonEx.vue -->
<template>
  <el-dialog v-bind="$attrs" :fullscreen="isFullscreen" :show-close="false" lock-scroll>
    <template #header="{ close, titleId, titleClass }">
      <slot name="header" v-bind="{ close, titleId, titleClass, toggleFull }">
        <div class="relative h-full flex items-center justify-between">
          <slot name="title">
            <span class="text-2xl font-bold">{{ title }}</span>
          </slot>
          <slot name="extra" v-bind="{ close, toggleFull }">
            <div class="flex items-center justify-between">
              <Icon
                class="is-hover mr-10px cursor-pointer"
                :icon="
                  isFullscreen ? 'i-radix-icons:exit-full-screen' : 'i-radix-icons:enter-full-screen'
                "
                color="var(--el-color-info)"
                hover-color="var(--el-color-primary)"
                @click="toggleFull"
              />
              <Icon
                class="is-hover cursor-pointer"
                icon="el-icon-close"
                hover-color="var(--el-color-primary)"
                color="var(--el-color-info)"
                @click="close"
              />
            </div>
          </slot>
        </div>
      </slot>
    </template>
    <slot></slot>
    <template #footer>
      <slot name="footer"></slot>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup name="DialogEx">
  defineProps<{
    title?: string;
  }>();

  const isFullscreen = ref(false);
  function toggleFull() {
    isFullscreen.value = !isFullscreen.value;
  }
</script>
