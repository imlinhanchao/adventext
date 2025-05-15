<script lang="ts" setup>
  import Sortable from 'sortablejs';
  import { Option, Scene, SceneApi } from '@/api/scene';
  import { ElMessage, ElMessageBox, ElTable, FormInstance } from 'element-plus';
  import OptionForm from './option.vue';
  import { clone } from '@/utils';

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
  function open(scene?: Scene) {
    visible.value = true;
    data.value = clone(scene || new Scene());
    oldName.value = data.value.name;
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

  const optionRef = ref<InstanceType<typeof OptionForm>>();
  function addOption() {
    optionRef.value?.open().then((option: Option) => {
      data.value.options.push(option);
      nextTick(() => rowDrop());
    });
  }

  function editOption(option: Option) {
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
        <el-table ref="optionTableRef" :key="optionsKey" :data="data.options" border stripe>
          <el-table-column label="#" width="50" align="center">
            <template #default>
              <el-button type="primary" link class="move cursor-move" icon="el-icon-d-caret" />
            </template>
          </el-table-column>
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
        <OptionForm ref="optionRef" :scenes="scenes" :story="story" :type="type" />
      </template>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save" :loading="loading">保存</el-button>
    </template>
  </el-dialog>
</template>
