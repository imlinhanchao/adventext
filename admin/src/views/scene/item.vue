<script lang="ts" setup>
  import { ElMessage, ElMessageBox, FormInstance } from 'element-plus';
  import { Scene, SceneApi } from '@/api/scene';
  import { clone } from '@/utils';
  import { SceneContext } from './index';
  import Options from '@/views/components/options.vue';
  import CustomStyle from '@/views/components/style.vue';
  import Attribute from '@/views/components/attributes.vue';
  import Effects from '@/views/components/effects.vue';

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
  function open(scene?: Scene, position?: { x: number; y: number }) {
    visible.value = true;
    data.value = clone(scene || new Scene());
    oldName.value = data.value.name;
    if (!data.value.attributes) data.value.attributes = [];
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
    const formData: Scene = {
      ...data.value,
      attributes: data.value.attributes?.map((attr) => {
        attr = { ...attr };
        attr.value = Number(attr.value).toString() !== attr.value ? attr.value : Number(attr.value);
        return attr;
      }),
    };
    const scene = await sceneApi.value.save(formData).finally(() => {
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

  provide(SceneContext, data);
</script>

<template>
  <DialogEx
    :title="data.id ? '场景编辑' : '场景创建'"
    v-model="visible"
    width="600px"
    append-to-body
  >
    <el-form
      ref="formRef"
      :model="data"
      label-width="auto"
      :rules="rules"
      class="colon"
      @mousedown.stop
    >
      <el-form-item label="场景名称" prop="name">
        <el-input v-model="data.name" placeholder="请输入场景名称" />
      </el-form-item>
      <el-form-item label="场景内容" prop="content">
        <template #label>
          <span>
            <el-tooltip placement="top">
              <template #content>
                <p
                  >支持通过<code>${选项名}</code>引用选项追加内容。#属性标识#
                  可插入玩家对应属性值。</p
                >
              </template>
              <Icon icon="i-ep:info-filled" :size="14" />
            </el-tooltip>
            场景内容
          </span>
        </template>
        <el-input
          v-model="data.content"
          type="textarea"
          :placeholder="`请输入场景内容，支持通过 \${属性标识符} 引用属性值
<line /> 标记逐行显示开始，
<block /> 标记逐段，多段之间需均需标记 <block />，
<end /> 标记逐行/段显示结束
`"
        />
      </el-form-item>
      <el-form-item label="标签" prop="tags">
        <el-input-tag v-model="data.tags" />
      </el-form-item>
      <el-form-item label="是否结局" prop="isEnd">
        <el-switch v-model="data.isEnd" />
      </el-form-item>
      <el-form-item v-if="data.isEnd" label="结局名称" prop="isEnd">
        <el-input clearable v-model="data.theEnd" />
      </el-form-item>
      <template v-else>
        <Options
          v-model:options="data.options"
          :scenes="scenes"
          :story="props.story"
          :type="type"
        />
      </template>
      <el-divider>
        场景属性
        <el-tooltip placement="top">
          <template #content>
            <p>
              场景属性会在进入场景时重置，若在场景内跳转，则不会重置。属性名称仅做注释，不会显示在前端。
            </p>
          </template>
          <Icon icon="i-ep:info-filled" :size="14" />
        </el-tooltip>
      </el-divider>
      <Attribute v-model:attributes="data.attributes!" prop="attributes" />
      <CustomStyle v-model="data.customStyle" placeholder="自定义样式将会在场景进入时载入" />
      <Effects
        v-if="data.id"
        v-model:effects="data.enterEffects"
        :type="type"
        :story="props.story"
        :scenes="scenes"
        title="进入场景效果"
        tip="进入场景时若满足条件则触发，场景内跳转不会触发。通过配置不同的类型，可以修改玩家的属性、物品等（修改下一场景的效果不会生效）。"
      />
      <Effects
        v-if="data.id"
        v-model:effects="data.leaveEffects"
        :type="type"
        :story="props.story"
        :scenes="scenes"
        title="离开场景效果"
        tip="离开场景时若满足条件则触发，场景内跳转不会触发。通过配置不同的类型，可以修改玩家的属性、物品等（修改下一场景的效果不会生效）。"
      />
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save" :loading="loading">保存</el-button>
    </template>
  </DialogEx>
</template>
