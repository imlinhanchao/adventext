<script setup lang="ts">
  import { Effect, EffectType } from '@/api/scene';
  import { clone } from '@/utils';
  import { FormInstance } from 'element-plus';
  import { StoryContext } from './index';
  import ItemSelector from '@/views/item/selector.vue';
  import { Item } from '@/api/item';

  const visible = ref(false);
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

  const story = inject(StoryContext);
  const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>();
</script>

<template>
  <el-dialog title="效果" v-model="visible" width="600px">
    <el-form ref="formRef" :model="formData" label-width="auto" :rules="rules">
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
          <el-input v-model="data.name" clearable />
        </el-form-item>
        <el-form-item label="属性值" prop="content">
          <template #label>
            <span>
              <el-tooltip effect="dark" content="可以输入 rand(x,y) 表示 x~y 的随机数">
                <Icon icon="i-ep:info-filled" :size="14" />
              </el-tooltip>
              属性值
            </span>
          </template>
          <el-input v-model="data.content" :min="0" />
        </el-form-item>
      </template>
      <template v-if="data.type === 'Item'">
        <el-form-item label="物品" prop="name">
          <el-input v-model="data.name" clearable>
            <template #suffix>
              <el-button
                type="text"
                @click="itemSelectorRef?.open().then((item: Item) => (data.name = item.key))"
              >
                <Icon icon="i-ep:search" />
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="数量" prop="content">
          <template #label>
            <span>
              <el-tooltip effect="dark" content="可以输入数字，或 rand(x,y) 表示 x~y 的随机数">
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
            <span class="bg-gray-100 flex flex-col">
              <code>function check(</code>
              <code>　　profile: Profile, </code>
              <code>　　addItem: (name: string, count: number) => void, </code>
              <code>　　setAttr: (attr: { key: string; name?: string; value: string }) => void</code>
              <code>): boolean {</code>
              <code>　　let message = "", next = null;</code>
            </span>
            <el-input
              v-model="data.content"
              clearable
              type="textarea"
              :autosize="{ minRows: 3 }"
              placeholder="可对用户的 Profile 直接修改，比如属性值与背包物品(通过 getItem 获取 Item 对象)等，也可以根据运算重新设置下一场景(next)，返回提示信息(message)等"
            />
            <span class="bg-gray-100 flex flex-col">
              <code>　　return { message, next };</code>
              <code>}</code>
            </span>
          </section>
        </el-form-item>
      </template>
      <ItemSelector v-if="story" ref="itemSelectorRef" :story="story.id!" />
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save">确定</el-button>
    </template>
  </el-dialog>
</template>
