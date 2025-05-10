<script setup lang="ts">
  import { deleteStory, getStoryList, Draft } from '@/api/draft';
  import { ElMessageBox } from 'element-plus';
  import Item from '@/views/draft/item.vue';

  const storyList = ref<Draft[]>([]);
  onMounted(() => {
    loadStory();
  });

  const route = useRoute();
  function loadStory() {
    getStoryList(route.name == 'manageStory').then((data) => {
      storyList.value = data;
    });
  }

  const path = computed(() => {
    return route.name == 'manageStory' ? '/manage' : '/my';
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
</script>

<template>
  <el-container>
    <el-main>
      <el-table :data="storyList" style="width: 100%">
        <el-table-column label="" align="center" width="80">
          <template #header>
            <el-button type="primary" link @click="add" icon="el-icon-circle-plus">
              <Icon icon="i-ep:circle-plus" />
            </el-button>
          </template>
          <template #default="{ row }">
            <el-button link type="danger" icon="el-icon-remove" @click="remove(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" width="280" align="center">
          <template #default="{ row }">
            <router-link :to="`${path}/${row.id}/scene`">
              {{ row.name }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
      </el-table>
      <Item ref="itemRef" @confirm="loadStory" />
    </el-main>
  </el-container>
</template>
