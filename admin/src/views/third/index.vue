<script lang="ts" setup>
  import { deleteThirdParty, getThirdPartyList, ThirdParty } from '@/api/third';
  import Item from './item.vue';
  import { ElMessageBox } from 'element-plus';

  const thirdList = ref<ThirdParty[]>([]);
  onMounted(() => {
    loadThirdParty();
  });

  function loadThirdParty() {
    getThirdPartyList().then((data) => {
      thirdList.value = data;
    });
  }

  const itemRef = ref<InstanceType<typeof Item>>();
  function edit(row: ThirdParty) {
    itemRef.value?.open(row);
  }

  function remove(row: ThirdParty) {
    ElMessageBox.confirm('确定删除吗?', '提示', {
      type: 'warning',
      showCancelButton: true,
      cancelButtonText: '取消',
      confirmButtonText: '确定',
    }).then(() => {
      deleteThirdParty(row.id!).then(() => {
        ElMessage.success('删除成功');
        thirdList.value = thirdList.value.filter((item) => item.id !== row.id);
      });
    });
  }
</script>

<template>
  <el-container>
    <el-main>
      <el-table :data="thirdList" style="width: 100%">
        <el-table-column label="" align="center" width="80">
          <template #header>
            <ButtonEx content="添加" link type="primary" icon="el-icon-plus" @click="itemRef?.open()" />
          </template>
          <template #default="{ row }">
            <ButtonEx content="编辑" link type="primary" icon="el-icon-edit" @click="edit(row)" />
            <ButtonEx content="删除" link type="danger" icon="el-icon-remove" @click="remove(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" align="center" min-width="120" />
        <el-table-column label="图标" align="center" min-width="100">
          <template #default="{ row }">
            <img v-if="row.icon" :src="row.icon" alt="" class="h-50px" />
            <span v-else>无</span>
          </template>
        </el-table-column>
      </el-table>
      <Item ref="itemRef" @confirm="loadThirdParty" />
    </el-main>
  </el-container>
</template>
