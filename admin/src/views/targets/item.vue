<script setup lang="ts">
  import { Condition, ConditionType } from '@/api/scene';
  import { TargetApi, Target } from '@/api/target';
  import { clone } from '@/utils';
  import { FormInstance } from 'element-plus';
  import ConditionForm from '@/views/components/condition.vue';
  import { contentFormat } from '@/views/scene/';

  const props = defineProps<{
    storyId: string;
    type: string;
  }>();

  const visible = ref(false);
  const data = ref<Target>(new Target());
  const attr = ref<{ key: string; value: string; name: string }[]>([]);
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

  const conditionRef = ref<InstanceType<typeof ConditionForm>>();
  function addCon() {
    conditionRef.value?.open().then((condition: Condition) => {
      if (!data.value.conditions) data.value.conditions = [];
      data.value.conditions.push(condition);
    });
  }
  function editCon(condition: Condition) {
    conditionRef.value?.open(condition).then((data: Condition) => {
      Object.assign(condition, data);
    });
  }
</script>
<template>
  <el-dialog
    :title="data.id ? '成就更新' : '成就创建'"
    v-model="visible"
    width="800px"
    @close="emit('close')"
    append-to-body
  >
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
      <ConditionForm ref="conditionRef" :type="type" check-only />
      <el-divider>
        获得的条件
        <el-tooltip placement="top">
          <template #content>
            <p>
              用于触发效果的前置判断，确认玩家是否满足触发效果的条件。不设置则只要触发选项就触发效果。
            </p>
          </template>
          <Icon icon="i-ep:info-filled" :size="14" />
        </el-tooltip>
      </el-divider>
      <el-table :data="data.conditions" border stripe>
        <el-table-column prop="type" label="类型" :formatter="({ type }) => ConditionType[type]" />
        <el-table-column prop="name" label="条件对象" />
        <el-table-column
          prop="content"
          label="内容"
          show-overflow-tooltip
          :formatter="contentFormat"
        />
        <el-table-column label="操作" width="100px" align="center">
          <template #header>
            <el-button type="primary" link size="small" @click="addCon">
              <Icon icon="i-ep:circle-plus" />
            </el-button>
          </template>
          <template #default="{ row, $index }">
            <el-button type="primary" link size="small" @click="editCon(row)">
              <Icon icon="i-ep:edit" />
            </el-button>
            <el-button type="danger" link size="small" @click="data.conditions?.splice($index, 1)">
              <Icon icon="i-ep:remove" />
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
    <template #footer>
      <span class="flex justify-end">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save" :loading="loading">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>
