<script setup lang="ts">
  import { Condition, ConditionType } from '@/api/scene';
  import { clone } from '@/utils';
  import { FormInstance } from 'element-plus';
  import { pick } from 'lodash-es';
  import { ItemsContext, StoryContext } from './index';
  import ItemSelector from '@/views/item/selector.vue';
  import { Item } from '@/api/item';

  const visible = ref(false);
  const data = ref<Condition>(new Condition());
  const formData = computed(() => ({ ...data.value, attr: attr.value }));

  let saveResolve: (condition: Condition) => void;
  function open(condition?: Condition) {
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

  async function save() {
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

  function initTypeContent() {
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
  function searchItemType(query: string, cb) {
    const items = itemTypes.value.filter((item) => item.includes(query) || !query);
    cb(items.map(item => ({ value: item })));
  }
</script>

<template>
  <el-dialog title="条件" v-model="visible" width="600px">
    <el-form ref="formRef" :model="formData" label-width="auto" :rules="rules">
      <el-form-item label="条件类型" prop="type">
        <el-select v-model="data.type" @change="initTypeContent">
          <el-option
            v-for="item in Object.entries(ConditionType)"
            :key="item[0]"
            :label="item[1]"
            :value="item[0]"
          />
        </el-select>
      </el-form-item>
      <template v-if="data.type === 'Time'">
        <el-form-item label="时间" prop="content">
          <section class="flex">
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
                <el-input v-model.trim="row.key" />
              </el-form-item>
            </template>
          </el-table-column>
          <el-table-column prop="value" label="值" align="center">
            <template #default="{ row, $index: i }">
              <el-form-item :prop="`attr.${i}.value`">
                <el-input v-model.trim="row.value" placeholder="留空则不检查值" />
              </el-form-item>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #header>
              <el-button
                type="primary"
                link
                size="small"
                @click="attr.push({ key: '', value: '' })"
              >
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
            <span class="bg-gray-100 flex flex-col">
              <code>function check(profile: Profile): boolean {</code>
              <code>　　let result = true;</code>
            </span>
            <el-input v-model="data.content" clearable type="textarea" :autosize="{ minRows: 3 }" />
            <span class="bg-gray-100 flex flex-col">
              <code>　　return result;</code>
              <code>}</code>
            </span>
          </section>
        </el-form-item>
      </template>
      <el-form-item label="失败提示" prop="tip">
        <el-input v-model="data.tip" clearable type="textarea" />
      </el-form-item>
      <ItemSelector v-if="story" ref="itemSelectorRef" :story="story.id!" />
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save">确定</el-button>
    </template>
  </el-dialog>
</template>
