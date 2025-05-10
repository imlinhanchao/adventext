<script setup lang="ts">
  import { deleteStory, getStoryList, Story } from '@/api/story';
  import { ElMessageBox } from 'element-plus';
  import Item from '@/views/story/item.vue';

  const storyList = ref<Story[]>([]);
  onMounted(() => {
    loadStory();
  });

  function loadStory() {
    getStoryList().then((data) => {
      storyList.value = data;
    });
  }

  const itemRef = ref<InstanceType<typeof Item>>();
  function add() {
    itemRef.value?.open();
  }
  function edit(row: Story) {
    itemRef.value?.open(row);
  }
  function remove(row: Story) {
    ElMessageBox.confirm('确定删除吗?', '提示', {
      type: 'warning',
      showCancelButton: true,
      cancelButtonText: '取消',
      confirmButtonText: '确定',
    }).then(() => {
      deleteStory(row.id!).then(() => {
        ElMessage.success('删除成功');
        storyList.value = storyList.value.filter((item) => item.id !== row.id);
      });
    });
  }
</script>

<template>
  <el-container>
    <el-header>
      <el-button type="primary" @click="add()">新建</el-button>
    </el-header>
    <el-main>
      <el-table :data="storyList" style="width: 100%">
        <el-table-column prop="name" label="名称" width="280" align="center">
          <template #default="{ row }">
            <route-link :to="`/story/${row.id}/scene`">
              {{ row.name }}
            </route-link>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column label="操作" align="center" width="280">
          <template #default="{ row }">
            <el-button-group>
              <el-button type="primary" size="small" @click="$router.push(`/story/${row.id}/item`)">
                物品
              </el-button>
              <el-button type="primary" size="small" @click="$router.push(`/story/${row.id}/scene`)">
                场景
              </el-button>
              <el-button type="primary" size="small" @click="edit(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="remove(row)">删除</el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
      <Item ref="itemRef" @confirm="loadStory" />
    </el-main>
  </el-container>
</template>
