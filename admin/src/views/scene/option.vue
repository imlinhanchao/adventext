<script setup lang="ts">
  import { Option, Scene } from '@/api/scene';
import { clone } from '@/utils';
  import { FormInstance } from 'element-plus';

  const props = defineProps<{
    scenes: Scene[];
  }>();

  const visible = ref(false);
  const data = ref<Option>(new Option('', ''));

  const formRef = ref<FormInstance>();
  const rules = computed(() => ({
    text: [{ required: true, message: '请输入选项', trigger: 'blur' }],
    next: [{ required: true, message: '请选择下个场景', trigger: 'blur' }],
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

    saveResolve(data.value);
    visible.value = false;
  }

  function searchScene(query: string, cb) {
    const scenes = props.scenes.filter(
      (item) => item.name.includes(query) || item.content.includes(query),
    );
    cb(scenes)
  }
</script>

<template>
  <el-dialog title="场景选项" v-model="visible" width="500px">
    <el-form ref="formRef" :model="data" label-width="auto" :rules="rules">
      <el-form-item label="选项" prop="text">
        <el-input v-model="data.text" clearable />
      </el-form-item>
      <el-form-item label="追加内容" prop="append">
        <el-input v-model="data.append" type="textarea" />
      </el-form-item>
      <el-form-item label="下个场景" prop="next">
        <el-autocomplete v-model="data.next" :fetch-suggestions="searchScene" @select="data.next = $event.name">
          <template #default="{ item }">
            <div class="flex items-center">
              <span class="font-bold">{{ item.name }}</span>
              <span class="text-xs text-gray-500 ml-2">{{ item.content }}</span>
            </div>
          </template>
        </el-autocomplete>
      </el-form-item>
      <el-form-item label="重复触发间隔（秒）" prop="loop">
        <template #label>
          <el-checkbox :model-value="(data.loop ?? -1) >= 0" @click="data.loop = (data.loop ?? -1) < 0 ? Math.abs(data.loop??1) : -Math.abs(data.loop||1)">
            重复触发间隔（秒）
          </el-checkbox>
        </template>
        <el-input type="number" v-if="(data.loop ?? -1) >= 0" v-model="data.loop" :min="0" />
        <span v-else>不可重复</span>
      </el-form-item>
      <el-form-item label="客户端输入提示" prop="value">
        <el-input v-model="data.value" clearable />
      </el-form-item>
      <el-form-item label="条件列表" prop="conditions">
        <el-button type="primary" @click="() => { /* 打开条件编辑对话框逻辑 */ }">编辑条件</el-button>
      </el-form-item>
      <el-form-item label="效果列表" prop="effects">
        <el-button type="primary" @click="() => { /* 打开效果编辑对话框逻辑 */ }">编辑效果</el-button>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>
