<script setup lang="ts">
  import { TargetApi, Target } from '@/api/target';
  import TargetForm from '@/views/achievement/item.vue';
  import { ElMessageBox } from 'element-plus';

  const query = reactive({
    name: '',
    type: '',
  });
  const route = useRoute();
  const story = route.params.story as string;
  const type = route.meta.type as string;
  const targetApi = new TargetApi(story, type);
  const targets = ref<Target[]>([]);
  function search() {
    targetApi.getList(query).then((data) => {
      targets.value = data;
    });
  }
  const targetRef = ref<InstanceType<typeof TargetForm>>();
  function add() {
    targetRef.value?.open();
  }
  function edit(row: Target) {
    targetRef.value?.open(row);
  }
  function remove(row: Target) {
    ElMessageBox.confirm('确定删除吗?', '提示', {
      type: 'warning',
      showCancelButton: true,
      cancelButtonText: '取消',
      confirmButtonText: '确定',
    }).then(() => {
      targetApi.remove(row.id!).then(() => {
        ElMessage.success('删除成功');
        targets.value = targets.value.filter((target) => target.id !== row.id);
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
      </section>
      <section class="flex space-x-2 justify-end targets-center">
        <el-input v-model="query.type" clearable>
          <template #prefix> 成就类型： </template>
        </el-input>
        <el-input v-model="query.name" clearable>
          <template #prefix> 成就名称： </template>
        </el-input>
        <el-button type="primary" @click="search">搜索</el-button>
      </section>
    </el-header>
    <el-main>
      <el-table row-key="id" :data="targets" style="width: 100%" max-height="70vh">
        <el-table-column prop="key" label="标识符" width="180" />
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="description" label="描述" min-width="180" />
        <el-table-column label="操作" align="center" width="180">
          <template #default="{ row }">
            <el-button-group>
              <el-button type="primary" size="small" @click="edit(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="remove(row)">删除</el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-main>
    <TargetForm ref="targetRef" @confirm="search" :story-id="story" :type="type" />
  </el-container>
</template>
