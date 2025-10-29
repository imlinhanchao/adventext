<script lang="ts" setup>
  import { TargetApi, Target } from '@/api/target';
  import { clone } from '@/utils';
  import TargetForm from '@/views/targets/item.vue';
  import { ElMessageBox } from 'element-plus';

  const props = defineProps<{
    story: string;
    type: string;
    multiple?: boolean;
    readonly?: boolean;
  }>();

  const query = reactive({
    key: '',
    name: '',
  });

  const targetApi = computed(() => new TargetApi(props.story, props.type));
  const targets = ref<Target[]>([]);
  const visible = ref(false);
  function search() {
    targetApi.value.getList(query).then((data) => {
      targets.value = data;
    });
  }

  const selected = ref<Target[]>([]);
  let selectedResolve: (target: Target[] | Target) => void;
  function open(targets?: (Target | Target)[]) {
    visible.value = true;
    selected.value = clone(targets || []);
    search();
    return new Promise((resolve) => {
      selectedResolve = (data) => {
        resolve(data);
        visible.value = false;
      };
    });
  }

  function select(target: Target, checked?: boolean) {
    if (props.multiple) {
      if (checked) {
        selected.value.push(target);
      } else {
        selected.value = selected.value.filter((i) => i.id !== target.id);
      }
    } else {
      selected.value = [target];
      selectedResolve(target);
      visible.value = false;
    }
  }

  defineExpose({
    open,
  });

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
      targetApi.value.remove(row.id!).then(() => {
        ElMessageBox.alert('删除成功', '提示', {
          type: 'success',
        });
        targets.value = targets.value.filter((target) => target.id !== row.id);
      });
    });
  }
</script>

<template>
  <DialogEx
    title="成就"
    v-model="visible"
    width="1000px"
    append-to-body
    body-class="el-container !flex-col"
  >
    <el-header class="flex !py-2 justify-between" height="auto">
      <section class="flex space-x-2">
        <el-button type="primary" @click="add">添加</el-button>
      </section>
      <section class="flex space-x-2 justify-end targets-center">
        <el-input v-model="query.key" clearable>
          <template #prefix> 成就标识符： </template>
        </el-input>
        <el-input v-model="query.name" clearable>
          <template #prefix> 成就名称： </template>
        </el-input>
        <el-button type="primary" @click="search">搜索</el-button>
      </section>
    </el-header>
    <el-main>
      <el-table row-key="id" :data="targets" style="width: 100%" max-height="70vh">
        <el-table-column label="#" width="50" v-if="!readonly">
          <template #default="{ row }">
            <el-checkbox
              :model-value="selected.some((r) => r.key == row.key)"
              @change="select(row, $event as boolean)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="key" label="标识符" width="180" />
        <el-table-column prop="name" label="名称" width="180" />
        <el-table-column prop="description" label="描述" min-width="180" />
        <el-table-column label="操作" align="center" width="180" v-if="readonly">
          <template #default="{ row }">
            <el-button-group>
              <el-button type="primary" size="small" @click="edit(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="remove(row)">删除</el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-main>
    <el-footer>
      <el-tag
        v-for="(target, i) in selected"
        :key="i"
        class="mr-2"
        closable
        @close="selected.splice(i, 1)"
      >
        {{ target.name }}
      </el-tag>
    </el-footer>
    <TargetForm ref="targetRef" @confirm="search" :story-id="story" :type="type" />
    <template #footer v-if="!readonly">
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="selectedResolve(selected)">确定</el-button>
    </template>
  </DialogEx>
</template>
