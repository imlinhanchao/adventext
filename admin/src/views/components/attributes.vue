<script lang="ts" setup>
  import Sortable from 'sortablejs';
  import { IAttribute } from '@/api/scene';
  import { ElTable } from 'element-plus';

  const props = withDefaults(defineProps<{
    prop?: string;
    attributes: IAttribute[];
  }>(), {
    prop: 'attr',
  });
  const emit = defineEmits(['update:attributes']);
  
  const tableKey = ref<number>(0);
  const tableRef = ref<InstanceType<typeof ElTable>>();
  function rowDrop() {
    if (!tableRef.value) return;
    const tbody = tableRef.value.$el.querySelector('.el-table__body-wrapper tbody');
    Sortable.create(tbody, {
      handle: '.move',
      animation: 300,
      ghostClass: 'ghost',
      onEnd: ({ newIndex, oldIndex }) => {
        const tableData = (data.value as IAttribute[]) || [];
        const currRow = tableData.splice(oldIndex, 1)[0];
        tableData.splice(newIndex, 0, currRow);
        tableKey.value++;
        nextTick(() => rowDrop());
      },
    });
  }

  const data = ref<IAttribute[]>(props.attributes || []);
  watch(() => props.attributes, (val) => {
    data.value = val;
  });
  watch(data, (val) => {
    emit('update:attributes', val);
  }, { deep: true });

  const rules = {
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
    key: [{ required: true, message: '请输入Key', trigger: 'blur' }],
    value: [{ required: true, message: '请输入值', trigger: 'blur' }],
  };

  function addAttribute() {
    data.value.push(new IAttribute());
    nextTick(() => rowDrop());
  }
  function removeAttribute(index: number) {
    data.value.splice(index, 1);
    nextTick(() => rowDrop());
  }

  onMounted(() => {
    nextTick(() => rowDrop());
  });
</script>

<template>
    <el-table ref="tableRef" :data="data" class="no-error-padding w-full" max-height="50vh" :key="tableKey">
      <el-table-column label="#" width="50" align="center">
        <template #default>
          <el-button type="primary" link class="move cursor-move" icon="el-icon-d-caret" />
        </template>
      </el-table-column>
      <el-table-column prop="key" label="标识符" align="center">
        <template #default="{ row, $index: i }">
          <el-form-item :prop="`${prop}.${i}.key`" :rules="rules.key">
            <el-input v-model.trim="row.key" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="名称" align="center">
        <template #default="{ row }">
          <el-input v-model.trim="row.name" placeholder="内置属性则留空" />
        </template>
      </el-table-column>
      <el-table-column prop="type" label="分类" align="center">
        <template #default="{ row }">
          <el-input v-model.trim="row.type" />
        </template>
      </el-table-column>
      <el-table-column prop="value" label="值" align="center">
        <template #default="{ row, $index: i }">
          <el-form-item :prop="`${prop}.${i}.value`" :rules="rules.value">
            <el-input v-model.trim="row.value" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" align="center">
        <template #default="{ row }">
          <el-input v-model.trim="row.remark" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" align="center">
        <template #header>
          <el-button
            type="primary"
            link
            size="small"
            @click="addAttribute"
          >
            <Icon icon="i-ep:circle-plus" />
          </el-button>
        </template>
        <template #default="{ $index }">
          <el-button type="danger" link size="small" @click="removeAttribute($index)">
            <Icon icon="i-ep:remove" />
          </el-button>
        </template>
      </el-table-column>
    </el-table>
</template>
