<script setup lang="ts">
  import { Option, Scene } from '@/api/scene';
  import { clone } from '@/utils';
  import { FormInstance } from 'element-plus';
  import ScenePrompt from './prompt.vue';
  import Conditions from './conditions.vue';
  import Effects from './effects.vue';
  import { SceneContext } from '.';

  const props = defineProps<{
    scenes: Scene[];
    story: string;
    type: string;
    options: Option[];
  }>();

  const visible = ref(false);
  const data = ref<Option>(new Option('', ''));
  const scene = inject(SceneContext, null);

  const formRef = ref<FormInstance>();
  const rules = computed(() => ({
    text: [{ required: true, message: '请输入选项', trigger: 'blur' }],
    next: [{ required: !scene || !!scene.value?.id, message: '请选择下个场景', trigger: 'blur' }],
  }));


  let saveResolve: (option: Option) => void;
  function open(option?: Option) {
    visible.value = true;
    data.value = clone(option || new Option('', ''));

    return new Promise((resolve) => {
      saveResolve = resolve;
    });
  }

  defineExpose({
    open,
  });

  async function save() {
    if (!(await formRef.value?.validate())) {
      return;
    }

    if (props.options.some((opt) => opt !== data.value && opt.text === data.value.text)) {
      ElMessage.error('选项内容重复！相同选项可以跳过给效果添加条件实现不同效果');
      return;
    }

    if (props.options.some((opt) => opt.text !== data.value.text && opt.id && opt.id === data.value.id)) {
      ElMessage.error('选项唯一标识重复！');
      return;
    }

    saveResolve(data.value);
    visible.value = false;
  }

  function searchScene(query: string, cb) {
    const scenes = props.scenes.filter(
      (item) => item.name.includes(query) || item.content.includes(query),
    );
    if (scene) scenes.unshift({
      name: scene?.value?.name,
      content: scene?.value?.content,
    } as Scene);
    scenes.unshift({
      name: '<back>',
      content: '返回上一个场景',
    } as Scene);
    cb(scenes)
  }

</script>

<template>
  <DialogEx title="场景选项" v-model="visible" width="600px" append-to-body>
    <el-form ref="formRef" :model="data" label-width="auto" :rules="rules">
      <el-form-item label="唯一标识" prop="id">
        <el-input v-model="data.id" clearable placeholder="给选项按钮添加 id 属性，可在 CSS 中使用 option_xxx 添加样式" />
      </el-form-item>
      <el-form-item label="选项内容" prop="text">
        <el-input v-model="data.text" clearable />
      </el-form-item>
      <el-form-item label="追加内容" prop="append">
        <template #label>
          <span>
            <el-tooltip placement="top">
              <template #content>
                <p>追加到场景内容的文本。在场景内容，可以通过<code>${选项}</code>来控制追加内容的位置。当选项存在时插入。</p>
              </template>
              <Icon icon="i-ep:info-filled" :size="14" />
            </el-tooltip>
            追加内容
          </span>
        </template>
        <el-input v-model="data.append" type="textarea" />
      </el-form-item>
      <el-form-item label="反向追加内容" prop="append">
        <template #label>
          <span>
            <el-tooltip placement="top">
              <template #content>
                <p>使用与追加内容一样，但只有当选项被过滤时才插入。</p>
              </template>
              <Icon icon="i-ep:info-filled" :size="14" />
            </el-tooltip>
            反向追加内容
          </span>
        </template>
        <el-input v-model="data.antiAppend" type="textarea" />
      </el-form-item>
      <el-form-item label="下个场景" prop="next">
        <el-autocomplete v-model="data.next" :fetch-suggestions="searchScene" @select="data.next = $event.name" clearable>
          <template #default="{ item }">
            <div class="flex items-center">
              <span class="font-bold">{{ item.name }}</span>
              <span class="text-xs text-gray-500 ml-2 truncate max-w-[200px]">{{ item.content }}</span>
            </div>
          </template>
        </el-autocomplete>
      </el-form-item>
      <el-form-item label="单次触发">
        <template #label>
          <span>
            <el-tooltip placement="top">
              <template #content>
                <p>开启后，选项将在首次成功触发后隐藏。</p>
              </template>
              <Icon icon="i-ep:info-filled" :size="14" />
            </el-tooltip>
            单次触发
          </span>
        </template>
        <el-switch v-model="data.loop" :active-value="-1" :inactive-value="0" />
      </el-form-item>
      <el-form-item label="重复触发间隔（秒）" prop="loop">
        <template #label>
          <span>
            <el-tooltip placement="top">
              <template #content>
                <p>开启后，选项将在上次触发后指定时间内隐藏。</p>
              </template>
              <Icon icon="i-ep:info-filled" :size="14" />
            </el-tooltip>
            重复触发间隔（秒）
          </span>
        </template>
        <el-input type="number" v-if="(data.loop ?? 0) >= 0" v-model="data.loop" :min="0" @mousewheel.prevent />
        <span v-else>不可重复</span>
      </el-form-item>
      <el-form-item label="快捷键" prop="shortcut">
        <HotKey :hotkey="data.shortcut || ''" clearable @change="data.shortcut = $event.text" />
      </el-form-item>
      <ScenePrompt v-model="data.value" />
      <Conditions v-model:conditions="data.conditions" :type="type" />
      <Effects v-model:effects="data.effects" :type="type" :story="story" :scenes="scenes" />
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </DialogEx>
</template>
