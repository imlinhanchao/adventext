<script setup lang="ts">
import { SceneApi, Scene } from '@/api/scene';
import SceneItem from './scene.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useEventListener } from '@/hooks/event/useEventListener';
import SceneForm from './item.vue';
import { ItemApi, Item } from '@/api/item';
import { ItemsContext, ScenesContext, StoryContext, TargetsContext } from './index';
import ItemSelector from '@/views/item/selector.vue';
import TargetSelector from '@/views/targets/selector.vue';
import Virtual from './virtual.vue';
import StoryForm from '@/views/story/item.vue';
import DraftForm from '@/views/draft/item.vue';
import { useBreakpoint } from '@/hooks/event/useBreakpoint';
import { Draft } from '@/api/draft';
import { Story } from '@/api/story';
import { Target, TargetApi } from '@/api/target';

const { screenSM: isMobile } = useBreakpoint();

const route = useRoute();
const storyId = route.params.story as string;
const type = route.meta.type as string;
const story = ref<Draft>(new Draft());
const items = ref<Item[]>([]);
const targets = ref<Target[]>([]);
const scenes = ref<Scene[]>([]);
const sceneApi = new SceneApi(storyId, type);
const itemApi = new ItemApi(storyId, type);
const targetApi = new TargetApi(storyId, type);

provide(ItemsContext, items);
provide(TargetsContext, targets);
provide(StoryContext, story);
provide(ScenesContext, scenes);

const loading = ref(false);
onMounted(() => {
  loading.value = true
  Promise.all([
    loadScene(),
    loadStory(),
    loadItem(),
    loadTarget(),
  ]).then(() => {
    loading.value = false;
  });
});
function loadScene () {
  return sceneApi.getList().then((data) => {
    scenes.value = data;
  });
}
function loadStory () {
  return sceneApi.getStory(storyId).then((data) => {
    story.value = data;
  });
}
function loadItem () {
  return itemApi.getList().then((data) => {
    items.value = data;
  });
}
function loadTarget () {
  return targetApi.getList().then((data) => {
    targets.value = data;
  });
}
function updateSceneName (oldName: string, name: string) {
  scenes.value.forEach((item) => {
    item.options.forEach((option) => {
      if (option.next === oldName) {
        option.next = name;
      }
    });
  });
  sceneApi.batchSave(scenes.value).then(() => {
    ElMessage.success('场景名称联动修改成功');
  });
  if (story.value.start == oldName) {
    story.value.start = name;
    sceneApi.updateStory(story.value);
  }
}

const pos = ref({
  x: 0,
  y: 120,
});

const saveLoading = ref(false);
async function save () {
  saveLoading.value = true;
  await sceneApi.batchSave(scenes.value).finally(() => {
    saveLoading.value = false;
  });
  ElMessage.success('保存成功');
}

const sceneFormRef = ref<InstanceType<typeof SceneForm>>();
function addScene (scene?: Scene) {
  const position = {
    x: sceneViewRef.value!.clientWidth / 2 - 200,
    y: sceneViewRef.value!.clientHeight / 2 - 100,
  };
  scenes.value.forEach((s) => {
    if (s.position.x >= position.x && s.position.x < position.x + 40 &&
      s.position.y >= position.y && s.position.y < position.y + 40) {
      position.x += 40;
      position.y += 40;
    }
  });
  return sceneFormRef.value?.open(scene, position).then((scene: Scene) => {
    scenes.value.push(scene);
    return scene;
  });
}
function editScene (scene: Scene) {
  sceneFormRef.value?.open(scene).then((data: Scene) => {
    Object.assign(scene, data);
  });
}
function removeScene (scene: Scene, cb) {
  ElMessageBox.confirm('确定删除该场景吗？', '提示', {
    type: 'warning',
  }).then(async () => {
    await sceneApi.delete(scene.id!).then(() => {
      ElMessage.success('删除成功');
    }).finally(cb);
    scenes.value = scenes.value.filter((item) => item !== scene);
  }).catch(cb);
}
function copyScene (scene: Scene) {
  const newScene = new Scene();
  Object.assign(newScene, JSON.parse(JSON.stringify(scene)));
  newScene.name = `${scene.name}_副本`;
  newScene.id = undefined;
  newScene.position.x += 40;
  newScene.position.y += 40;
  sceneFormRef.value?.open(newScene).then((data: Scene) => {
    scenes.value.push(data);
  });
}
function setStart (scene: Scene) {
  ElMessageBox.confirm('确定设置为起始场景吗？', '提示', {
    type: 'warning',
  }).then(() => {
    story.value.start = scene.name;
    sceneApi.updateStory(story.value).then(() => {
      ElMessage.success('设置成功');
    });
  });
}

