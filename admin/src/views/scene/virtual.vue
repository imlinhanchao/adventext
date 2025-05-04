<script setup lang="tsx">
  import ItemSelector from '@/views/item/selector.vue';
  import { gameRun, Profile, SceneRecord, updateOptions } from '@/api/game';
  import { ScenesContext, StoryContext } from './index';
  import { Option, Scene } from '@/api/scene';
  import { Item } from '@/api/item';
  import { isNumber } from '@/utils';

  const emit = defineEmits(['next']);

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
    scenes?.value.reduce(
      (acc, scene) => {
        acc[scene.name] = scene;
        return acc;
      },
      {} as Record<number, Scene>,
    ),
  );

  const currentScene = ref<Scene>(sceneMap.value[profile.value.scene]);
  const msgType = ref<'success' | 'warning' | 'info' | 'error'>('info');
  const message = ref('');
  const records = ref<SceneRecord[]>([]);

  async function getValue(option: Option) {
    let value: string | false = '';
    if (option.value?.startsWith('item:')) {
      const [_, msg, type] = option.value.split(':');
      let inventory = profile.value.inventory.filter((item) => (item.count || 0) > 0);
      if (type) inventory = inventory.filter((item) => item.type === type);
      if (inventory.length === 0) {
        msgType.value = 'error';
        message.value = type ? `你没有${type}` : '先去别处转转吧';
        return false;
      }
      value = await selectItem(inventory, msg);
      if (!value) return false;
    } else if (option.value) {
      value = prompt(option.value) || '';
      if (!value) return false;
    }
    return value;
  }

  async function run(option: Option) {
    let value = await getValue(option);
    if (value === false) return;
    let {
      scene,
      state,
      next,
      message: msg,
    } = await gameRun({
      option: option.text,
      profile: profile.value,
      scene: currentScene.value,
      timezone: new Date().getTimezoneOffset() / 60,
      value,
    }).catch((err) => {
      msgType.value = 'error';
      message.value = err.message;
      return {};
    });

    if (!scene) return;

    records.value.unshift(new SceneRecord(currentScene.value, option.text, profile.value.from));

    currentScene.value = sceneMap.value[next || scene.name];
    currentScene.value.options = updateOptions(currentScene.value, records.value);

    profile.value = state;
    message.value = msg;
    msgType.value = 'info';

    emit('next', currentScene.value.name);

    if (currentScene.value.isEnd) {
      message.value = '收获结局：' + currentScene.value.theEnd;
      msgType.value = 'success';
    }
  }

  const itemSelector = ref(false);
  const dlgMessage = ref('');
  const itemToSelect = ref<Item[]>([]);
  let selectItemResolve: (value: string) => void;
  function selectItem(inventory: Item[], message: string): Promise<string | false> {
    dlgMessage.value = message;
    itemToSelect.value = inventory;
    itemSelector.value = true;
    return new Promise((resolve) => {
      selectItemResolve = (value) => {
        itemSelector.value = false;
        resolve(value);
      };
    });
  }

  const itemRef = ref<InstanceType<typeof ItemSelector>>();
  function addInventory() {
    itemRef.value?.open(profile.value.inventory).then((items: Item[]) => {
      profile.value.inventory = items;
    });
  }

  function addAttr() {
    const key = prompt('请输入属性key');
    if (!key) return;
    const name = prompt('请输入属性名称(可以为空)');
    const value = prompt('请输入属性值');
    if (!value) return;
    profile.value.attr[key] = isNaN(parseFloat(value)) ? value : parseFloat(value);
    if (name) profile.value.attrName[key] = name;
  }

  const jumpScene = ref('');
  function jumpToScene(scene: string) {
    if (!scene) return;
    const targetScene = sceneMap.value[scene];
    if (!targetScene) return;
    currentScene.value = targetScene;
    profile.value.scene = targetScene.name;
    jumpScene.value = '';
    message.value = '';
    emit('next', currentScene.value.name);
  }
</script>

<template>
  <el-container class="h-full">
    <el-header class="flex !py-2 justify-between" height="auto">
      <section class="w-full flex justify-between items-center">
        <h1 class="font-bold text-xl inline-block">{{ story.name }}</h1>
        <el-select v-model="jumpScene" placeholder="跳转场景" size="small" class="max-w-30" @change="jumpToScene" filterable>
          <el-option
            v-for="scene in scenes"
            :key="scene.name"
            :label="scene.content"
            :value="scene.name"
            class="!h-auto !pr-0 w-60"
          >
            <section class="py-1">
              <div class="leading-normal">{{ scene.name }}</div>
              <div class="text-sm text-gray-300 truncate">{{ scene.content }}</div>
            </section>
          </el-option>
        </el-select>
      </section>
    </el-header>
    <el-main class="!h-full space-y-2">
      <section class="space-x-2">
        <label class="bg-black text-white p-1 mr-1 rounded">
          <el-button link icon="el-icon-plus" class="!text-inherit" title="手动添加" @click="addAttr" /> 属性
        </label>
        <span v-for="(value, key) in profile.attr" :key="key" class="inline-block my-1">
          {{ (profile.attrName[key] || key) + (profile.attrName[key] ? `(${key})` : '') }}:
          <el-input-number
            v-if="isNumber(value)"
            v-model="profile.attr[key]"
            size="small"
            controls-position="right"
            class="!w-20"
          />
          <el-input v-else v-model="profile.attr[key]" size="small" class="!w-20" />
        </span>
      </section>
      <section class="space-x-2">
        <label class="bg-black text-white p-1 mr-1 rounded">
          <el-button link icon="el-icon-plus" class="!text-inherit" title="手动添加" @click="addInventory" /> 物品
        </label>
        <span v-for="item in profile.inventory" :key="item.id">
          <el-tooltip :content="`[${item.type}]${item.description}`">
            <span>
              {{ item.name }}({{ item.key }}) x
              <el-input-number
                v-model="item.count"
                size="small"
                controls-position="right"
                class="!w-20 my-1"
              />
            </span>
          </el-tooltip>
        </span>
      </section>
      <el-alert v-if="message" :type="msgType" :closable="false">{{ message }}</el-alert>
      <section>
        <span>{{ currentScene.content }}</span>
        <span v-for="o in currentScene.options.filter((o) => o.append)" :key="o.text">
          {{ o.append }}
        </span>
      </section>
      <section>
        <template v-for="o in currentScene.options" :key="o.text">
          <el-button v-if="!o.disabled" plain type="primary" @click="run(o)">
            {{ o.text }}
          </el-button>
        </template>
      </section>
      <ItemSelector ref="itemRef" :story="story.id!" multiple inventory />
      <el-dialog v-model="itemSelector" width="400px">
        <p class="mb-3">{{ dlgMessage }}</p>
        <p>
          <el-tag
            class="cursor-pointer"
            v-for="item in itemToSelect"
            :key="item.id"
            @click="selectItemResolve(`item:${item.key}`)"
          >
            <el-tooltip :content="`[${item.type}]${item.description}`">
              <span>{{ item.name }}</span>
            </el-tooltip>
          </el-tag>
        </p>
      </el-dialog>
    </el-main>
  </el-container>
</template>