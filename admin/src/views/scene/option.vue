<script setup lang="ts">
  import { Option, Scene, ConditionType, EffectType, Condition, Effect } from '@/api/scene';
  import { clone } from '@/utils';
  import { FormInstance } from 'element-plus';
  import ConditionForm from './condition.vue';
  import EffectForm from './effect.vue';
  import ItemForm from '@/views/item/item.vue';
import { getItem, Item } from '@/api/item';

  const props = defineProps<{
    scenes: Scene[];
    story: number;
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

  const conditionRef = ref<InstanceType<typeof ConditionForm>>();
  function addCon() {
    conditionRef.value?.open().then((condition: Condition) => {
      if (!data.value.conditions) data.value.conditions = []
      data.value.conditions.push(condition);
    });
  }
  function editCon(condition: Condition) {
    conditionRef.value?.open(condition).then((data: Condition) => {
      Object.assign(condition, data);
    });
  }

  const effectRef = ref<InstanceType<typeof EffectForm>>();
  function addEffect() {
    effectRef.value?.open().then((effect: Effect) => {
      if (!data.value.effects) data.value.effects = []
      data.value.effects.push(effect);
    });
  }
  function editEffect(effect: Effect) {
    effectRef.value?.open(effect).then((data: Effect) => {
      Object.assign(effect, data);
    });
  }

  const itemRef = ref<InstanceType<typeof ItemForm>>();
  async function editItem(name: string) {
    const item = await getItem(props.story, name, 'none').catch(() => new Item(name));
    itemRef.value?.open(item);
  }

  function contentFormat({ content }: { content: any }) {
    if (typeof content === 'object') {
      return JSON.stringify(content);
    }
    return content;
  }
</script>

<template>
  <el-dialog title="场景选项" v-model="visible" width="600px">
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
        <el-input v-model="data.value" clearable placeholder="若要用户选择物品，可使用 item: 开头" />
      </el-form-item>
      <el-divider>条件列表</el-divider>
      <el-table :data="data.conditions" border stripe>
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
            <el-button type="danger" link size="small" @click="data.conditions?.splice($index, 1)">
              <Icon icon="i-ep:remove" />
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <ConditionForm ref="conditionRef" />
      <el-divider>效果列表</el-divider>
      <el-table :data="data.effects" border stripe>
        <el-table-column prop="type" label="类型" :formatter="({type}) => EffectType[type]" />
        <el-table-column prop="name" label="效果对象">
          <template #default="{ row }">
            <span>{{ row.name }}</span>
            <el-button v-if="row.type == 'Item'" link icon="el-icon-edit" size="small" @click="editItem(row.name)" />
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" show-overflow-tooltip />
        <el-table-column label="操作" width="100px" align="center">
          <template #header>
            <el-button type="primary" link size="small" @click="addEffect">
              <Icon icon="i-ep:circle-plus" />
            </el-button>
          </template>
          <template #default="{ row, $index }">
            <el-button type="primary" link size="small" @click="editEffect(row)">
              <Icon icon="i-ep:edit" />
            </el-button>
            <el-button type="danger" link size="small" @click="data.effects?.splice($index, 1)">
              <Icon icon="i-ep:remove" />
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <EffectForm ref="effectRef" />
      <ItemForm ref="itemRef" :storyId="story" />
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>
