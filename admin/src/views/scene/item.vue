<script lang="ts" setup>
  import { createScene, Option, Scene, sceneBatchSave, updateScene } from '@/api/scene';
  import { ElMessage, ElMessageBox, FormInstance } from 'element-plus';
  import OptionForm from './option.vue';
  import { clone } from '@/utils';

  const props = defineProps<{
    story: number;
    scenes: Scene[];
  }>();

  const visible = ref(false);
  const data = ref<Scene>(new Scene());

  const oldName = ref('');
  let saveResolve: (scene: Scene) => void;
  function open(scene?: Scene) {
    visible.value = true;
    data.value = clone(scene || new Scene());
    oldName.value = data.value.name;

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

  async function save() {
    if (!(await formRef.value?.validate())) {
      return;
    }

    const scene = await (data.value.id ? updateScene : createScene)(props.story, data.value);

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
        props.scenes.forEach((item) => {
          item.options.forEach((option) => {
            if (option.next === oldName.value) {
              option.next = data.value.name;
            }
          });
        });
        sceneBatchSave(props.story, props.scenes).then(() => {
          ElMessage.success('场景名称联动修改成功');
        });
      }
    }
  }

  const optionRef = ref<InstanceType<typeof OptionForm>>();
  function addOption() {
    optionRef.value?.open().then((option: Option) => {
      data.value.options.push(option);
    });
  }

  function editOption(option: Option) {
    optionRef.value?.open(option).then((data: Option) => {
      Object.assign(option, data);
    });
  }
</script>

<template>
  <el-dialog :title="data.id ? '场景编辑' : '场景创建'" v-model="visible" width="600px">
    <el-form ref="formRef" :model="data" label-width="auto" :rules="rules" class="colon">
      <el-form-item label="场景名称" prop="name">
        <el-input v-model="data.name" placeholder="请输入场景名称" />
      </el-form-item>
      <el-form-item label="场景内容" prop="content">
        <el-input v-model="data.content" type="textarea" placeholder="请输入场景内容" />
      </el-form-item>
      <el-form-item label="场景选项" />
      <el-table :data="data.options" border stripe>
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
      <OptionForm ref="optionRef" :scenes="scenes" :story="story" />
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>
