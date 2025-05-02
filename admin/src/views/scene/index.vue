<script setup lang="ts">
  import { getSceneList, Scene, sceneBatchSave } from '@/api/scene';
  import SceneItem from './scene.vue';
  import { ElMessage } from 'element-plus';
  import { useEventListener } from '@/hooks/event/useEventListener';

  const route = useRoute();
  const story = Number(route.params.story);
  const scenes = ref<Scene[]>([]);

  onMounted(() => {
    loadScene();
  });
  function loadScene() {
    getSceneList(story).then((data) => {
      scenes.value = data;
    });
  }

  const pos = ref({
    x: 0,
    y: 0,
  });

  async function save() {
    await sceneBatchSave(story, scenes.value);
    ElMessage.success('保存成功');
  }
  function add() {}

  const scenePanelRef = ref<HTMLElement>();
  const sceneViewRef = ref<HTMLElement>();
  const sceneRef = ref<Recordable<any>>({});
  const highlight = ref('');
  function highlightScene(next: string) {
    const nextScene = scenes.value.find((item) => item.name === next);
    if (!nextScene) return;
    
    highlight.value = next;
    if (!scenePanelRef.value) return;
    if (!sceneViewRef.value) return;
    if (!sceneRef.value[next]) return;

    pos.value.x = sceneViewRef.value.clientWidth / 2 - nextScene.position.x - sceneRef.value[next].$el.clientWidth / 2;
    pos.value.y = sceneViewRef.value.clientHeight / 2 - nextScene.position.y - sceneRef.value[next].$el.clientHeight / 2;

    const timer = setInterval(() => {
      highlight.value = highlight.value ? '' : next;
    }, 500);
    setTimeout(() => {
      clearInterval(timer);
      highlight.value = '';
    }, 3000);
  }

  const isMove = ref(false);
  const beginPos = ref({
    x: 0,
    y: 0,
  });
  function beginMove(e: MouseEvent) {
    isMove.value = true;
    beginPos.value.x = e.clientX - pos.value.x;
    beginPos.value.y = e.clientY - pos.value.y;
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
    name: 'mouseup',
    listener: () => {
      isMove.value = false;
    },
    wait: 0,
  });
</script>

<template>
  <el-container>
    <el-header class="flex !py-2 justify-between" height="auto">
      <section>
        <el-button type="primary" @click="add" plain>添加场景</el-button>
      </section>
      <section>
        <el-button type="primary" @click="save">保存</el-button>
      </section>
    </el-header>
    <el-main class="!h-full">
      <section
        @mousedown="beginMove"
        class="relative overflow-hidden w-full h-full shadow shadow-lg border"
        ref="sceneViewRef"
      >
        <section
          id="scenePanel"
          ref="scenePanelRef"
          class="absolute transition-all duration-200"
          :style="{ top: pos.y + 'px', left: pos.x + 'px' }"
        >
          <SceneItem
            v-for="(scene, index) in scenes"
            :ref="(el) => (sceneRef[scene.name] = el)"
            :key="index"
            :story="story"
            :scene="scene"
            @next="highlightScene"
            @mousedown.stop
            class="transition-all duration-200"
            :class="{
              'border-2 border-blue-500': highlight === scene.name,
            }"
          />
        </section>
      </section>
    </el-main>
  </el-container>
</template>
