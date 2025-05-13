<script setup lang="ts">
  import { Option, Scene, ConditionType, EffectType, Condition, Effect } from '@/api/scene';
  import { clone } from '@/utils';
  import { FormInstance } from 'element-plus';
  import ConditionForm from './condition.vue';
  import EffectForm from './effect.vue';
  import ItemForm from '@/views/item/item.vue';
  import { ItemApi, Item } from '@/api/item';

  const props = defineProps<{
    scenes: Scene[];
    story: string;
    type: string;
  }>();

  const visible = ref(false);
  const data = ref<Option>(new Option('', ''));
  const itemApi = computed(() => new ItemApi(props.story, props.type));

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
    scenes.unshift({
      name: '<back>',
      content: '返回上一个场景',
    } as Scene);
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
    const item = await itemApi.value.get(name, 'none').catch(() => new Item(name));
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
        <el-autocomplete v-model="data.next" :fetch-suggestions="searchScene" @select="data.next = $event.name">
          <template #default="{ item }">
            <div class="flex items-center">
              <span class="font-bold">{{ item.name }}</span>
              <span class="text-xs text-gray-500 ml-2">{{ item.content }}</span>
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
        <el-input type="number" v-if="(data.loop ?? 0) >= 0" v-model="data.loop" :min="0" />
        <span v-else>不可重复</span>
      </el-form-item>
      <el-form-item label="客户端输入提示" prop="value">
        <template #label>
          <span>
            <el-tooltip placement="top">
              <template #content>
                <p>
                  用于在玩家选择选项时弹出一个输入框，其值用于类型为<b>输入值</b>的条件判断。
                </p>
                <p>
                  若条件与影响有需要指定物品，则可使用 item:提示内容:物品类型（物品类型非必须）弹出选择物品。
                </p>
              </template>
              <Icon icon="i-ep:info-filled" :size="14" />
            </el-tooltip>
            客户端输入提示
          </span>
        </template>
        <el-input v-model="data.value" clearable type="textarea" />
        <el-button @click="data.value = `item:${data.value?.split(':')[1] || data.value ||'提示：'}`" size="small">物品弹窗</el-button>
        <el-button @click="data.value = `item:${data.value?.split(':')[1] || data.value ||'提示：'}:类型`" size="small">物品弹窗(指定类型)</el-button>
      </el-form-item>
      <el-divider>
        条件列表
        <el-tooltip placement="top">
          <template #content>
            <p>
              用于对玩家选择选项的前置判断，确认玩家是否满足触发影响的条件。也可以通过勾选<b>用于隐藏选项</b>，在获取选项阶段用于过滤选项。
            </p>
          </template>
          <Icon icon="i-ep:info-filled" :size="14" />
        </el-tooltip>
      </el-divider>
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
      <ConditionForm ref="conditionRef" :type="type" />
      <el-divider>
        效果列表
        <el-tooltip placement="top">
          <template #content>
            <p>
              用于设置玩家选择选项后属性或背包的修改。通过配置不同的类型，可以修改玩家的属性、物品和下一个场景等。
            </p>
          </template>
          <Icon icon="i-ep:info-filled" :size="14" />
        </el-tooltip>
      </el-divider>
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
      <EffectForm ref="effectRef" :type="type" />
      <ItemForm ref="itemRef" :storyId="story" :type="type" />
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>
