<script setup lang="ts">
  import Sortable from 'sortablejs';
  import { ConditionType, Condition } from '@/api/scene';
  import { ElTable } from 'element-plus';
  import ConditionForm from './condition.vue';
  import { contentFormat } from './index';

  const props = withDefaults(defineProps<{
    type: string;
    checkOnly?: boolean;
    conditions?: Condition[];
    title?: string;
  }>(), {
    checkOnly: false,
    conditions: () => [],
    title: '条件列表',
  });
  const emit = defineEmits<{
    (e: 'update:conditions', value: Condition[]): void;
  }>();

  const conditions = ref(props.conditions);
  watch(() => props.conditions, (val) => {
    conditions.value = val || [];
  });
  watch(conditions, (val) => {
    emit('update:conditions', val || []);
  });

  onMounted(() => {
    if (!conditions.value) conditions.value = [];
    nextTick(() => {
      rowDrop();
    });
  });

  const tableKey = ref<number>(Date.now());
  const conditionTableRef = ref<InstanceType<typeof ElTable>>();
  function rowDrop() {
    if (!conditionTableRef.value) return;
    const tbody = conditionTableRef.value.$el.querySelector('.el-table__body-wrapper tbody');
    Sortable.create(tbody, {
      handle: '.move',
      animation: 300,
      ghostClass: 'ghost',
      onEnd: ({ newIndex, oldIndex }) => {
        const tableData = conditions.value || [];
        const currRow = tableData.splice(oldIndex, 1)[0];
        tableData.splice(newIndex, 0, currRow);
        tableKey.value++;
        nextTick(() => rowDrop());
      },
    });
  }

  const conditionRef = ref<InstanceType<typeof ConditionForm>>();
  function addCon() {
    conditionRef.value?.open(new Condition()).then((condition: Condition) => {
      if (!conditions.value) conditions.value = []
      conditions.value.push(condition);
      nextTick(() => rowDrop());
    });
  }
  function editCon(condition: Condition) {
    conditionRef.value?.open(condition).then((data: Condition) => {
      Object.assign(condition, data);
      emit('update:conditions', conditions.value);
    });
  }
</script>

<template>
  <el-divider>
    {{ title }}({{ conditions?.length || 0 }})
    <el-tooltip placement="top">
      <template #content>
        <p>
          用于对玩家选择选项的前置判断，确认玩家是否满足触发选项的条件。也可以通过勾选<b>用于隐藏选项</b>，在获取选项阶段用于过滤选项。
        </p>
      </template>
      <Icon icon="i-ep:info-filled" :size="14" />
    </el-tooltip>
  </el-divider>
  <el-table ref="conditionTableRef" :data="conditions" border stripe :key="tableKey">
    <el-table-column label="#" width="50" align="center">
      <template #default>
        <el-button type="primary" link class="move cursor-move" icon="el-icon-d-caret" />
      </template>
    </el-table-column>
    <el-table-column prop="type" label="类型" :formatter="({type}) => ConditionType[type]" />
    <el-table-column prop="name" label="条件对象" />
    <el-table-column prop="content" label="内容" show-overflow-tooltip :formatter="contentFormat" />
    <el-table-column prop="tip" label="提示" show-overflow-tooltip />
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
        <el-button type="danger" link size="small" @click="conditions?.splice($index, 1)">
          <Icon icon="i-ep:remove" />
        </el-button>
      </template>
    </el-table-column>
  </el-table>
  <ConditionForm ref="conditionRef" :type="type" :checkOnly="checkOnly" />
</template>
