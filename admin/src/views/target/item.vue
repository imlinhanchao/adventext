<script setup lang="ts">
  import { TargetApi, Target } from '@/api/target';
  import { clone } from '@/utils';
  import { FormInstance } from 'element-plus';

  const props = defineProps<{
    storyId: string;
    type: string;
  }>();

  const visible = ref(false);
  const data = ref<Target>(new Target());
  const attr = ref<{ key: string, value: string, name: string}[]>([]);
  const formData = computed(() => ({ ...data.value, attr: attr.value }));
  const targetApi = computed(() => new TargetApi(props.storyId, props.type));

  const rules = {
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
    key: [{ required: true, message: '请输入标识符', trigger: 'blur' }],
    value: [{ required: true, message: '请输入值', trigger: 'blur' }],
    type: [{ required: true, message: '请输入类型', trigger: 'blur' }],
  };
  const formRef = ref<FormInstance>();

  function open(target?: Target) {
    data.value = clone(target || new Target());
    visible.value = true;
  }

  defineExpose({
    open,
  });

  const emit = defineEmits(['confirm', 'close']);
  const loading = ref(false);
  async function save() {
    if (!(await formRef.value?.validate())) {
      return;
    }

    loading.value = true;
    await targetApi.value.save(data.value).finally(() => {
      loading.value = false;
    });
    emit('confirm', data.value);
    visible.value = false;
  }
  
</script>
<template>
  <el-dialog :title="data.id ? '成就更新' : '成就创建'" v-model="visible" width="800px" @close="emit('close')" append-to-body>
    <el-form :model="formData" label-width="auto" class="colon" :rules="rules" ref="formRef">
      <el-form-item label="标识符" prop="key">
        <el-input v-model="data.key" clearable />
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="data.name" clearable />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="data.description" clearable type="textarea" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="flex justify-end">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save" :loading="loading">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>
