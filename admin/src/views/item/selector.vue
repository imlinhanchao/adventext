<script lang="ts" setup>
  import { getItemList, Item } from '@/api/item';
  import { Inventory } from '@/api/story';
  import ItemForm from '@/views/item/item.vue';

  const props = defineProps<{
    story: number;
    multiple?: boolean;
    inventory?: boolean;
  }>();

  const query = reactive({
    name: '',
    type: '',
  });

  const items = ref<Inventory[]>([]);
  const visible = ref(false);
  function search() {
    getItemList(props.story, query).then((data) => {
      items.value = data.map((item) => {
        const selectedItem = selected.value.find((i) => i.id === item.id);
        return {
          ...item,
          count: selectedItem?.count || 1,
        };
      });
    });
  }

  const selected = ref<Inventory[]>([]);
  let selectedResolve: (item: (Item | Inventory)[] | (Item | Inventory)) => void;
  function open(items?: (Item | Inventory)[]) {
    visible.value = true;
    selected.value = items || [];
    search();
    return new Promise((resolve) => {
      selectedResolve = resolve;
    });
  }

  function select(item: Item, checked?: boolean) {
    if (props.multiple) {
      if (checked) {
        selected.value.push(item);
      } else {
        selected.value = selected.value.filter((i) => i.id !== item.id);
      }
    } else {
      selected.value = [item];
      selectedResolve(item);
    }
  }

  defineExpose({
    open,
  });

  const itemRef = ref<InstanceType<typeof ItemForm>>();
  function add() {
    itemRef.value?.open()
  }
</script>

<template>
  <el-dialog title="选择物品" v-model="visible" width="1000px">
    <el-container>
      <el-header class="flex !py-2 justify-between" height="auto">
        <section class="flex space-x-2">
          <el-button type="primary" @click="add">添加</el-button>
          <el-input v-model="query.type" clearable>
            <template #prefix> 物品类型： </template>
          </el-input>
          <el-input v-model="query.name" clearable>
            <template #prefix> 物品名称： </template>
          </el-input>
        </section>
        <section class="text-right">
          <el-button type="primary" @click="search">搜索</el-button>
        </section>
      </el-header>
      <el-main>
        <el-table row-key="id" :data="items" style="width: 100%" max-height="70vh">
          <el-table-column label="#" width="50">
            <template #default="{ row }">
              <el-checkbox
                :model-value="selected.some((r) => r.id == row.id)"
                @change="select(row, $event as boolean)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="key" label="标识符" width="180" />
          <el-table-column prop="name" label="名称" width="180" />
          <el-table-column prop="description" label="描述" min-width="180" />
          <el-table-column prop="type" label="类型" width="80" />
          <el-table-column v-if="inventory" prop="count" label="数量" width="180" align="center">
            <template #default="{ row }">
              <el-input-number v-model="row.count" type="number" :min="1" />
            </template>
          </el-table-column>
        </el-table>
      </el-main>
      <el-footer>
        <el-tag
          v-for="(item, i) in selected"
          :key="i"
          class="mr-2"
          closable
          @close="selected.splice(i, 1)"
        >
          {{ item.name }}
          <span v-if="item.count">×{{ item.count }}</span>
        </el-tag>
      </el-footer>
      <ItemForm ref="itemRef" @confirm="search" :story-id="story" />
    </el-container>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="selectedResolve(selected)">确定</el-button>
    </template>
  </el-dialog>
</template>
