<script lang="ts" setup>
  import { ElMessage, FormInstance } from 'element-plus';
  import { clone } from '@/utils';
  import { updateUser, User } from '@/api/user';

  const emit = defineEmits(['confirm']);
  const visible = ref(false);
  const data = ref<User>();

  function open(user: User) {
    data.value = clone(user);
    visible.value = true;
  }

  defineExpose({
    open,
  });

  const rules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  };

  const formData = computed(() => ({ ...data.value }));
  const formRef = ref<FormInstance>();
  async function submit() {
    if (!(await formRef.value?.validate())) {
      return;
    }

    await updateUser(data.value!);
    ElMessage.success('保存成功');
    visible.value = false;
    emit('confirm', data.value);
  }
</script>

<template>
  <el-dialog
    title="更新用户"
    v-model="visible"
    width="700px"
    class="max-h-[80vh]"
  >
    <el-form v-if="data" ref="formRef" label-width="auto" :model="formData" :rules="rules" class="colon">
      <el-form-item label="用户名" name="username">
        <el-input v-model.trim="data.username" />
      </el-form-item>
      <el-form-item label="密码" name="password">
        <el-input v-model="data.password" type="password" />
      </el-form-item>
      <el-form-item label="是否管理员" name="isAdmin">
        <el-switch v-model="data.isAdmin" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>
