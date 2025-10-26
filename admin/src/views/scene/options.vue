<script lang="ts" setup>
  import Sortable from 'sortablejs';
  import { Option, Scene } from '@/api/scene';
  import { ElMessage, ElMessageBox, ElTable } from 'element-plus';
  import OptionForm from './option.vue';
  import { copyTextToClipboard } from '@/hooks/web/useCopyToClipboard';
  import { useEventListener } from '@/hooks/event/useEventListener';

  const props = withDefaults(defineProps<{
    story: string;
    type: string;
    scenes: Scene[];
    options?: Option[];
    title?: string;
  }>(), {
    options: () => [],
    title: '选项列表',
  });
  const emit = defineEmits<{
    (e: 'update:options', value: Option[]): void;
  }>();

  const options = ref(props.options);
  watch(() => props.options, (val) => {
    options.value = val || [];
  });
  watch(options, (val) => {
    emit('update:options', val || []);
  });

  const excludeOptions = ref<Option[]>([]);
  const optionRef = ref<InstanceType<typeof OptionForm>>();
  function addOption() {
    excludeOptions.value = options.value;
    optionRef.value?.open().then((option: Option) => {
      options.value.push(option);
      nextTick(() => rowDrop());
    });
  }

  function editOption(option: Option) {
    excludeOptions.value = options.value.filter((o) => o !== option);
    optionRef.value?.open(option).then((data: Option) => {
      Object.assign(option, data);
    });
  }

  const optionTableRef = ref<InstanceType<typeof ElTable>>();
  const optionsKey = ref(0);
  function rowDrop() {
    if (!optionTableRef.value) return;
    const tbody = optionTableRef.value.$el.querySelector('.el-table__body-wrapper tbody');
    Sortable.create(tbody, {
      handle: '.move',
      animation: 300,
      ghostClass: 'ghost',
      onEnd: ({ newIndex, oldIndex }) => {
        const tableData = options.value;
        const currRow = tableData.splice(oldIndex, 1)[0];
        tableData.splice(newIndex, 0, currRow);
        optionsKey.value++;
        nextTick(() => rowDrop());
      },
    });
  }

  function copyOptions() {
    const selection = optionTableRef.value?.getSelectionRows();
    copyTextToClipboard(JSON.stringify(selection.length ? selection : options.value, null, 2));
    ElMessage.success('已复制到剪贴板');
  }
  function deleteOptions() {
    const selection = optionTableRef.value?.getSelectionRows();
    if (selection && selection.length > 0) {
      options.value = options.value.filter((o) => !selection.includes(o));
    } else {
      ElMessage.warning('请先选择要删除的选项');
    }
  }

  useEventListener({
    el: document.body,
    name: 'paste',
    listener: async (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text');
      if (!text) return;
      try {
        const data = JSON.parse(text) as Option[];
        if (Array.isArray(data) && data.every((o) => o.text)) {
          const sameNameOptions = data.filter((o) =>
            options.value.find((existO) => existO.text === o.text)
          );
          if (sameNameOptions.length > 0) {
            await ElMessageBox.confirm(
              `检测到有 ${sameNameOptions.length} 个选项名称与现有选项重复，是否继续粘贴？`,
              '提示',
              {
                type: 'warning',
                showCancelButton: true,
                cancelButtonText: '取消',
                confirmButtonText: '继续粘贴',
              }
            )
            sameNameOptions.forEach((o) => {
              o.text += ' (复制)';
            });
          }
          options.value.push(...data);
          nextTick(() => rowDrop());
          ElMessage.success('选项粘贴成功');
        }
      } catch (err) {}
    },
    wait: 0,
  })
</script>

<template>
  <el-divider>
    {{ title }}({{ options?.length || 0 }})
  </el-divider>
  <p class="py-2">
    <ButtonEx type="primary" link icon="el-icon-document" @click="copyOptions">复制选项</ButtonEx>
    <ButtonEx type="danger" link icon="el-icon-remove" @click="deleteOptions">批量删除</ButtonEx>
  </p>
  <el-table ref="optionTableRef" :key="optionsKey" :data="options" border stripe class="mb-5">
    <el-table-column label="#" width="50" align="center">
      <template #default>
        <el-button type="primary" link class="move cursor-move" icon="el-icon-d-caret" />
      </template>
    </el-table-column>
    <el-table-column type="selection" width="50" align="center" />
    <el-table-column prop="text" label="选项" />
    <el-table-column prop="append" label="追加内容" show-overflow-tooltip />
    <el-table-column prop="next" label="下一个场景" />
    <el-table-column label="操作" width="100px" align="center">
      <template #header>
        <el-button type="primary" link size="small" @click="addOption">
          <Icon icon="i-ep:circle-plus" />
        </el-button>
      </template>
      <template #default="{ row, $index }">
        <el-button type="primary" link size="small" @click="editOption(row)">
          <Icon icon="i-ep:edit" />
        </el-button>
        <el-button type="danger" link size="small" @click="options.splice($index, 1)">
          <Icon icon="i-ep:remove" />
        </el-button>
      </template>
    </el-table-column>
  </el-table>
  <OptionForm ref="optionRef" :scenes="scenes" :story="story" :type="type" :options="excludeOptions" />
</template>
