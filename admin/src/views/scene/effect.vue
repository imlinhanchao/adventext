<script setup lang="ts">
  import { Effect, EffectType, Scene } from '@/api/scene';
  import { clone } from '@/utils';
  import { FormInstance } from 'element-plus';
  import { ItemsContext, StoryContext, TargetsContext } from './index';
  import ItemSelector from '@/views/item/selector.vue';
  import { Item } from '@/api/item';
  import Conditions from './conditions.vue';

  const props = defineProps<{
    scenes: Scene[];
    type: string;
  }>();

  const visible = ref(false);
  const codeVisible = ref(false);
  const data = ref<Effect>(new Effect());
  const formData = computed(() => ({ ...data.value }));

  let saveResolve: (condition: Effect) => void;
  function open(effect?: Effect) {
    visible.value = true;
    data.value = clone(effect || new Effect());

    return new Promise((resolve) => {
      saveResolve = resolve;
    });
  }

  defineExpose({
    open,
  });

  const formRef = ref<FormInstance>();
  const rules = computed(() => ({
    type: [{ required: true, message: '请选择效果类型', trigger: 'blur' }],
    name: [{ required: true, message: '请输入', trigger: 'blur' }],
    content: [{ required: true, message: '请输入', trigger: 'blur' }],
  }));

  async function save() {
    if (!(await formRef.value?.validate())) {
      return;
    }

    saveResolve(data.value);
    visible.value = false;
  }

  const targets = inject(TargetsContext);
  const items = inject(ItemsContext);
  const story = inject(StoryContext);
  const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>();

  const itemAttrs = computed(
    () =>
      items?.value
        .map((item) =>
          Object.keys(item.attributes).map((a) => ({
            value: a,
            label: item.attrName[a],
          })),
        )
        .flat()
        .filter((item, index, self) => index === self.findIndex((t) => t.value === item.value)) ||
      [],
  );
  const defaultAttrs = computed(() =>
    Array.from(
      new Set(
        Object.keys(story?.value?.attr || {}).map((a) => ({
          value: a,
          label: story?.value?.attrName[a],
        })),
      ),
    ),
  );
  function searchTarget(query: string, cb) {
    const list =
      targets?.value.filter(
        (item) => item.key.includes(query) || item.name.includes(query) || !query,
      ) || [];
    cb(list.map((item) => ({ value: item.key, label: item.name })));
  }

  function searchItem(query: string, cb) {
    const list =
      items?.value.filter(
        (item) => item.key.includes(query) || item.name.includes(query) || !query,
      ) || [];
    cb(
      [{ value: '$item', label: '选择的物品' }].concat(
        list.map((item) => ({ value: item.key, label: item.name })),
      ),
    );
  }
  function searchAttr(type: string) {
    return (query: string, cb) => {
      const items = (type == 'Attr' ? defaultAttrs : itemAttrs).value.filter(
        (item) => item.value.includes(query) || item.label?.includes(query) || !query,
      );
      cb(items);
    };
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

</script>

<template>
  <el-dialog title="效果" v-model="visible" width="600px">
    <el-form ref="formRef" :model="formData" label-width="auto" :rules="rules">
      <el-alert v-if="data.type" :closable="false" class="!mb-2">
        <span v-if="data.type == 'Attr'">
          对玩家的指定属性进行修改，可以通过输入
          <code>\n</code> 来表示换行字符串。若前面操作符选择了
          <code>-</code>、<code>/</code>、<code>*</code>，则需要保证值的运算结果为数字。
        </span>
        <span v-else-if="data.type == 'ItemAttr'">
          值只能是正数，会从背包<b>扣除</b>指定属性名的值之和等于设定值的物品，若<b>弹窗提示</b>设置了选择物品，则会将扣除范围限定在选择的物品上。
        </span>
        <span v-else-if="data.type == 'Target'">
          会给玩家发放指定成就，成就不可重复发放。已发放成就再次触发不会产生发放提醒。
        </span>
        <span v-else-if="data.type == 'Tip'">
          仅给玩家发送提示信息。
        </span>
        <span v-else-if="data.type == 'Item'">
          会从背包修改指定物品的数量，设置正值则新增，负值则扣除，若<b>弹窗提示</b>设置了选择物品，可以通过
          <code>$item</code> 指代选择的物品。
        </span>
        <span v-else-if="data.type == 'Scene'">
          配置触发效果后跳转的下一个场景，可以覆盖选项配置的下一个场景。
        </span>
        <div v-else-if="data.type == 'Fn'">
          <p>
            直接执行函数，函数参数为 <code>profile</code>：当前玩家的 Profile
            对象，<code>addItem</code>：添加物品的函数，<code>setAttr</code>：设置属性的函数。
          </p>
          <ul class="list-inside list-disc">
            <li>
              <code>profile</code>： 对象的属性包括 <code>attr</code>（属性对象
              Map）、<code>inventory</code>（背包物品数组）、<code>scene</code>（当前场景对象）。
            </li>
            <li>
              <code>addItem</code> 函数的参数为物品名称和数量，<code>setAttr</code>
              函数的参数为属性对象，属性对象的 key 为属性名，name 为属性名称，value 为属性值。
            </li>
            <li>
              <code>inventory</code
              >：当前玩家的背包物品列表，包含属性<code>key</code>（物品标识符）、<code>name</code>（物品名称）、<code>count</code>（物品数量）、<code>attr</code>（物品属性对象
              Map）。
            </li>
            <li>
              <code>scene</code
              >：当前场景对象，包含属性<code>name</code>（场景名称）、<code>content</code>（场景内容）、<code>options</code>（场景选项数组）。
            </li>
            <li>
              返回值：<code>next</code> 为下一个场景的名称，<code>message</code> 为提示信息，<code>next</code>
              和 <code>message</code> 都是可选的。
            </li>
          </ul>
        </div>
      </el-alert>
      <el-form-item label="效果类型" prop="type">
        <el-select v-model="data.type">
          <el-option
            v-for="item in Object.entries(EffectType)"
            :key="item[0]"
            :label="item[1]"
            :value="item[0]"
          />
        </el-select>
      </el-form-item>
      <template v-if="data.type === 'Attr'">
        <el-form-item label="属性名" prop="name">
          <el-autocomplete
            :fetch-suggestions="searchAttr(data.type)"
            v-model.trim="data.name"
            clearable
          >
            <template #default="{ item }">
              <div class="flex items-center">
                <span class="font-bold">{{ item.label || item.value }}</span>
                <span class="text-xs text-gray-500 ml-2" v-if="item.label">{{ item.value }}</span>
              </div>
            </template>
          </el-autocomplete>
        </el-form-item>
        <el-form-item label="属性值" prop="content">
          <template #label>
            <span>
              <el-tooltip
                effect="dark"
                content="可以使用 $value 表示弹窗输入，rand(x,y) 表示 x~y 的随机数，percent(x,y) 表示 x% 的概率增加 y，y 省略则表示 1，，两个函数可嵌套使用，还可以通过 $物品属性名$ 获取玩家选择物品的属性的值，#玩家属性名# 获取玩家的属性的值。"
              >
                <Icon icon="i-ep:info-filled" :size="14" />
              </el-tooltip>
              属性值
            </span>
          </template>
          <el-input v-model="data.content" placeholder="可以输入 \n 表示换行">
            <template #prepend>
              <el-select v-model="data.operator" class="!w-60px">
                <el-option label="=" value="=" />
                <el-option label="+" value="+" />
                <el-option label="-" value="-" />
                <el-option label="*" value="*" />
                <el-option label="/" value="/" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
      </template>
      <template v-if="data.type === 'ItemAttr'">
        <el-form-item label="物品属性名" prop="name">
          <el-autocomplete
            :fetch-suggestions="searchAttr(data.type)"
            v-model.trim="data.name"
            clearable
          >
            <template #default="{ item }">
              <div class="flex items-center">
                <span class="font-bold">{{ item.label || item.value }}</span>
                <span class="text-xs text-gray-500 ml-2" v-if="item.label">{{ item.value }}</span>
              </div>
            </template>
          </el-autocomplete>
        </el-form-item>
        <el-form-item label="物品属性值" prop="content">
          <template #label>
            <span>
              <el-tooltip
                effect="dark"
                content="此处设置表示消耗对应属性名的属性值之和的物品，可以设置选项物品弹窗来精确控制对应物品。可以使用 $value 表示弹窗输入，rand(x,y) 表示 x~y 的随机数，percent(x,y) 表示 x% 的概率为 y，y 省略则表示 1，两个函数可嵌套使用，还可以通过 $物品属性名$ 获取玩家选择物品的属性的值，#玩家属性名# 获取玩家的属性的值。此字段最后运算非数字将会报错！"
              >
                <Icon icon="i-ep:info-filled" :size="14" />
              </el-tooltip>
              物品属性值
            </span>
          </template>
          <el-input v-model="data.content" />
        </el-form-item>
      </template>
      <template v-if="data.type === 'Target'">
        <el-form-item label="成就" prop="name">
          <el-autocomplete :fetch-suggestions="searchTarget" v-model="data.name" clearable>
            <template #default="{ item }">
              <div class="flex items-center">
                <span class="font-bold">{{ item.label }}</span>
                <span class="text-xs text-gray-500 ml-2">{{ item.value }}</span>
              </div>
            </template>
            <template #suffix>
              <el-button
                type="text"
                @click="itemSelectorRef?.open().then((item: Item) => (data.name = item.key))"
              >
                <Icon icon="i-ep:search" />
              </el-button>
            </template>
          </el-autocomplete>
        </el-form-item>
      </template>
      <template v-if="data.type === 'Scene'">
        <el-form-item label="场景" prop="name">
          <el-autocomplete v-model="data.name" :fetch-suggestions="searchScene" @select="data.name = $event.name">
            <template #default="{ item }">
              <div class="flex items-center">
                <span class="font-bold">{{ item.name }}</span>
                <span class="text-xs text-gray-500 ml-2">{{ item.content }}</span>
              </div>
            </template>
          </el-autocomplete>
        </el-form-item>
      </template>
      <template v-if="data.type === 'Item'">
        <el-form-item label="物品" prop="name">
          <el-autocomplete
            :fetch-suggestions="searchItem"
            v-model="data.name"
            clearable
            placeholder="可使用 $item 表示选择的物品。"
          >
            <template #default="{ item }">
              <div class="flex items-center">
                <span class="font-bold">{{ item.label }}</span>
                <span class="text-xs text-gray-500 ml-2">{{ item.value }}</span>
              </div>
            </template>
            <template #suffix>
              <el-button
                type="text"
                @click="itemSelectorRef?.open().then((item: Item) => (data.name = item.key))"
              >
                <Icon icon="i-ep:search" />
              </el-button>
            </template>
          </el-autocomplete>
        </el-form-item>
        <el-form-item label="数量" prop="content">
          <template #label>
            <span>
              <el-tooltip
                effect="dark"
                content="可以输入数字，或 rand(x,y) 表示 x~y 的随机数，percent(x,y) 表示 x% 的概率获得 y 个，y 省略则表示 1 个，两个函数可嵌套使用，还可以通过 $物品属性名$ 获取玩家选择物品的属性的值，#玩家属性名# 获取玩家的属性的值。此字段最后运算非数字将会报错！"
              >
                <Icon icon="i-ep:info-filled" />
              </el-tooltip>
              数量
            </span>
          </template>
          <el-input v-model="data.content" clearable />
        </el-form-item>
      </template>
      <template v-if="data.type === 'Fn'">
        <el-form-item label="函数" prop="content">
          <section class="flex flex-col w-full">
            <span
              class="bg-gray-100 dark:bg-gray-900 flex flex-col px-2 rounded-tl rounded-tr border border-b-0 border-[var(--el-border-color)]"
            >
              <code>function check(</code>
              <code>　　profile: Profile, </code>
              <code>　　inputText: string, </code>
              <code>　　itemSelect: Inventory, </code>
              <code>　　addItem: (name: string, count: number) => void, </code>
              <code
              >　　setAttr: (attr: { key: string; name?: string; value: string }) => void</code
              >
              <code>): boolean {</code>
              <code>　　let message = "", next = null;</code>
            </span>
            <section class="relative group">
              <el-input
                v-model="data.content"
                type="textarea"
                :autosize="{ minRows: 3 }"
                placeholder="可对玩家的 Profile 直接修改，比如属性值与背包物品(通过 getItem 获取 Item 对象)等，也可以根据运算重新设置下一场景(next)，返回提示信息(message)等"
                class="border-l border-r border-[var(--el-border-color)] z-10"
                style="--el-input-border-radius: 0; --el-input-border-color: transparent"
              />
              <ButtonEx icon="i-lets-icons:full-alt" link class="group-hover:opacity-60 absolute right-1 bottom-1 z-100 opacity-0" @click="codeVisible = true" />
            </section>
            <span
              class="bg-gray-100 dark:bg-gray-900 flex flex-col px-2 rounded-bl rounded-br border border-t-0 border-[var(--el-border-color)]"
            >
              <code>　　return { message, next };</code>
              <code>}</code>
            </span>
          </section>
        </el-form-item>
      </template>
      <template v-if="data.type && 'Fn' != data.type">
        <el-form-item label="提示语" prop="tip">
          <template #label>
            <span>
              <el-tooltip placement="top">
                <template #content>
                  <div class="text-sm text-gray-500">
                    <p>效果生效提示，若不设置将使用游戏引擎默认提示，可以使用</p>
                    <ul class="list-inside list-disc">
                      <li><code>$物品属性名$</code>：获取玩家选择物品的属性的值</li>
                      <li><code>#玩家属性名#</code>：获取玩家的属性的值</li>
                      <li><code>$old</code>：属性修改前的值</li>
                      <li><code>$new</code>：属性修改后的值</li>
                      <li><code>$item</code>：选择的物品</li>
                      <li><code>$value</code>：输入的值</li>
                    </ul>
                  </div>
                </template>
                <Icon icon="i-ep:info-filled" class="ml-1" />
              </el-tooltip>
              提示语
            </span>
          </template>
          <el-input v-model="data.tip" clearable type="textarea" />
        </el-form-item>
        <p v-if="data.type !== 'Target' && data.type !== 'Tip' && data.type !== 'Scene'" class="mb-2">
          <el-button @click="data.content = 'rand(1,100)'">随机数</el-button>
          <el-button @click="data.content = 'percent(10,2)'">概率数</el-button>
          <el-button @click="data.content = '$value'">弹窗输入</el-button>
        </p>
        <Conditions :type="type" v-model:conditions="data.conditions" check-only />
      </template>
      <ItemSelector
        v-if="story"
        ref="itemSelectorRef"
        :story="story.id!"
        :type="type"
        @confirm="items = $event"
      />
    </el-form>
    <el-dialog v-if="'Fn' == data.type" v-model="codeVisible" fullscreen destroy-on-close>
      <section class="flex flex-col w-full h-full">
        <span
          class="bg-gray-100 dark:bg-gray-900 flex flex-col px-2 rounded-tl rounded-tr border border-b-0 border-[var(--el-border-color)]"
        >
          <code>function check(</code>
          <code>　　profile: Profile, </code>
          <code>　　inputText: string, </code>
          <code>　　itemSelect: Inventory, </code>
          <code>　　addItem: (name: string, count: number) => void, </code>
          <code
          >　　setAttr: (attr: { key: string; name?: string; value: string }) => void</code
          >
          <code>): boolean {</code>
          <code>　　let message = "", next = null;</code>
        </span>
        <section class="relative group h-full bg-gray-100 dark:bg-gray-900 border-l border-r border-[var(--el-border-color)] overflow-auto">
          <CodeEditor v-model:value="data.content" class="h-full" />
          <ButtonEx icon="i-gridicons:fullscreen-exit" link class="group-hover:opacity-60 absolute right-1 bottom-1 z-100 opacity-0" @click="codeVisible = false" />
        </section>
        <span
          class="bg-gray-100 dark:bg-gray-900 flex flex-col px-2 rounded-bl rounded-br border border-t-0 border-[var(--el-border-color)]"
        >
          <code>　　return { message, next };</code>
          <code>}</code>
        </span>
      </section>
    </el-dialog>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save">确定</el-button>
    </template>
  </el-dialog>
</template>
