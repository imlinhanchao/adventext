<script lang="ts" setup>
  import { deleteUser, getUserList, User } from '@/api/user';
  import Item from './item.vue';
import { ElMessageBox } from 'element-plus';

  const userList = ref<User[]>([]);
  onMounted(() => {
    loadUser();
  });

  function loadUser() {
    getUserList().then((data) => {
      userList.value = data;
    });
  }

  const itemRef = ref<InstanceType<typeof Item>>();
  function edit(row: User) {
    itemRef.value?.open(row);
  }

  function remove(row: User) {
    ElMessageBox.confirm('确定删除吗?', '提示', {
      type: 'warning',
      showCancelButton: true,
      cancelButtonText: '取消',
      confirmButtonText: '确定',
    }).then(() => {
      deleteUser(row.id!).then(() => {
        ElMessage.success('删除成功');
        userList.value = userList.value.filter((item) => item.id !== row.id);
      });
    });
  }
</script>

<template>
  <el-container>
    <el-main>
      <el-table :data="userList" style="width: 100%">
        <el-table-column prop="id" label="Id" align="center" />
        <el-table-column prop="username" label="用户名" align="center" />
        <el-table-column prop="isAdmin" label="是否管理员" />
        <el-table-column label="操作" align="center" width="280">
          <template #default="{ row }">
            <el-button-group>
              <el-button type="primary" size="small" @click="edit(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="remove(row)">删除</el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
      <Item ref="itemRef" @confirm="loadUser" />
    </el-main>
  </el-container>
</template>
