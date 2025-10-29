<script setup lang="ts">
  import { Draft, updateStory } from '@/api/draft';
  import { copyTextToClipboard } from '@/hooks/web/useCopyToClipboard';

  const draft = ref<Draft>();
  const visible = ref(false);
  function open(d: Draft) {
    draft.value = d;
    visible.value = true;
  }
  function copyLink() {
    if (!draft.value) return;
    const url = `${window.location.origin}/d/${draft.value.id}`;
    copyTextToClipboard(url);
    ElMessage.success('已复制到剪贴板');
  }
  const loading = ref(false);
  function submit() {
    if (!draft.value) return;
    loading.value = true;
    updateStory(draft.value)
      .then(() => {
        ElMessage.success('保存成功');
        visible.value = false;
      })
      .finally(() => {
        loading.value = false;
      });
  }

  defineExpose({
    open,
  });
</script>

<template>
  <DialogEx title="分享草稿" :width="'500px'" v-model="visible" @close="$emit('close')">
    <div v-if="draft">
      <el-form-item>
        <el-input-tag v-model="draft.shareUser" placeholder="输入允许访问该草稿的用户名" clearable>
          <template #suffix>
            <el-tooltip content="复制访问地址">
              <ButtonEx icon="i-ep:copy-document" type="text" @click="copyLink" />
            </el-tooltip>
          </template>
        </el-input-tag>
      </el-form-item>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit" :loading="loading">保存</el-button>
    </template>
  </DialogEx>
</template>
