<script lang="ts" setup>
  import { createStory, Draft, updateStory } from '@/api/draft';
  import { ElMessage, FormInstance } from 'element-plus';
  import ItemSelector from '@/views/item/selector.vue';
  import { Item } from '@/api/item';
  import { clone } from '@/utils';

  const emit = defineEmits(['confirm']);
  const visible = ref(false);
  const data = ref<Draft>(new Draft());

  function open(story?: Draft) {
    data.value = clone(story || new Draft());
    visible.value = true;
    baseAttr.value = Object.entries(data.value.attr).map(([key, value]) => {
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

  const rules = {
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
    key: [{ required: true, message: '请输入Key', trigger: 'blur' }],
    value: [{ required: true, message: '请输入值', trigger: 'blur' }],
  };

  const formData = computed(() => ({ ...data.value, baseAttr: baseAttr.value }));
  const formRef = ref<FormInstance>();
  const loading = ref(false);
  async function submit() {
    if (!(await formRef.value?.validate())) {
      return;
    }

    data.value.attr = {};
    data.value.attrName = {};
    baseAttr.value.forEach((item) => {
      if (item.key) {
        data.value.attr[item.key] = isNaN(parseFloat(item.value))
          ? item.value
          : parseFloat(item.value);
        if (item.name) data.value.attrName[item.key] = item.name;
      }
    });

    loading.value = true;
    await (data.value.id ? updateStory : createStory)(data.value).finally(() => {
      loading.value = false;
    });
    ElMessage.success('保存成功');
    visible.value = false;
    emit('confirm', data.value);
  }

  const baseAttr = ref<{ key: string; value: string; name: string }[]>([]);
  const itemRef = ref<InstanceType<typeof ItemSelector>>();
  function addInventory() {
    itemRef.value?.open(data.value.inventory).then((items: Item[]) => {
      data.value.inventory = items;
    });
  }
</script>

<template>
  <el-dialog
    :title="data.id ? '更新故事' : '创建故事'"
    v-model="visible"
    width="700px"
    class="max-h-[80vh]"
    append-to-body
  >
    <el-form ref="formRef" label-width="auto" :model="formData" :rules="rules" class="colon">
      <el-form-item label="名称" name="name">
        <el-input v-model.trim="data.name" />
      </el-form-item>
      <el-form-item label="描述" name="description">
        <el-input v-model="data.description" type="textarea" />
      </el-form-item>
      <el-form-item label="人物基础属性" class="no-error" />
      <el-table :data="baseAttr" class="no-error-padding w-full">
        <el-table-column prop="key" label="标识符" align="center">
          <template #default="{ row, $index: i }">
            <el-form-item :prop="`baseAttr.${i}.key`" :rules="rules.key">
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
            <el-form-item :prop="`baseAttr.${i}.value`" :rules="rules.value">
              <el-input v-model.trim="row.value" />
            </el-form-item>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #header>
            <el-button
              type="primary"
              link
              size="small"
              @click="baseAttr.push({ key: '', value: '', name: '' })"
            >
              <Icon icon="i-ep:circle-plus" />
            </el-button>
          </template>
          <template #default="{ $index }">
            <el-button type="danger" link size="small" @click="baseAttr.splice($index, 1)">
              <Icon icon="i-ep:remove" />
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-form-item label="人物初始背包" v-if="data.id">
        <el-button type="primary" link size="small" @click="addInventory">
          <Icon icon="i-ep:circle-plus-filled" />
        </el-button>
        <el-tag
          v-for="(item, i) in data.inventory"
          :key="i"
          class="mr-2"
          closable
          @close="data.inventory.splice(i, 1)"
        >
          {{ item.name }}×{{ item.count }}
        </el-tag>
      </el-form-item>
      <ItemSelector v-if="data.id" ref="itemRef" :story="data.id" multiple inventory type="draft" />
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit" :loading="loading">保存</el-button>
    </template>
  </el-dialog>
</template>
