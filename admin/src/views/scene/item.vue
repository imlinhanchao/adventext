<script lang="ts" setup>
  import Sortable from 'sortablejs';
  import { Option, Scene, SceneApi } from '@/api/scene';
  import { ElMessage, ElMessageBox, ElTable, FormInstance } from 'element-plus';
  import OptionForm from './option.vue';
  import { clone } from '@/utils';
  import { copyTextToClipboard } from '@/hooks/web/useCopyToClipboard';
import { useEventListener } from '@/hooks/event/useEventListener';

  const props = defineProps<{
    story: string;
    type: string;
    scenes: Scene[];
  }>();

  const emit = defineEmits(['updateName']);
  const visible = ref(false);
  const data = ref<Scene>(new Scene());
  const sceneApi = computed(() => new SceneApi(props.story, props.type));

  const oldName = ref('');
  let saveResolve: (scene: Scene) => void;
  function open(scene?: Scene, position?: { x: number, y: number }) {
    visible.value = true;
    data.value = clone(scene || new Scene());
    oldName.value = data.value.name;
    if (position) data.value.position = position;
    nextTick(() => rowDrop());

    return new Promise((resolve) => {
      saveResolve = resolve;
    });
  }

  defineExpose({
    open,
  });

  const formRef = ref<FormInstance>();
  const rules = computed(() => ({
    name: [{ required: true, message: '请输入场景名称', trigger: 'blur' }],
    content: [{ required: true, message: '请输入场景内容', trigger: 'blur' }],
  }));

  const loading = ref(false);
  async function save() {
    if (!(await formRef.value?.validate())) {
      return;
    }

    loading.value = true;
    const scene = await sceneApi.value.save(data.value).finally(() => {
      loading.value = false;
    });
    visible.value = false;
    ElMessage.success('保存成功');
    saveResolve(scene);

    if (data.value.id && data.value.name !== oldName.value) {
      if (
        await ElMessageBox.confirm('场景名称已修改，是否联动修改其他场景？', '提示', {
          type: 'warning',
        })
          .then(() => true)
          .catch(() => false)
      ) {
        emit('updateName', oldName.value, data.value.name);
      }
    }
  }

  const excludeOptions = ref<Option[]>([]);
  const optionRef = ref<InstanceType<typeof OptionForm>>();
  function addOption() {
    excludeOptions.value = data.value.options;
    optionRef.value?.open().then((option: Option) => {
      data.value.options.push(option);
      nextTick(() => rowDrop());
    });
  }

  function editOption(option: Option) {
    excludeOptions.value = data.value.options.filter((o) => o !== option);
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
        const tableData = data.value.options;
        const currRow = tableData.splice(oldIndex, 1)[0];
        tableData.splice(newIndex, 0, currRow);
        optionsKey.value++;
        nextTick(() => rowDrop());
      },
    });
  }

  const codeVisible = ref(false);
  function copyOptions() {
    const selection = optionTableRef.value?.getSelectionRows();
    copyTextToClipboard(JSON.stringify(selection.length ? selection : data.value.options, null, 2));
    ElMessage.success('已复制到剪贴板');
  }
  function deleteOptions() {
    const selection = optionTableRef.value?.getSelectionRows();
    if (selection && selection.length > 0) {
      data.value.options = data.value.options.filter((o) => !selection.includes(o));
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
        const options = JSON.parse(text) as Option[];
        if (Array.isArray(options) && options.every((o) => o.text)) {
          const sameNameOptions = options.filter((o) =>
            data.value.options.find((existO) => existO.text === o.text)
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
          data.value.options.push(...options);
          nextTick(() => rowDrop());
          ElMessage.success('选项粘贴成功');
        }
      } catch (err) {}
    },
    wait: 0,
  })
</script>

<template>
  <el-dialog :title="data.id ? '场景编辑' : '场景创建'" v-model="visible" width="600px" append-to-body>
    <el-form ref="formRef" :model="data" label-width="auto" :rules="rules" class="colon" @mousedown.stop>
      <el-form-item label="场景名称" prop="name">
        <el-input v-model="data.name" placeholder="请输入场景名称" />
      </el-form-item>
      <el-form-item label="场景内容" prop="content">
        <template #label>
          <span>
            <el-tooltip placement="top">
              <template #content>
                <p>支持通过<code>${选项名}</code>引用选项追加内容。#属性标识# 可插入玩家对应属性值。</p>
              </template>
              <Icon icon="i-ep:info-filled" :size="14" />
            </el-tooltip>
            场景内容
          </span>
        </template>
        <el-input
          v-model="data.content"
          type="textarea"
          placeholder="请输入场景内容，支持通过 ${属性标识符} 引用属性值"
        />
      </el-form-item>
      <el-form-item label="是否结局" prop="isEnd">
        <el-switch v-model="data.isEnd" />
      </el-form-item>
      <el-form-item v-if="data.isEnd" label="结局名称" prop="isEnd">
        <el-input clearable v-model="data.theEnd" />
      </el-form-item>
      <template v-else>
        <el-form-item label="场景选项" />
        <p class="py-2">
          <ButtonEx type="primary" link icon="el-icon-document" @click="copyOptions">复制选项</ButtonEx>
          <ButtonEx type="danger" link icon="el-icon-remove" @click="deleteOptions">批量删除</ButtonEx>
        </p>
        <el-table ref="optionTableRef" :key="optionsKey" :data="data.options" border stripe class="mb-5">
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
              <el-button type="danger" link size="small" @click="data.options.splice($index, 1)">
                <Icon icon="i-ep:remove" />
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <OptionForm ref="optionRef" :scenes="scenes" :story="story" :type="type" :options="excludeOptions" />
      </template>
      <el-form-item label="自定义样式" prop="customStyle">
        <section class="relative group w-full">
          <el-input
            v-model="data.customStyle"
            type="textarea"
            placeholder="自定义样式将会在场景进入时载入"
            :autosize="{
              minRows: 3,
              maxRows: 10,
            }"
          />
          <ButtonEx icon="i-lets-icons:full-alt" link class="group-hover:opacity-60 absolute right-1 bottom-1 z-100 opacity-0" @click="codeVisible = true" />
        </section>
      </el-form-item>
      <el-dialog title="自定义样式" v-model="codeVisible" fullscreen destroy-on-close>
        <section class="flex flex-col w-full h-full">
          <section class="relative group h-full bg-gray-100 dark:bg-gray-900 border-l border-r border-[var(--el-border-color)] overflow-auto">
            <CodeEditor v-model:value="data.customStyle" class="h-full" default="css" />
            <ButtonEx icon="i-gridicons:fullscreen-exit" link class="group-hover:opacity-60 absolute right-1 bottom-1 z-100 opacity-0" @click="codeVisible = false" />
          </section>
        </section>
      </el-dialog>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save" :loading="loading">保存</el-button>
    </template>
  </el-dialog>
</template>
