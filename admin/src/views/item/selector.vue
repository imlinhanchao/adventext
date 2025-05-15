<script lang="ts" setup>
  import { ItemApi, Item } from '@/api/item';
  import { Inventory } from '@/api/draft';
  import { clone } from '@/utils';
  import ItemForm from '@/views/item/item.vue';
  import { ElMessageBox } from 'element-plus';

  const props = defineProps<{
    story: string;
    type: string;
    multiple?: boolean;
    inventory?: boolean;
    readonly?: boolean;
  }>();
  const emit = defineEmits(['confirm']);

  const query = reactive({
    name: '',
    type: '',
  });

  const itemApi = computed(() => new ItemApi(props.story, props.type));
  const items = ref<Inventory[]>([]);
  const visible = ref(false);
  function search() {
    itemApi.value.getList(query).then((data) => {
      emit('confirm', data);
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
    selected.value = clone(items || []);
    search();
    return new Promise((resolve) => {
      selectedResolve = (data) => {
        resolve(data);
        visible.value = false;
      };
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
      visible.value = false;
    }
  }

  defineExpose({
    open,
  });

  const itemRef = ref<InstanceType<typeof ItemForm>>();
  function add() {
    itemRef.value?.open();
  }
  function edit(row: Item) {
    itemRef.value?.open(row);
  }
  function remove(row: Item) {
    ElMessageBox.confirm('确定删除吗?', '提示', {
      type: 'warning',
      showCancelButton: true,
      cancelButtonText: '取消',
      confirmButtonText: '确定',
    }).then(() => {
      itemApi.value.remove(row.id!).then(() => {
        ElMessageBox.alert('删除成功', '提示', {
          type: 'success',
        });
        items.value = items.value.filter((item) => item.id !== row.id);
      });
    });
  }
</script>

<template>
  <el-dialog title="物品" v-model="visible" width="1000px" append-to-body>
    <el-container>
      <el-header class="flex !py-2 justify-between" height="auto">
        <section class="flex space-x-2">
          <el-button type="primary" @click="add">添加</el-button>
        </section>
        <section class="flex space-x-2 justify-end items-center">
          <el-input v-model="query.type" clearable>
            <template #prefix> 物品类型： </template>
          </el-input>
          <el-input v-model="query.name" clearable>
            <template #prefix> 物品名称： </template>
          </el-input>
          <el-button type="primary" @click="search">搜索</el-button>
        </section>
      </el-header>
      <el-main>
        <el-table row-key="id" :data="items" style="width: 100%" max-height="70vh">
          <el-table-column label="#" width="50" v-if="!readonly">
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
          <el-table-column label="操作" align="center" width="180" v-if="readonly">
            <template #default="{ row }">
              <el-button-group>
                <el-button type="primary" size="small" @click="edit(row)">编辑</el-button>
                <el-button type="danger" size="small" @click="remove(row)">删除</el-button>
              </el-button-group>
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
      <ItemForm ref="itemRef" @confirm="search" :story-id="story" :type="type" />
    </el-container>
    <template #footer v-if="!readonly">
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="selectedResolve(selected)">确定</el-button>
    </template>
  </el-dialog>
</template>
