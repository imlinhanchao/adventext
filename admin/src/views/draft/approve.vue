<script setup lang="ts">
  import { approveStory, Draft } from '@/api/draft';
  import { FormInstance } from 'element-plus';

  const emit = defineEmits(['confirm', 'close']);
  const story = ref(new Draft());
  const visible = ref(false);
  const data = ref({
    pass: false,
    reason: '',
  });
  const formRef = ref<FormInstance>();
  const rules = computed(() => ({
    reason: [{ required: !data.value.pass, message: '请输入审核原因', trigger: 'blur' }],
  }));
  const loading = ref(false);
  async function submit() {
    if (!(await formRef.value?.validate())) {
      return;
    }
    loading.value = true;
    await approveStory(story.value.id!, data.value).finally(() => {
      loading.value = false;
    });
    ElMessage.success('审核成功');
    visible.value = false;
    emit('confirm', data.value);
  }
  function open(storyData: Draft) {
    story.value = storyData;
    visible.value = true;
    data.value = {
      pass: false,
      reason: '',
    };
  }

  defineExpose({
    open,
  });
</script>

<template>
  <el-dialog title="审核故事" v-model="visible" width="500px">
    <el-form :model="data" label-width="auto" class="colon" :rules="rules" ref="formRef">
      <el-form-item label="故事名称" prop="name">
        <el-link type="primary" :to="`/approve/${story.id}/scene`">{{ story.name }}</el-link>
      </el-form-item>
      <el-form-item label="是否通过" prop="pass">
        <el-switch v-model="data.pass" />
      </el-form-item>
      <el-form-item label="审核原因" prop="reason">
        <el-input v-model="data.reason" clearable />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="primary" @click="submit" :loading="loading">确定</el-button>
    </template>
  </el-dialog>
</template>
