<script setup lang="ts">
import { Condition, ConditionType } from '@/api/scene';
import { clone } from '@/utils';
import { FormInstance } from 'element-plus';
import { pick } from 'lodash-es';
import { ItemsContext, StoryContext } from './index';
import ItemSelector from '@/views/item/selector.vue';
import { Item } from '@/api/item';

defineProps<{
  type: string;
}>();

const visible = ref(false);
const data = ref<Condition>(new Condition());
const formData = computed(() => ({ ...data.value, attr: attr.value }));

let saveResolve: (condition: Condition) => void;
function open (condition?: Condition) {
  visible.value = true;
  data.value = clone(condition || new Condition());

  if (data.value.type == 'ItemAttr') {
    itemAttr.value = Object.entries(data.value.content).map(([key, value]: any) => {
      return {
        key,
        value: value.toString(),
      };
    });
  } else if (data.value.type == 'Attr') {
    profileAttr.value = Object.entries(data.value.content).map(([key, value]: any) => {
      return {
        key,
        value: value.toString(),
      };
    });
  } else {
    initTypeContent();
  }
  return new Promise((resolve) => {
    saveResolve = resolve;
  });
}

defineExpose({
  open,
});

const formRef = ref<FormInstance>();
const rules = computed(() => ({
  type: [{ required: true, message: '请选择条件类型', trigger: 'blur' }],
  name: [{ required: true, message: '请输入', trigger: 'blur' }],
  content: [{ required: true, message: '请输入', trigger: 'blur' }],
  key: [{ required: true, message: '请输入', trigger: 'blur' }],
}));

async function save () {
  if (!(await formRef.value?.validate())) {
    return;
  }

  if (data.value.type == 'Attr' || data.value.type == 'ItemAttr') {
    data.value.content = {};
    attr.value.forEach((item) => {
      if (item.key) {
        data.value.content[item.key] = isNaN(parseFloat(item.value))
          ? item.value
          : parseFloat(item.value);
      }
    });
  }

  saveResolve(data.value);
  visible.value = false;
}

function initTypeContent () {
  if (data.value.type === 'Item') {
    if (isNaN(data.value.content)) data.value.content = 0;
  }
  if (data.value.type === 'Fn' || data.value.type === 'ItemType' || data.value.type === 'Value') {
    if (typeof data.value.content != 'string') data.value.content = '';
  }
  if (data.value.type === 'Time') {
    if (typeof data.value.content != 'object') data.value.content = {};
    else {
      data.value.content = pick(data.value.content, ['year', 'month', 'day', 'hour', 'minute']);
    }
  }
  if (data.value.type === 'ItemAttr' || data.value.type === 'Attr') {
    if (typeof data.value.content != 'object') data.value.content = {};
  }
}

const profileAttr = ref<{ key: string; value: string }[]>([]);
const itemAttr = ref<{ key: string; value: string }[]>([]);
const attr = computed(() => {
  if (data.value.type === 'ItemAttr') {
    return itemAttr.value;
  } else if (data.value.type === 'Attr') {
    return profileAttr.value;
  }
  return [];
});

const story = inject(StoryContext);
const items = inject(ItemsContext);

const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>();
const itemTypes = computed<string[]>(() =>
  Array.from(new Set(items?.value.map((item) => item.type) || [])),
);
const itemAttrs = computed(() =>
  items?.value.map(
    (item) => Object.keys(item.attributes).map(
      a => ({ 
        value: a, label: item.attrName[a]
      })
    )
  ).flat().filter(
    (item, index, self) => index === self.findIndex((t) => t.value === item.value)
  ) || []
);
const defaultAttrs = computed(() =>
  Array.from(
    new Set(
      Object.keys(story?.value?.attr || {}).map(
        a => ({ 
          value: a, label: story?.value?.attrName[a]
        })
      )
    )
  )
);
function searchItemType (query: string, cb) {
  const items = itemTypes.value.filter((item) => item.includes(query) || !query);
  cb(items.map(item => ({ value: item })));
}
function searchAttr (type: string) {
  return (query: string, cb) => {
    const items = (type == 'Attr' ? defaultAttrs : itemAttrs).value.filter((item) => item.value.includes(query) || item.label?.includes(query) || !query);
    cb(items);
  }
}

</script>

