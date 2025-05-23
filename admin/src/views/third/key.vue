<script lang="ts" setup>
  import { clone } from '@/utils';

  const visible = ref(false);
  const data = ref<Recordable<string>>();

  const title = ref('');
  let resolve: (value: Recordable<string>) => void;
  function open(keymap: Recordable<string>, dlgTitle: string): Promise<Recordable<string>> {
    title.value = dlgTitle;
    data.value = clone(keymap);
    formData.value = Object.entries(keymap).map(([key, value]) => ({
      key,
      value,
    }));
    visible.value = true;
    return new Promise((res) => {
      resolve = res;
    });
  }

  defineExpose({
    open,
  });

  const formData = ref<{ key: string; value: string }[]>([]);
  const loading = ref(false);
  async function submit() {
    loading.value = true;
    data.value = formData.value.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {} as Recordable<string>);
    resolve(data.value!);
    loading.value = false;
    visible.value = false;
  }

  const isBatch = ref(false);
  const dataList = ref<string>('');
  watch(
    dataList,
    (val) => {
      if (val) {
        const arr = val.split('\n').map((item) => item.split(','));
        formData.value = arr.map(([key, value]) => ({
          key: key.trim(),
          value: value.trim(),
        }));
      }
    },
    { immediate: true }
  );

  watch(
    formData,
    (val) => {
      dataList.value = val
        .map(({ key, value }) => `${key.trim()},${value.trim()}`)
        .join('\n');
    },
    { immediate: true }
  );
</script>

<template>
  <el-dialog
    :title="title"
    v-model="visible"
    width="700px"
    class="max-h-[80vh]"
    append-to-body
  >
    <el-alert>使用 $callback 表示回调地址，$auth.xyz 获取认证地址回调参数，$verify.xyz 获取校验接口返回参数，$user.xyz 获取用户信息接口返回参数</el-alert>
    <el-switch v-model="isBatch" /> 批量设置
    <el-input type="textarea" v-model="dataList" :rows="3" placeholder="批量设置时，直接写 key,value" v-if="isBatch" />
    <el-table ref="tableRef" v-else :data="formData" style="width: 100%">
      <el-table-column label="key" align="center" min-width="120">
        <template #default="{ row }">
          <el-input v-model.trim="row.key" clearable />
        </template>
      </el-table-column>
      <el-table-column label="value" align="center" min-width="120">
        <template #default="{ row }">
          <el-input v-model.trim="row.value" clearable />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="80">
        <template #header>
          <el-button link type="primary" icon="el-icon-plus" @click="formData.push({ key: '', value: '' })" />
        </template>
        <template #default="{ $index }">
          <el-button link type="danger" icon="el-icon-remove" @click="formData.splice($index, 1)" />
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit" :loading="loading">保存</el-button>
    </template>
  </el-dialog>
</template>
