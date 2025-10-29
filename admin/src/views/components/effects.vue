<script setup lang="ts">
  import Sortable from 'sortablejs';
  import { Scene, EffectType, Effect } from '@/api/scene';
  import { ElTable } from 'element-plus';
  import EffectForm from './effect.vue';
  import ItemForm from '@/views/item/item.vue';
  import { ItemApi, Item } from '@/api/item';

  const props = withDefaults(
    defineProps<{
      scenes: Scene[];
      effects?: Effect[];
      story: string;
      type: string;
      title?: string;
      tip?: string;
    }>(),
    {
      title: '效果列表',
      tip: '用于设置玩家选择选项后属性或背包的修改。通过配置不同的类型，可以修改玩家的属性、物品和下一个场景等。',
    },
  );
  const emit = defineEmits<{
    (e: 'update:effects', value?: Effect[]): void;
  }>();

  const effects = ref(props.effects);
  watch(
    () => props.effects,
    (val) => {
      effects.value = val || [];
    },
  );
  watch(effects, (val) => {
    emit('update:effects', val || []);
  });

  onMounted(() => {
    if (!effects.value) effects.value = [];
    nextTick(() => {
      rowDrop();
    });
  });

  const itemApi = computed(() => new ItemApi(props.story, props.type));

  const tableKey = ref<number>(0);
  const tableRef = ref<InstanceType<typeof ElTable>>();
  function rowDrop() {
    if (!tableRef.value) return;
    const tbody = tableRef.value.$el.querySelector('.el-table__body-wrapper tbody');
    Sortable.create(tbody, {
      handle: '.move',
      animation: 300,
      ghostClass: 'ghost',
      onEnd: ({ newIndex, oldIndex }) => {
        const tableData = effects.value || [];
        const currRow = tableData.splice(oldIndex, 1)[0];
        tableData.splice(newIndex, 0, currRow);
        tableKey.value++;
        nextTick(() => rowDrop());
      },
    });
  }

  const effectRef = ref<InstanceType<typeof EffectForm>>();
  function addEffect() {
    effectRef.value?.open(new Effect()).then((effect: Effect) => {
      if (!effects.value) effects.value = [];
      effects.value.push(effect);
      nextTick(() => rowDrop());
    });
  }
  function editEffect(effect: Effect) {
    effectRef.value?.open(effect).then((data: Effect) => {
      Object.assign(effect, data);
      emit('update:effects', effects.value);
    });
  }

  const itemRef = ref<InstanceType<typeof ItemForm>>();
  async function editItem(name: string) {
    const item = await itemApi.value.get(name, 'none').catch(() => new Item(name));
    itemRef.value?.open(item);
  }
</script>

<template>
  <el-divider>
    {{ title }}({{ effects?.length }})
    <el-tooltip placement="top" v-if="tip">
      <template #content>
        <p>
          {{ tip }}
        </p>
      </template>
      <Icon icon="i-ep:info-filled" :size="14" />
    </el-tooltip>
  </el-divider>
  <el-table ref="tableRef" :data="effects" border stripe :key="tableKey">
    <el-table-column label="#" width="50" align="center">
      <template #default>
        <el-button type="primary" link class="move cursor-move" icon="el-icon-d-caret" />
      </template>
    </el-table-column>
    <el-table-column prop="type" label="类型" :formatter="({ type }) => EffectType[type]" />
    <el-table-column prop="name" label="效果对象">
      <template #default="{ row }">
        <span>{{ row.name }}</span>
        <el-button
          v-if="row.type == 'Item'"
          link
          icon="el-icon-edit"
          size="small"
          @click="editItem(row.name)"
        />
      </template>
    </el-table-column>
    <el-table-column prop="content" label="内容" show-overflow-tooltip>
      <template #default="{ row }">
        <span v-if="row.type != 'Tip'">{{ row.operator || '' }}{{ row.content }}</span>
        <span v-else>{{ row.tip }}</span>
      </template>
    </el-table-column>
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
        <el-button
          type="danger"
          link
          size="small"
          @click="effects?.splice($index, 1), $nextTick(() => rowDrop())"
        >
          <Icon icon="i-ep:remove" />
        </el-button>
      </template>
    </el-table-column>
  </el-table>
  <EffectForm ref="effectRef" :type="type" :scenes="scenes" />
  <ItemForm ref="itemRef" :storyId="story" :type="type" />
</template>
