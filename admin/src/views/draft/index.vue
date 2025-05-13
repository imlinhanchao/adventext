<script setup lang="ts">
  import { deleteStory, getStoryList, Draft, publishStory, exportStory } from '@/api/draft';
  import { ElMessageBox } from 'element-plus';
  import Item from '@/views/draft/item.vue';
  import Approve from './approve.vue';

  const storyList = ref<Draft[]>([]);
  onMounted(() => {
    loadStory();
  });

  const route = useRoute();
  function loadStory() {
    getStoryList(route.meta.query).then((data) => {
      storyList.value = data;
    });
  }

  const path = computed(() => {
    return route.path;
  });

  const itemRef = ref<InstanceType<typeof Item>>();
  function add() {
    itemRef.value?.open();
  }
  function remove(row: Draft) {
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
  async function exportJson(row: Draft) {
    const data = await exportStory(row.id!);
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${row.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    ElMessage.success('导出成功');
  }
  function publish(row: Draft) {
    ElMessageBox.confirm('确定推荐这个故事吗?审核通过将可以公开游玩。', '提示', {
      type: 'warning',
      showCancelButton: true,
      cancelButtonText: '取消',
      confirmButtonText: '确定',
    }).then(() => {
      publishStory(row.id!).then(() => {
        ElMessage.success('推荐成功');
        loadStory();
      });
    });
  }

  const approveRef = ref<InstanceType<typeof Approve>>();
  function approve(row: Draft) {
    approveRef.value?.open(row);
  }
  
  const isAdmin = route.meta.isAdmin || false;
  const isApprove = !!route.meta.query;
</script>

<template>
  <el-container>
    <el-main>
      <el-table :data="storyList" style="width: 100%">
        <el-table-column label="" align="center" width="120">
          <template #header>
            <el-button type="primary" link @click="add" icon="el-icon-circle-plus" />
          </template>
          <template #default="{ row }">
            <el-button link type="primary" @click="approve(row)" v-if="row.status == 1 && isApprove">
              <Icon icon="i-pajamas:check-sm" />
            </el-button>
            <el-button link type="primary" @click="publish(row)" v-if="row.status == 0">
              <Icon icon="i-material-symbols:publish" />
            </el-button>
            <el-button link type="danger" icon="el-icon-remove" @click="remove(row)" />
            <el-button link type="primary" icon="el-icon-download" @click="exportJson(row)" title="导出" />
          </template>
        </el-table-column>
        <el-table-column prop="author" label="作者" v-if="isAdmin" width="200" align="center" />
        <el-table-column prop="name" label="名称" width="280" align="center">
          <template #default="{ row }">
            <router-link class="text-primary" :to="`${path}/${row.id}/scene`">
              {{ row.name }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column label="状态" width="200" align="center">
          <template #default="{ row }">
            <el-tag type="info" v-if="row.status == 0">草稿</el-tag>
            <el-tag type="warning" v-else-if="row.status == 1">审核中</el-tag>
            <el-tooltip :content="row.comment" v-else-if="row.status == 2" :disabled="!row.comment">
              <el-tag type="success">已发布</el-tag>
            </el-tooltip>
            <el-tooltip :content="row.comment" v-else-if="row.status == 3">
              <el-tag type="danger">已拒绝</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <Item ref="itemRef" @confirm="loadStory" />
      <Approve v-if="isApprove" ref="approveRef" @confirm="loadStory" />
    </el-main>
  </el-container>
</template>