const storyFormRef = ref<InstanceType<typeof StoryForm>>();
const draftFormRef = ref<InstanceType<typeof DraftForm>>();
function editStory () {
  if (type === 'draft') {
    draftFormRef.value?.open(story.value);
    return;
  }
  storyFormRef.value?.open(story.value as Story);
}

const scenePanelRef = ref<HTMLElement>();
const sceneViewRef = ref<HTMLElement>();
const sceneRef = ref<Recordable<any>>({});
const highlight = ref('');
function highlightScene (next: string) {
  const nextScene = scenes.value.find((item) => item.name === next);
  if (!nextScene) {
    addScene(new Scene(next))?.then((scene: Scene) => {
      highlightScene(scene.name);
    });
    return;
  }

  highlight.value = next;
  if (!scenePanelRef.value) return;
  if (!sceneViewRef.value) return;
  if (!sceneRef.value[next]) return;

  pos.value.x =
    sceneViewRef.value.clientWidth / 2 -
    nextScene.position.x -
    sceneRef.value[next].$el.clientWidth / 2;
  pos.value.y =
    sceneViewRef.value.clientHeight / 2 -
    nextScene.position.y -
    sceneRef.value[next].$el.clientHeight / 2;

  const timer = setInterval(() => {
    highlight.value = highlight.value ? '' : next;
  }, 500);
  setTimeout(() => {
    clearInterval(timer);
    highlight.value = '';
  }, 2400);
}

const isMove = ref(false);
const beginPos = ref({
  x: 0,
  y: 0,
});
function beginMove (e: MouseEvent | TouchEvent) {
  isMove.value = true;
  const client = {
    x: (e as MouseEvent).clientX || (e as TouchEvent).touches[0].clientX,
    y: (e as MouseEvent).clientY || (e as TouchEvent).touches[0].clientY,
  }
  beginPos.value.x = client.x - pos.value.x;
  beginPos.value.y = client.y - pos.value.y;
}
useEventListener({
  el: document.body,
  name: 'mousemove',
  listener: (e: MouseEvent) => {
    if (isMove.value) {
      pos.value.x = e.clientX - beginPos.value.x;
      pos.value.y = e.clientY - beginPos.value.y;
    }
  },
  wait: 0,
});
useEventListener({
  el: document.body,
  name: 'touchmove',
  listener: (e: TouchEvent) => {
    if (isMove.value) {
      pos.value.x = e.touches[0].clientX - beginPos.value.x;
      pos.value.y = e.touches[0].clientY - beginPos.value.y;
    }
  },
  wait: 0,
});

useEventListener({
  el: document.body,
  name: 'touchend',
  listener: () => {
    isMove.value = false;
  },
  wait: 0,
});

useEventListener({
  el: document.body,
  name: 'touchcancel',
  listener: () => {
    isMove.value = false;
  },
  wait: 0,
});

useEventListener({
  el: document.body,
  name: 'mouseup',
  listener: () => {
    isMove.value = false;
  },
  wait: 0,
});


const zoom = ref(1);
useEventListener({
  el: document.body,
  name: 'wheel',
  listener: (e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoom.value += 0.01;
      } else {
        zoom.value -= 0.01;
      }
      if (zoom.value < 0.1) zoom.value = 0.1;
      if (zoom.value > 3) zoom.value = 3;
    }
  },
  options: { passive: false },
  wait: 0,
});

const sceneMap = computed<Recordable<Scene>>(() =>
  scenes.value.reduce((acc, scene) => {
    acc[scene.name] = scene;
    return acc;
  }, {}),
);

const itemListRef = ref<InstanceType<typeof ItemSelector>>();
function viewItemList () {
  itemListRef.value?.open().then(async () => {
    items.value = await itemApi.getList();
  });
}

const targetListRef = ref<InstanceType<typeof TargetSelector>>();
function viewTargetList () {
  targetListRef.value?.open().then(async () => {
    targets.value = await targetApi.getList();
  });
}

const isVirtual = ref(false);
function virtualRun () {
  isVirtual.value = !isVirtual.value;
}
function gotoPlay () {
  const url = type === 'draft'
    ? `/d/${storyId}`
    : `/s/${storyId}`;
  window.open(url, '_blank');
}

</script>

