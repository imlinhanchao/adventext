<script setup lang="ts">
  import { createItem, Item, updateItem } from '@/api/item';
  import { clone } from '@/utils';
  import { FormInstance } from 'element-plus';

  const props = defineProps<{
    storyId: number;
  }>();

  const visible = ref(false);
  const data = ref<Item>(new Item());
  const attr = ref<{ key: string, value: string, name: string}[]>([]);
  const formData = computed(() => ({ ...data.value, attr: attr.value }));

  const rules = {
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
    key: [{ required: true, message: '请输入标识符', trigger: 'blur' }],
    value: [{ required: true, message: '请输入值', trigger: 'blur' }],
    type: [{ required: true, message: '请输入类型', trigger: 'blur' }],
  };
  const formRef = ref<FormInstance>();

  function open(item?: Item) {
    data.value = clone(item || new Item());
    visible.value = true;
    attr.value = Object.entries(data.value.attributes).map(([key, value]) => {
      return {
        key,
        value: value.toString(),
        name: data.value.attrName[key],
      };
    });
  }

  defineExpose({
    open,
  });

  const emit = defineEmits(['confirm']);
  async function save() {
    if (!(await formRef.value?.validate())) {
      return;
    }
    data.value.attributes = {};
    data.value.attrName = {};
    attr.value.forEach((item) => {
      if (item.key) {
        data.value.attributes[item.key] = isNaN(parseFloat(item.value)) ? item.value : parseFloat(item.value);
        if (item.name) data.value.attrName[item.key] = item.name;
      }
    });
    await (data.value.id ? updateItem : createItem)(props.storyId, data.value);
    emit('confirm', data.value);
    visible.value = false;
  }

</script>
<template>
  <el-dialog :title="data.id ? '物品更新' : '物品创建'" v-model="visible" width="800px">
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
      <el-form-item label="类型" prop="type">
        <el-input v-model="data.type" clearable />
      </el-form-item>
      <el-form-item label="属性" />
      <el-table :data="attr" class="no-error-padding w-full">
        <el-table-column prop="key" label="标识符" align="center">
          <template #default="{ row, $index: i }">
            <el-form-item :prop="`attr.${i}.key`" :rules="rules.key">
              <el-input v-model.trim="row.key" />
            </el-form-item>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" align="center">
          <template #default="{ row }">
            <el-input v-model.trim="row.name" placeholder="内置属性则留空" />
          </template>
        </el-table-column>
        <el-table-column prop="value" label="值" align="center">
          <template #default="{ row, $index: i }">
            <el-form-item :prop="`attr.${i}.value`" :rules="rules.value">
              <el-input v-model.trim="row.value" />
            </el-form-item>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #header>
            <el-button type="primary" link size="small" @click="attr.push({ key: '', value: '', name: '' })">
              <Icon icon="i-ep:circle-plus" />
            </el-button>
          </template>
          <template #default="{ $index }">
            <el-button type="danger" link size="small" @click="attr.splice($index, 1)">
              <Icon icon="i-ep:remove" />
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
    <template #footer>
      <span class="flex justify-end">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>
