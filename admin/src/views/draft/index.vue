<script setup lang="ts">
  import { unGzip } from '@/utils/gzip';
  import {
    deleteStory,
    getStoryList,
    Draft,
    publishStory,
    exportStory,
    exportStorys,
    importStorys,
  } from '@/api/draft';
  import { ElMessageBox, ElTable } from 'element-plus';
  import Item from '@/views/draft/item.vue';
  import Approve from './approve.vue';
  import { copyTextToClipboard } from '@/hooks/web/useCopyToClipboard';
  import { useEventListener } from '@/hooks/event/useEventListener';

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

  const tableRef = ref<InstanceType<typeof ElTable>>();
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
  async function copy(row: Draft) {
    const data = await exportStory(row.id!);
    copyTextToClipboard(data);
    ElMessage.success('复制成功');
  }
  async function exportAll() {
    const selection = tableRef.value?.getSelectionRows();
    const data = await exportStorys(selection.map((item) => item.id!));
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storys.json`;
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

  // 获取粘贴文本
  useEventListener({
    el: window,
    name: 'paste',
    listener: async (event: ClipboardEvent) => {
      debugger;
      const clipboardData = event.clipboardData;
      if (clipboardData) {
        const text = clipboardData.getData('text/plain');
        const data = unGzip(text);
        if (!data || !data.name || !data.author) {
          ElMessage.error('无效的故事数据');
          return;
        }
        await ElMessageBox.confirm(
          `确定导入故事 "${data.name}" 吗?`,
          '提示',
          {
            type: 'warning',
            showCancelButton: true,
            cancelButtonText: '取消',
            confirmButtonText: '确定',
          }
        );
        await importStorys([text]);
        ElMessage.success('导入成功');
        loadStory();
      }
    },
    wait: 0,
  });

  const isAdmin = route.meta.isAdmin || false;
  const isApprove = !!route.meta.query;
  function gotoPlay(row: Draft) {
    window.open(`/d/${row.id}`, '_blank');
  }
</script>

<template>
  <el-container>
    <el-main>
      <el-table ref="tableRef" :data="storyList" style="width: 100%">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="" align="center" width="150">
          <template #header>
            <ButtonEx content="新增" type="primary" link @click="add" icon="el-icon-circle-plus" />
            <ButtonEx
              content="批量导出"
              link
              type="primary"
              icon="el-icon-download"
              @click="exportAll()"
            />
          </template>
          <template #default="{ row }">
            <ButtonEx
              link
              type="primary"
              content="审批"
              icon="i-pajamas:check-sm"
              @click="approve(row)"
              v-if="row.status == 1 && isApprove"
            />
            <ButtonEx content="游玩" link type="success" icon="i-codicon:game" @click="gotoPlay(row)" />
            <ButtonEx
              content="推荐"
              link
              type="primary"
              icon="i-mingcute:send-plane-fill"
              @click="publish(row)"
              v-if="row.status == 0"
            />
            <ButtonEx
              content="删除"
              link
              type="danger"
              icon="el-icon-remove"
              @click="remove(row)"
            />
            <ButtonEx
              content="复制"
              link
              type="primary"
              icon="el-icon-document"
              @click="copy(row)"
            />
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
