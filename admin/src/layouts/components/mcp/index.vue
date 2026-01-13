<script setup lang="ts" name="User">
  import { useUserStore } from '@/store/modules/user';
  import { copyTextToClipboard } from '@/hooks/web/useCopyToClipboard';

  const userStore = useUserStore();

  function copyMcp() {
    copyTextToClipboard(`
    "adventext-creator": {
      "url": "${location.origin}/api/mcp/sse",
      "headers": {
        "Authorization": "Bearer ${userStore.getToken}"
      }
    }
    `);
    ElMessage.success('复制成功');
  }
</script>
<template>
  <el-tooltip content="复制 MCP Server">
    <el-button link @click="copyMcp" size="small">
      <Icon icon="i-mingcute:mcp-line" size="20" />
    </el-button>
  </el-tooltip>
</template>