<template>
  <section>
    <Teleport to="body">
      <el-container
        @mousedown="beginMove" @touchstart="beginMove" :direction="isMobile ? 'vertical' : 'horizontal'"
        class="story-panel absolute z-1 top-0 bottom-0 right-0 left-0 overflow-hidden"
        :class="{ 'cursor-move': isMove }"
        :style="`--panel-offset-x: ${pos.x}px; --panel-offset-y: ${pos.y}px;`" v-loading="loading">
        <el-container class="pt-60px">
          <el-header class="flex !p-3 justify-between z-2" height="auto">
            <el-form class="!space-x-2" :size="isMobile ? 'small' : 'default'">
              <el-button-group>
                <el-button type="primary" @click="editStory" plain>
                  <Icon icon="i-uil:setting" /><span class="btn-text">故事设置</span>
                </el-button>
                <ButtonEx
                  icon="i-lets-icons:flag-fill" content="跳转到起始场景" type="primary"
                  @click="highlightScene(story.start)" plain
                />
                <ButtonEx icon="i-mdi:movie-open-plus-outline" type="primary" @click="addScene()" plain>
                  <span class="btn-text">添加场景</span>
                </ButtonEx>
                <ButtonEx icon="i-ph:sword" type="warning" @click="viewItemList" plain>
                  <span class="btn-text">管理物品</span>
                </ButtonEx>
                <ButtonEx icon="i-mingcute:bling-line" type="danger" @click="viewTargetList" plain>
                  <span class="btn-text">成就维护</span>
                </ButtonEx>
                <ButtonEx icon="i-codicon:game" type="primary" @click="gotoPlay" plain>
                  <span class="btn-text">实机运行</span>
                </ButtonEx>
                <ButtonEx
                  :icon="!isVirtual ? 'i-solar:play-bold' : 'i-solar:stop-bold'" type="success"
                  @click="virtualRun" :plain="!isVirtual">
                  <span class="btn-text">{{ !isVirtual ? '模拟运行' : '结束运行' }}</span>
                </ButtonEx>
              </el-button-group></el-form>
            <el-form :size="isMobile ? 'small' : 'default'">
              <ButtonEx icon="i-lucide:save" type="primary" @click="save" :loading="saveLoading">
                <span class="btn-text">保存布局</span>
              </ButtonEx>
            </el-form>
          </el-header>
          <el-main class="!h-full">
            <section class="overflow-hidden w-full h-full relative" ref="sceneViewRef">
              <section
                id="scenePanel" ref="scenePanelRef" class="absolute"
                :class="{ 'transition-all duration-200': !isMove }"
                :style="{ top: pos.y + 'px', left: pos.x + 'px', transform: `scale(${zoom}, ${zoom})` }">
                <SceneItem
                  v-for="(scene, index) in scenes" :ref="(el) => (sceneRef[scene.name] = el)" :key="index"
                  :story="storyId" :scene="scene" :sceneMap="sceneMap" @next="highlightScene" @edit="editScene"
                  @remove="removeScene" @start="setStart" @copy="copyScene" @mousedown.stop class="transition-all duration-200" :class="{
                    'border-2 border-blue-500': highlight === scene.name,
                  }" :start="story.start === scene.name" :zoom="zoom" />
              </section>
              <section class="px-5 py-2 rounded-[4em] bg-[var(--el-bg-color-overlay)] border border-gray-700 dark:shadow-gray-800 shadow-lg absolute bottom-5 left-5">场景 x {{ scenes.length }}</section>
            </section>
          </el-main>
          <span @mousedown.stop>
            <ItemSelector ref="itemListRef" :story="storyId" :type="type" readonly @close="loadItem" />
            <TargetSelector ref="targetListRef" :story="storyId" :type="type" readonly @close="loadTarget" />
            <SceneForm
              ref="sceneFormRef" :story="storyId" :type="type" :scenes="scenes"
              @update-name="updateSceneName" />
            <StoryForm ref="storyFormRef" v-if="type == 'story'" @confirm="loadStory" />
            <DraftForm ref="draftFormRef" v-if="type == 'draft'" @confirm="loadStory" />
          </span>
        </el-container>
        <el-aside
          v-if="isVirtual" :width="isMobile ? '100%' : '500px'"
          class="dark:border-gray-600 virtual-panel bg-[var(--el-bg-color)] z-5 relative"
          :class="{ 'border-l pt-15': !isMobile, 'isMobile pt-3': isMobile }" @mousedown.stop>
          <Virtual @next="highlightScene" :type="type" />
        </el-aside>
      </el-container>
    </Teleport>
  </section>
</template>
<style lang="less" scoped>
.story-panel {
  background-color: var(--background-color);
  /* 背景底色 */
  background-image:
    linear-gradient(to right, var(--grid-line-color) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-line-color) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: var(--panel-offset-x) var(--panel-offset-y);
}

.isMobile.el-aside {
  box-shadow: 0 0 10px rgba(100, 100, 100, 0.5);
  max-height: 40vh;
}
</style>