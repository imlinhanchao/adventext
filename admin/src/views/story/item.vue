<script lang="ts" setup>
  import { IAttribute, Scene, SceneApi } from '@/api/scene';
  import { createStory, Story, updateStory } from '@/api/story';
  import { ElMessage, FormInstance } from 'element-plus';
  import ItemSelector from '@/views/item/selector.vue';
  import { Item } from '@/api/item';
  import { clone, isArray } from '@/utils';
  import Options from '../scene/options.vue';
  import Effects from '../scene/effects.vue';
  import Attribute from '@/views/components/attributes.vue';

  const emit = defineEmits(['confirm']);
  const visible = ref(false);
  const data = ref<Story>(new Story());

  function open(story?: Story) {
    data.value = clone(story || new Story());
    visible.value = true;
    if (data.value.id) {
      loadScene();
    }
    if (!isArray(data.value.attr)) {
      data.value.attr = Object.entries(data.value.attr).map(([key, value]) => {
        return new IAttribute(key, data.value.attrName[key], '', value);
      });
    }
  }

  defineExpose({
    open,
  });

  const rules = {
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    author: [{ required: true, message: '请输入作者', trigger: 'blur' }],
    description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
    key: [{ required: true, message: '请输入Key', trigger: 'blur' }],
    value: [{ required: true, message: '请弹窗输入', trigger: 'blur' }],
  };

  const formData = computed(() => ({ ...data.value }));
  const formRef = ref<FormInstance>();
  const loading = ref(false);
  async function submit() {
    if (!(await formRef.value?.validate())) {
      return;
    }

    const formData: Story = {
      ...data.value,
      attr: (data.value.attr as IAttribute[]).map(attr => {
        attr = { ...attr };
        attr.value = Number(attr.value).toString() !== attr.value ? attr.value : Number(attr.value);
        return attr;
      }),
      attrName: []
    }

    formData.attrName = [];
    (data.value.attr as IAttribute[]).forEach((item) => {
      if (item.key && item.name) formData.attrName.push({ key: item.key, name: item.name });
    });

    loading.value = true;
    await (data.value.id ? updateStory : createStory)(formData).finally(() => {
      loading.value = false;
    });
    ElMessage.success('保存成功');
    visible.value = false;
    emit('confirm', data.value);
  }

  const itemRef = ref<InstanceType<typeof ItemSelector>>();
  function addInventory() {
    itemRef.value?.open(data.value.inventory).then((items: Item[]) => {
      data.value.inventory = items;
    });
  }

  const scenes = ref<Scene[]>([]);  
  function loadScene () {
    return new SceneApi(data.value.id || '', 'story').getList().then((data) => {
      scenes.value = data;
    });
  }

</script>

<template>
  <DialogEx
    :title="data.id ? '更新故事' : '创建故事'"
    v-model="visible"
    width="700px"
    class="max-h-[80vh]"
    append-to-body
  >
    <el-form ref="formRef" label-width="auto" :model="formData" :rules="rules" class="colon">
      <el-form-item label="名称" prop="name">
        <el-input v-model.trim="data.name" />
      </el-form-item>
      <el-form-item label="别名" prop="alias">
        <el-input v-model.trim="data.alias" />
      </el-form-item>
      <el-form-item label="作者" prop="author">
        <el-input v-model="data.author" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="data.description" type="textarea" />
      </el-form-item>
      <el-form-item label="是否可见" prop="visible">
        <el-switch v-model="data.visible" />
      </el-form-item>
      <el-form-item label="人物基础属性" class="no-error" />
      <Attribute v-model:attributes="(data.attr as IAttribute[])" />
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
      <ItemSelector v-if="data.id" ref="itemRef" :story="data.id" multiple inventory type="story" />
      <Options v-if="data.id" v-model:options="data.options" :scenes="scenes" :story="data.id" type="story" />
      <Effects v-if="data.id" v-model:effects="data.effects" type="draft" :story="data.id" :scenes="scenes" title="全局效果" tip="全局生效效果，每次进入场景时若满足条件则触发，可无限触发。通过配置不同的类型，可以修改玩家的属性、物品和下一个场景等。" />
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit" :loading="loading">保存</el-button>
    </template>
  </DialogEx>
</template>
