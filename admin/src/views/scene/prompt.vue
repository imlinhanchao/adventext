<script setup lang="ts">
  import { ItemsContext } from './index';

  const props = defineProps<{
    modelValue?: string;
  }>();
  const emit = defineEmits(['update:modelValue']);

  watch(() => props.modelValue, loadDataFromValue);

  const data = ref({
    type: '',
    tip: '',
    category: [] as string[],
  })

  watch(data, (val) => {
    let value = val.type ? `${val.type}:${val.tip}` : val.tip;
    if (val.type && val.category) {
      value += `:${val.category.join(',')}`;
    }
    emit('update:modelValue', value);
  }, { deep: true });

  function loadDataFromValue(value?: string) {
    if (!value) {
      data.value = {
        type: '',
        tip: '',
        category: [],
      };
      return;
    }
    const [type, tip, category] = value.split(':');
    data.value.tip = tip ?? type;
    data.value.category = category ? category.split(',') : [];
    data.value.type = tip != undefined ? type : '';
  }

  onMounted(() => {
    loadDataFromValue(props.modelValue);
  });

  const items = inject(ItemsContext);

  const itemTypes = computed<string[]>(() =>
    Array.from(new Set(items?.value.map((item) => item.type) || [])),
  );

</script>

<template>
  <fieldset class="border border-gray-500 py-4 pr-4">
    <legend class="text-center">
      <el-tooltip placement="top">
        <template #content>
          <p> 用于在玩家选择选项时弹出一个输入框，其值用于类型为<b>弹窗输入</b>的条件判断。 </p>
          <p>
            若条件与影响有需要指定物品，则可使用物品选择（物品类型非必须）弹出选择背包的物品。填写了物品类型将会限制可选物品的类型。
          </p>
        </template>
        <Icon icon="i-ep:info-filled" :size="14" />
      </el-tooltip>
      弹窗提醒
    </legend>
    <el-form-item label="弹窗类型" prop="value">
      <el-select v-model="data.type" clearable placeholder="文本输入">
        <el-option label="文本输入" value="" />
        <el-option label="选择物品" value="item" />
        <el-option label="选择物品及数量" value="items" />
      </el-select>
    </el-form-item>
    <el-form-item label="提示语" prop="append">
      <el-input v-model="data.tip" type="textarea" />
    </el-form-item>
    <el-form-item label="物品类型" prop="content" v-if="['item', 'items'].includes(data.type)">
      <el-select filter multiple allow-create v-model="data.category" clearable>
        <el-option
          v-for="type in itemTypes"
          :key="type"
          :label="type"
          :value="type"
        />
      </el-select>
    </el-form-item>
  </fieldset>
</template>
