<script lang="ts" setup>
  import { Scene, SceneApi } from '@/api/scene';
  import { ElMessage, ElMessageBox, FormInstance } from 'element-plus';
  import { clone } from '@/utils';
  import Options from './options.vue';

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

  const codeVisible = ref(false);
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
        <Options v-model:options="data.options" :scenes="scenes" :story="props.story" :type="type" />
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
