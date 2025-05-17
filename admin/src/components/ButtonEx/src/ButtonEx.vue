<!-- filepath: /home/hancel/project/text-rpg/admin/src/components/ButtonEx/src/ButtonEx.vue -->
<template>
  <el-tooltip v-if="content" :content="content" :placement="placement">
    <template #default>
      <el-button v-bind="$attrs">
        <template v-if="icon">
          <Icon :icon="icon" />
          <span v-if="$slots.default"><slot></slot></span>
        </template>
        <template v-else>
          <slot></slot>
        </template>
      </el-button>
    </template>
  </el-tooltip>
  <el-button v-else v-bind="$attrs">
    <template v-if="icon">
      <Icon :icon="icon" />
      <span v-if="$slots.default"><slot></slot></span>
    </template>
    <template v-else>
      <slot></slot>
    </template>
  </el-button>
</template>

<script lang="ts" setup name="ButtonEx">
  import { ElButton, Placement, ElTooltip } from 'element-plus';
  import Icon from '@/components/Icon';


  defineProps<{
    content?: string;
    placement?: Placement;
    icon?: string;
  }>();
</script>
