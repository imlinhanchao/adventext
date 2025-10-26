<script lang="ts" setup>
  import Sortable from 'sortablejs';
  import { createStory, Draft, updateStory } from '@/api/draft';
  import { IAttribute, Scene, SceneApi } from '@/api/scene';
  import { ElMessage, ElTable, FormInstance } from 'element-plus';
  import ItemSelector from '@/views/item/selector.vue';
  import { Item } from '@/api/item';
  import { clone, isArray } from '@/utils';
  import Options from '../scene/options.vue';
  import Effects from '../scene/effects.vue';
  import CustomStyle from '../scene/style.vue';
  
  const tableKey = ref<number>(0);
  const tableRef = ref<InstanceType<typeof ElTable>>();
  function rowDrop() {
    if (!tableRef.value) return;
    const tbody = tableRef.value.$el.querySelector('.el-table__body-wrapper tbody');
    Sortable.create(tbody, {
      handle: '.move',
      animation: 300,
      ghostClass: 'ghost',
      onEnd: ({ newIndex, oldIndex }) => {
        const tableData = (data.value.attr as IAttribute[]) || [];
        const currRow = tableData.splice(oldIndex, 1)[0];
        tableData.splice(newIndex, 0, currRow);
        tableKey.value++;
        nextTick(() => rowDrop());
      },
    });
  }

  const emit = defineEmits(['confirm']);
  const visible = ref(false);
  const data = ref<Draft>(new Draft());

  function open(story?: Draft) {
    data.value = clone(story || new Draft());
    visible.value = true;
    if (data.value.id) {
      loadScene();
    }
    if (!data.value.options) data.value.options = [];
    if (!data.value.effects) data.value.effects = [];
    if (!isArray(data.value.attr)) {
      data.value.attr = Object.entries(data.value.attr).map(([key, value]) => {
        return new IAttribute(key, data.value.attrName[key], '', value);
      });
    }
    nextTick(() => rowDrop());
  }

  defineExpose({
    open,
  });

  const rules = {
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
    key: [{ required: true, message: '请输入Key', trigger: 'blur' }],
    value: [{ required: true, message: '请输入值', trigger: 'blur' }],
  };

  const formData = computed(() => ({ ...data.value }));
  const formRef = ref<FormInstance>();
  const loading = ref(false);
  async function submit() {
    if (!(await formRef.value?.validate())) {
      return;
    }

    data.value.attrName = [];
    (data.value.attr as IAttribute[]).forEach((item) => {
      if (item.key && item.name) data.value.attrName.push({ key: item.key, name: item.name });
    });

    loading.value = true;
    await (data.value.id ? updateStory : createStory)(data.value).finally(() => {
      loading.value = false;
    });
    ElMessage.success('保存成功');
    visible.value = false;
    emit('confirm', data.value);
  }

  const itemRef = ref<InstanceType<typeof ItemSelector>>();
  function addInventory() {
    itemRef.value?.open(data.value.inventory).then((items: Item[]) => {
      data.value.inventory = items;
    });
  }

  function addAttribute() {
    (data.value.attr as IAttribute[]).push(new IAttribute());
    nextTick(() => rowDrop());
  }
  function removeAttribute(index: number) {
    (data.value.attr as IAttribute[]).splice(index, 1);
    nextTick(() => rowDrop());
  }
    
  const scenes = ref<Scene[]>([]);  
  function loadScene () {
    return new SceneApi(data.value.id || '', 'draft').getList().then((data) => {
      scenes.value = data;
    });
  }

</script>

<template>
  <el-dialog
    :title="data.id ? '更新故事' : '创建故事'"
    v-model="visible"
    width="700px"
    class="max-h-[80vh]"
    append-to-body
  >
    <el-form ref="formRef" label-width="auto" :model="formData" :rules="rules" class="colon">
      <el-form-item label="名称" prop="name">
        <el-input v-model.trim="data.name" />
      </el-form-item>
      <el-form-item label="别名" prop="alias">
        <el-input v-model.trim="data.alias" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="data.description" type="textarea" />
      </el-form-item>
      <CustomStyle v-if="data.id" v-model="data.customStyle" placeholder="全局样式将在全局生效" />
      <el-form-item label="人物基础属性" class="no-error" />
      <el-table ref="tableRef" :data="data.attr as IAttribute[]" class="no-error-padding w-full" max-height="50vh" :key="tableKey">
        <el-table-column label="#" width="50" align="center">
          <template #default>
            <el-button type="primary" link class="move cursor-move" icon="el-icon-d-caret" />
          </template>
        </el-table-column>
        <el-table-column prop="key" label="标识符" align="center">
          <template #default="{ row, $index: i }">
            <el-form-item :prop="`attr.${i}.key`" :rules="rules.key">
              <el-input v-model.trim="row.key" />
            </el-form-item>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" align="center">
          <template #default="{ row }">
            <el-input v-model.trim="row.name" placeholder="内置属性则留空" />
          </template>
        </el-table-column>
        <el-table-column prop="type" label="分类" align="center">
          <template #default="{ row }">
            <el-input v-model.trim="row.type" />
          </template>
        </el-table-column>
        <el-table-column prop="value" label="值" align="center">
          <template #default="{ row, $index: i }">
            <el-form-item :prop="`attr.${i}.value`" :rules="rules.value">
              <el-input v-model.trim="row.value" />
            </el-form-item>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #header>
            <el-button
              type="primary"
              link
              size="small"
              @click="addAttribute"
            >
              <Icon icon="i-ep:circle-plus" />
            </el-button>
          </template>
          <template #default="{ $index }">
            <el-button type="danger" link size="small" @click="removeAttribute($index)">
              <Icon icon="i-ep:remove" />
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-form-item label="人物初始背包" v-if="data.id">
        <el-button type="primary" link size="small" @click="addInventory">
          <Icon icon="i-ep:circle-plus-filled" />
        </el-button>
        <el-tag
          v-for="(item, i) in data.inventory"
          :key="i"
          class="mr-2"
          closable
          @close="data.inventory.splice(i, 1)"
        >
          {{ item.name }}×{{ item.count }}
        </el-tag>
      </el-form-item>
      <ItemSelector v-if="data.id" ref="itemRef" :story="data.id" multiple inventory type="draft" />
      <Options title="全局选项" v-if="data.id" v-model:options="data.options" :scenes="scenes" :story="data.id" type="draft" />
      <Effects v-if="data.id" v-model:effects="data.effects" type="draft" :story="data.id" :scenes="scenes" title="全局效果" tip="全局生效效果，每次进入场景时若满足条件则触发，可无限触发。通过配置不同的类型，可以修改玩家的属性、物品和下一个场景等。" />
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit" :loading="loading">保存</el-button>
    </template>
  </el-dialog>
</template>
