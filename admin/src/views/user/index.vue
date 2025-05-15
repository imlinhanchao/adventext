<script lang="ts" setup>
  import { deleteUser, getUserList, User } from '@/api/user';
  import Item from './item.vue';
  import { ElMessageBox } from 'element-plus';
import { formatDate } from '@vueuse/core';

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

  function loginTime(row: User) {
    if (row.lastLogin) {
      return formatDate(new Date(Number(row.lastLogin)), 'YYYY-MM-DD HH:mm:ss');
    }
    return '未登录';
  }
</script>

<template>
  <el-container>
    <el-main>
      <el-table :data="userList" style="width: 100%">
        <el-table-column label="" align="center" width="80">
          <template #default="{ row }">
            <ButtonEx content="编辑" link type="primary" icon="el-icon-edit" @click="edit(row)" />
            <ButtonEx content="删除" link type="danger" icon="el-icon-remove" @click="remove(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" align="center" min-width="120" />
        <el-table-column prop="nickname" label="昵称" align="center" min-width="100" />
        <el-table-column
          prop="lastLogin"
          label="上次登录时间"
          width="180"
          align="center"
          :formatter="loginTime"
        />
        <el-table-column
          prop="isAdmin"
          label="是否管理员"
          width="120"
          align="center"
          :formatter="({ isAdmin }) => (isAdmin ? '是' : '否')"
        />
      </el-table>
      <Item ref="itemRef" @confirm="loadUser" />
    </el-main>
  </el-container>
</template>