<template>
  <el-dialog title="条件" v-model="visible" width="600px">
    <el-form ref="formRef" :model="formData" label-width="auto" :rules="rules">
      <el-alert v-if="data.type" :closable="false" class="!mb-2">
        <span v-if="data.type == 'Time'">当前时间是否为设定的时间，比如设定 12 时，则需要当前时间在 12:00 ~ 12:59 时才会判定成功。</span>
        <span v-else-if="data.type == 'Attr'">当前角色是否拥有设定的属性，比如设定 100 体力，则需要当前角色的体力大于等于 100
          才会判定成功。如果不设定值，则只要具备属性就判定为成功。</span>
        <div v-else-if="data.type == 'ItemAttr'">
          <p>
            当前角色是否拥有包含指定属性的物品，比如设定 100 能量，则需要当前角色的物品中有包含 100 能量的物品才会判定成功，如果有多个物品，则会求和。
          </p>
          <p>
            若在选项有设定<b>客户端输入提示</b>弹出选择物品，此处将会限制仅检查所选物品。如果不设定值，则只要有具备该属性的物品就判定为成功。
          </p>
        </div>
        <span v-else-if="data.type == 'Item'">当前角色是否拥有设定的物品，比如设定物品为树枝，数量为20，则需要当前角色的物品中有树枝，且数量大于等于 20 才会判定成功。</span>
        <span v-else-if="data.type == 'ItemType'">当前角色是否拥有设定的物品类型，比如设定物品类型为燃料，则需要当前角色中有类型为燃料的物品，且数量大于等于 1 才会判定成功。</span>
        <span v-else-if="data.type == 'Value'">选择此类型，必须在选项设定<b>客户端输入提示</b>，当玩家输入值等于设定值时才会判定成功。</span>
        <div v-else-if="data.type == 'Fn'">
          <p>选择此类型，将会执行设定的函数内容，通过给<code>result</code>赋值或直接 return 返回判定结果。函数参数为 <code>profile</code>：当前玩家的 Profile 对象，<code>value</code>：玩家选择选项时填写的值，<code>itemSelect</code>：玩家选择选项时选择的物品。</p>
          <p><code>profile</code>： 对象的属性包括 <code>attr</code>（属性对象 Map）、<code>inventory</code>（背包物品数组）、<code>scene</code>（当前场景对象）。</p>
          <p>
            <code>inventory</code>：当前玩家的背包物品列表，包含属性<code>key</code>（物品标识符）、<code>name</code>（物品名称）、<code>count</code>（物品数量）、<code>attr</code>（物品属性对象 Map）。
          </p>
          <p>
            <code>scene</code>：当前场景对象，包含属性<code>name</code>（场景名称）、<code>content</code>（场景内容）、<code>options</code>（场景选项数组）。
          </p>
        </div>
      </el-alert>
      <el-form-item label="条件类型" prop="type">
        <el-select v-model="data.type" @change="initTypeContent">
          <el-option v-for="item in Object.entries(ConditionType)" :key="item[0]" :label="item[1]" :value="item[0]" />
        </el-select>
      </el-form-item>
      <template v-if="data.type === 'Time'">
        <el-form-item label="时间" prop="content">
          <section class="flex space-x-1">
            <el-input type="number" :min="1" v-model="data.content.year">
              <template #suffix>年</template>
            </el-input>
            <el-input type="number" :min="1" :max="12" v-model="data.content.month">
              <template #suffix>月</template>
            </el-input>
            <el-input type="number" :min="1" :max="31" v-model="data.content.day">
              <template #suffix>日</template>
            </el-input>
            <el-input type="number" :min="0" :max="23" v-model="data.content.hour">
              <template #suffix>时</template>
            </el-input>
            <el-input type="number" :min="0" :max="59" v-model="data.content.minute">
              <template #suffix>分</template>
            </el-input>
          </section>
        </el-form-item>
      </template>
      <template v-if="data.type === 'Attr' || data.type === 'ItemAttr'">
        <el-table :data="attr" class="no-error-padding w-full">
          <el-table-column prop="key" label="标识符" align="center">
            <template #default="{ row, $index: i }">
              <el-form-item :prop="`attr.${i}.key`" :rules="rules.key">
                <el-autocomplete :fetch-suggestions="searchAttr(data.type)" v-model.trim="row.key">
                  <template #default="{ item }">
                    <div class="flex items-center">
                      <span class="font-bold">{{ item.label || item.value }}</span>
                      <span class="text-xs text-gray-500 ml-2" v-if="item.label">{{ item.value }}</span>
                    </div>
                  </template>
                </el-autocomplete>
              </el-form-item>
            </template>
          </el-table-column>
          <el-table-column prop="value" label="值" align="center">
            <template #header>
              <el-tooltip
                effect="dark"
                content="可以输入 rand(x,y) 表示 x~y 的随机数，percent(x,y) 表示 x x% 的概率为 y，y 省略则表示 1，，两个函数可嵌套使用">
                <Icon icon="i-ep:info-filled" :size="14" />
              </el-tooltip>
              值
            </template>
            <template #default="{ row, $index: i }">
              <el-form-item :prop="`attr.${i}.value`">
                <el-input v-model.trim="row.value" placeholder="留空则不检查值" />
              </el-form-item>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #header>
              <el-button type="primary" link size="small" @click="attr.push({ key: '', value: '' })">
                <Icon icon="i-ep:circle-plus" />
              </el-button>
            </template>
            <template #default="{ $index }">
              <el-button type="danger" link size="small" @click="attr.splice($index, 1)">
                <Icon icon="i-ep:remove" />
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <template v-if="data.type === 'Item'">
        <el-form-item label="物品" prop="name">
          <el-input v-model="data.name" clearable>
            <template #suffix>
              <el-button type="text" @click="itemSelectorRef?.open().then((item: Item) => (data.name = item.key))">
                <Icon icon="i-ep:search" />
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="数量" prop="content">
          <template #label>
            <span>
              <el-tooltip effect="dark">
                <template #content>
                  <p>
                    可以输入数字，或 rand(x,y) 表示 x~y 的随机数，percent(x,y) 表示 x% 的概率获得 y 个，y 省略则表示 1
                    个，两个函数可嵌套使用。若<b>客户端输入提示</b>玩家输入为数字，则将会使用该值再乘以数量。
                  </p>
                </template>
                <Icon icon="i-ep:info-filled" />
              </el-tooltip>
              数量
            </span>
          </template>
          <el-input-number v-model="data.content" :min="0" />
        </el-form-item>
      </template>
      <template v-if="data.type === 'ItemType'">
        <el-form-item label="物品类型" prop="content">
          <el-autocomplete :fetch-suggestions="searchItemType" v-model="data.content" clearable />
        </el-form-item>
      </template>
      <template v-if="data.type === 'Value'">
        <el-form-item label="值" prop="content">
          <el-input v-model="data.content" clearable />
        </el-form-item>
      </template>
      <template v-if="data.type === 'Fn'">
        <el-form-item label="函数" prop="content">
          <section class="flex flex-col w-full">
            <span class="bg-gray-100 dark:bg-gray-900 flex flex-col px-2 rounded-tl rounded-tr border border-b-0 border-[var(--el-border-color)]">
              <code>function check(profile: Profile, value: string, itemSelect: string): boolean {</code>
              <code>　　let result = true;</code>
            </span>
            <el-input
              v-model="data.content" clearable type="textarea" :autosize="{ minRows: 3 }" 
              class="border-l border-r border-[var(--el-border-color)]"
              style="--el-input-border-radius: 0;--el-input-border-color:transparent;"
            />
            <span class="bg-gray-100 dark:bg-gray-900 flex flex-col px-2 rounded-bl rounded-br border border-t-0 border-[var(--el-border-color)]">
              <code>　　return result;</code>
              <code>}</code>
            </span>
          </section>
        </el-form-item>
      </template>
      <el-form-item label="失败提示" prop="tip">
        <template #label>
          <span>
            <el-tooltip content="条件不成立时将弹出提示，若不设置将使用游戏引擎默认提示，可以通过 $物品属性名$ 获取玩家选择物品的属性的值，#玩家属性名# 获取玩家的属性的值。" placement="top">
              <Icon icon="i-ep:info-filled" class="ml-1" />
            </el-tooltip>
            失败提示
          </span>
        </template>
        <el-input v-model="data.tip" clearable type="textarea" />
      </el-form-item>
      <el-form-item label="用于隐藏选项" prop="isHide">
        <template #label>
          <span>
            <el-tooltip content="条件不成立时将隐藏选项" placement="top">
              <Icon icon="i-ep:info-filled" class="ml-1" />
            </el-tooltip>
            用于隐藏选项
          </span>
        </template>
        <el-switch v-model="data.isHide" />
      </el-form-item>
      <ItemSelector v-if="story" ref="itemSelectorRef" :story="story.id!" :type="type" />
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save">确定</el-button>
    </template>
  </el-dialog>
</template>
