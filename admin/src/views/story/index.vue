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
    <el-main>
      <el-table :data="storyList" style="width: 100%">
        <el-table-column label="" align="center" width="80">
          <template #default="{ row }">
            <el-button link type="danger" icon="el-icon-remove" @click="remove(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" width="280" align="center">
          <template #default="{ row }">
            <router-link class="text-primary" :to="`/story/${row.id}/scene`">
              {{ row.name }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column label="状态" width="200" align="center">
          <template #default="{ row }">
            <el-tag type="success" v-if="row.status == 2">已发布</el-tag>
            <el-tag type="danger" v-else-if="row.status == 3">已下架</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <Item ref="itemRef" @confirm="loadStory" />
    </el-main>
  </el-container>
</template>
