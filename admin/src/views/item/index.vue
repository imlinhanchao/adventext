<script setup lang="ts">
  import { deleteItem, getItemList, Item } from '@/api/item';
  import ItemForm from '@/views/item/item.vue';
  import { ElMessageBox } from 'element-plus';

  const query = reactive({
    name: '',
    type: '',
  });
  const route = useRoute();
  const story = Number(route.params.story);
  const items = ref<Item[]>([]);
  function search() {
    getItemList(story, query).then((data) => {
      items.value = data;
    });
  }
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
      deleteItem(story, row.id!).then(() => {
        ElMessageBox.alert('删除成功', '提示', {
          type: 'success',
        });
        items.value = items.value.filter((item) => item.id !== row.id);
      });
    });
  }
  onMounted(() => {
    search();
  });
</script>

<template>
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
        <el-table-column prop="key" label="标识符" width="180" />
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="description" label="描述" min-width="180" />
        <el-table-column prop="type" label="类型" width="80" />
        <el-table-column label="操作" align="center" width="280">
          <template #default="{ row }">
            <el-button-group>
              <el-button type="primary" size="small" @click="edit(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="remove(row)">删除</el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-main>
    <ItemForm ref="itemRef" @confirm="search" :story-id="story" />
  </el-container>
</template>
