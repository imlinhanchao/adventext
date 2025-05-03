<script setup lang="ts">
import { gameRun, Profile, SceneRecord, updateOptions } from '@/api/game';
import { ScenesContext, StoryContext } from './index';
import { Scene } from '@/api/scene';


const scenes = inject(ScenesContext)!;
const story = inject(StoryContext)!;
const profile = ref<Profile>({
  storyId: story?.value.id || 0,
  userId: 0,
  scene: story?.value.start || '',
  from: '',
  inventory: story?.value.inventory || [],
  attr: story?.value.attr || {},
  attrName: story?.value.attrName || {},
});
const sceneMap = computed(() => 
  scenes?.value.reduce((acc, scene) => {
    acc[scene.name] = scene;
    return acc;
  }, {} as Record<number, Scene>)
);

const currentScene = ref<Scene>(sceneMap.value[profile.value.scene]);
const msgType = ref<'success' | 'warning' | 'info' | 'error'>('info');
const message = ref('');
const records = ref<SceneRecord[]>([]);

async function run(option) {
  let value = '';
  let { scene, state, message: msg } = await gameRun({
    option,
    profile: profile.value,
    scene: currentScene.value,
    timezone: new Date().getTimezoneOffset() / 60,
    value
  }).catch((err) => {
    msgType.value = 'error';
    message.value = err.message;
    return {  };
  });

  if (!scene) return;
  
  records.value.unshift(new SceneRecord(
    currentScene.value,
    option,
    profile.value.from,
  ));
  
  scene.options = updateOptions(scene, records.value);

  currentScene.value = scene;
  profile.value = state;
  message.value = msg;
  msgType.value = 'info';

  if (currentScene.value.isEnd) {
    message.value = '收获结局：' + currentScene.value.theEnd;
    msgType.value = 'success';
  }
}

</script>

<template>
  <el-container class="h-full">
    <el-header class="flex !py-2 justify-between" height="auto">
      <section></section>
    </el-header>
    <el-main class="!h-full space-y-2">
      <section class="space-x-2">
        <label class="bg-black text-white p-1 mr-1 rounded">属性</label>
        <span v-for="(value, key) in profile.attr" :key="key" class="inline-block">
          {{ (profile.attrName[key] || key) + (profile.attrName[key] ? `(${key})` : '') }}: {{ value }}
        </span>
      </section>
      <section class="space-x-2">
        <label class="bg-black text-white p-1 mr-1 rounded">物品</label>
        <span v-for="item in profile.inventory" :key="item.id">
          <el-tooltip :content="`[${item.type}]${item.description}`">
            <span>{{ item.name }}({{ item.key }}) x {{ item.count }}</span>
          </el-tooltip>
        </span>
      </section>
      <el-alert v-if="message" :type="msgType">{{ message }}</el-alert>
      <section>
        {{ currentScene.content }}
      </section>
      <section>
        <el-button v-for="o in currentScene.options" :key="o.text" plain type="primary" @click="run(o.text)">
          {{ o.text }}
        </el-button> 
      </section>
    </el-main>
  </el-container>
</template>