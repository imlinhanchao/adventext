<script setup lang="ts">
  import { deleteScene, getSceneList, Scene, sceneBatchSave } from '@/api/scene';
  import SceneItem from './scene.vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { useEventListener } from '@/hooks/event/useEventListener';
  import SceneForm from './item.vue';
  import { getStory, Story, updateStory } from '@/api/story';
  import { getItemList, Item } from '@/api/item';
  import { ItemsContext, ScenesContext, StoryContext } from './index';
  import ItemSelector from '@/views/item/selector.vue';
  import Virtual from './virtual.vue';
  import StoryForm from '@/views/story/item.vue';
import { useBreakpoint } from '@/hooks/event/useBreakpoint';

  const route = useRoute();
  const storyId = Number(route.params.story);
  const story = ref<Story>(new Story());
  const items = ref<Item[]>([]);
  const scenes = ref<Scene[]>([]);

  provide(ItemsContext, items);
  provide(StoryContext, story);
  provide(ScenesContext, scenes);

  onMounted(() => {
    loadScene();
    loadStory();
    loadItem();
  });
  function loadScene() {
    getSceneList(storyId).then((data) => {
      scenes.value = data;
    });
  }
  function loadStory() {
    getStory(storyId).then((data) => {
      story.value = data;
    });
  }
  function loadItem() {
    getItemList(storyId).then((data) => {
      items.value = data;
    });
  }
  function updateSceneName(oldName: string, name: string) {
    scenes.value.forEach((item) => {
      item.options.forEach((option) => {
        if (option.next === oldName) {
          option.next = name;
        }
      });
    });
    sceneBatchSave(story.value.id!, scenes.value).then(() => {
      ElMessage.success('场景名称联动修改成功');
    });
    if (story.value.start == oldName) {
      story.value.start = name;
      updateStory(story.value);
    }
  }

  const pos = ref({
    x: 0,
    y: 0,
  });

  async function save() {
    await sceneBatchSave(storyId, scenes.value);
    ElMessage.success('保存成功');
  }

  const sceneFormRef = ref<InstanceType<typeof SceneForm>>();
  function addScene() {
    sceneFormRef.value?.open().then((scene: Scene) => {
      scenes.value.push(scene);
    });
  }
  function editScene(scene: Scene) {
    sceneFormRef.value?.open(scene).then((data: Scene) => {
      Object.assign(scene, data);
    });
  }
  function removeScene(scene: Scene) {
    ElMessageBox.confirm('确定删除该场景吗？', '提示', {
      type: 'warning',
    }).then(() => {
      deleteScene(storyId, scene.id!).then(() => {
        ElMessage.success('删除成功');
      });
      scenes.value = scenes.value.filter((item) => item !== scene);
    });
  }
  function setStart(scene: Scene) {
    ElMessageBox.confirm('确定设置为起始场景吗？', '提示', {
      type: 'warning',
    }).then(() => {
      story.value.start = scene.name;
      updateStory(story.value).then(() => {
        ElMessage.success('设置成功');
      });
    });
  }

  const storyFormRef = ref<InstanceType<typeof StoryForm>>();
  function editStory() {
    storyFormRef.value?.open(story.value);
  }

  const scenePanelRef = ref<HTMLElement>();
  const sceneViewRef = ref<HTMLElement>();
  const sceneRef = ref<Recordable<any>>({});
  const highlight = ref('');
  function highlightScene(next: string) {
    const nextScene = scenes.value.find((item) => item.name === next);
    if (!nextScene) {
      sceneFormRef.value?.open(new Scene(next)).then((scene: Scene) => {
        scenes.value.push(scene);
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
  function beginMove(e: MouseEvent|TouchEvent) {
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

  const sceneMap = computed<Recordable<Scene>>(() =>
    scenes.value.reduce((acc, scene) => {
      acc[scene.name] = scene;
      return acc;
    }, {}),
  );

  const itemListRef = ref<InstanceType<typeof ItemSelector>>();
  function viewItemList() {
    itemListRef.value?.open().then(async () => {
      items.value = await getItemList(storyId);
    });
  }

  const isVirtual = ref(false);
  function virtualRun() {
    isVirtual.value = !isVirtual.value;
  }

  const { screenSM: isMobile } = useBreakpoint();
  
</script>

<template>
  <el-container :direction="isMobile ? 'vertical' : 'horizontal'">
    <el-container>
      <el-header class="flex !py-2 justify-between" height="auto">
        <section>
          <el-button-group class="mr-3">
            <el-button type="primary" @click="editStory" plain>
              <Icon icon="i-uil:setting" /><span class="btn-text">故事设置</span>
            </el-button>
            <el-tooltip content="跳转到起始场景">
              <el-button type="primary" @click="highlightScene(story.start)" plain style="--el-button-divide-border-color: var(--el-primary-color)">
                <Icon icon="i-lets-icons:flag-fill" />
              </el-button>
            </el-tooltip>
          </el-button-group>
          <el-button type="primary" @click="addScene" plain>
            <Icon icon="i-mdi:movie-open-plus-outline" /><span class="btn-text">添加场景</span>
          </el-button>
          <el-button type="warning" @click="viewItemList" plain>
            <Icon icon="i-ph:sword" /><span class="btn-text">管理物品</span>
          </el-button>
          <el-button type="success" @click="virtualRun" :plain="!isVirtual">
            <template v-if="!isVirtual"><Icon icon="i-solar:play-bold" /><span class="btn-text">模拟运行</span></template>
            <template v-else><Icon icon="i-solar:stop-bold" /><span class="btn-text">结束运行</span></template>
          </el-button>
        </section>
        <section>
          <el-button type="primary" @click="save">
            <Icon icon="i-lucide:save" /><span class="btn-text">保存布局</span>
          </el-button>
        </section>
      </el-header>
      <el-main class="!h-full">
        <section
          @mousedown="beginMove"
          @touchstart="beginMove"
          class="story-panel relative overflow-hidden w-full h-full dark:shadow-gray-800 shadow shadow-lg border dark:border-gray-600 bg-var(--el-bg-color)"
          :class="{ 'cursor-move': isMove }"
          ref="sceneViewRef"
          :style="`--panel-offset-x: ${pos.x}px; --panel-offset-y: ${pos.y}px;`"
        >
          <section
            id="scenePanel"
            ref="scenePanelRef"
            class="absolute"
            :class="{ 'transition-all duration-200': !isMove }"
            :style="{ top: pos.y + 'px', left: pos.x + 'px' }"
          >
            <SceneItem
              v-for="(scene, index) in scenes"
              :ref="(el) => (sceneRef[scene.name] = el)"
              :key="index"
              :story="storyId"
              :scene="scene"
              :sceneMap="sceneMap"
              @next="highlightScene"
              @edit="editScene"
              @remove="removeScene"
              @start="setStart"
              @mousedown.stop
              class="transition-all duration-200"
              :class="{
                'border-2 border-blue-500': highlight === scene.name,
                'w-80vw': isMobile,
              }"
              :start="story.start === scene.name"
            />
          </section>
        </section>
      </el-main>
      <ItemSelector ref="itemListRef" :story="storyId" readonly @close="loadItem" />
      <SceneForm ref="sceneFormRef" :story="storyId" :scenes="scenes" @update-name="updateSceneName" />
      <StoryForm ref="storyFormRef" @confirm="loadStory" />

    </el-container>
    <el-aside v-if="isVirtual" :width="isMobile ? '100%' : '500px'" class="dark:border-gray-600 virtual-panel" :class="{ 'border-l': !isMobile}">
      <Virtual @next="highlightScene" />
    </el-aside>
  </el-container>
</template>
<style lang="less" scoped>
.story-panel {
  background-color: var(--background-color); /* 背景底色 */
  background-image: 
      linear-gradient(to right, var(--grid-line-color) 1px, transparent 1px),
      linear-gradient(to bottom, var(--grid-line-color) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: var(--panel-offset-x) var(--panel-offset-y);
}
</style>