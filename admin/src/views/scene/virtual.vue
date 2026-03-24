<script setup lang="tsx">
  import { ObjectTree } from '@/components/CodeEditor';
  import { JsonPreview } from '@/components/CodeEditor';
  import TargetSelector from '@/views/targets/selector.vue';
  import ItemSelector from '@/views/item/selector.vue';
  import { gameRun, Profile, SceneRecord, updateOptions } from '@/api/game';
  import { ScenesContext, StoryContext } from './index';
  import { Option, Scene } from '@/api/scene';
  import { Item } from '@/api/item';
  import { clone, isNumber, isString, isArray } from '@/utils';
  import { formatDate } from '@vueuse/core';
  import { Achievement } from '@/api/target';
  import { Inventory } from '@/api/draft';
  import DOMPurify from 'dompurify';
  import { marked } from 'marked';

  defineProps<{
    type: string;
  }>();
  const emit = defineEmits(['next']);

  const scenes = inject(ScenesContext)!;
  const story = inject(StoryContext)!;
  const profile = ref<Profile>({
    storyId: story?.value.id || '',
    userId: 0,
    scene: story?.value.start || '',
    from: '',
    inventory: story?.value.inventory || [],
    attr: isArray(story?.value.attr)
      ? story?.value.attr.reduce((acc: any, cur: any) => ((acc[cur.key] = cur.value), acc), {}) ||
        {}
      : story?.value.attr || {},
    attrName: story?.value.attrName,
    sceneAttr: {},
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
  const achievements = ref<Achievement[]>([]);
  const circle = ref(1);
  const fnLogs = ref<any[]>([]);
  const logView = ref(false);
  const globalOptions = ref<Option[]>([]);

  onMounted(async () => {
    const { options, content: text } = await updateOptions(
      currentScene.value,
      profile.value,
      records.value,
      achievements.value,
      circle.value,
    );
    currentScene.value.options = options;
    content.value = text;

    globalOptions.value = await updateOptions(
      { name: '', options: story.value.options || [] } as Scene,
      profile.value,
      records.value,
      achievements.value,
      circle.value,
    ).then((res) => res.options);
  });

  function restart() {
    profile.value = {
      storyId: story.value.id!,
      userId: 0,
      scene: story.value.start,
      from: '',
      inventory: story.value.inventory || [],
      attr: story.value.attr || {},
      attrName: story.value.attrName || {},
      sceneAttr: {},
    };
    currentScene.value = sceneMap.value[profile.value.scene];
    records.value = [];
    achievements.value = [];
    circle.value++;
    message.value = '';
    emit('next', currentScene.value.name);
  }

  async function getValue(option: Option) {
    let value: string | false = '';
    if (option.value?.startsWith('item:') || option.value?.startsWith('items:')) {
      const [_, msg, type] = option.value.split(':');
      let inventory = profile.value.inventory.filter((item) => (item.count || 0) > 0);
      if (type) inventory = inventory.filter((item) => item.type === type);
      if (inventory.length === 0) {
        msgType.value = 'error';
        message.value = type ? `你没有${type}` : '先去别处转转吧';
        return false;
      }
      value = await selectItem(clone(inventory), msg, option.value?.startsWith('items:'));
      if (!value) return false;
    } else if (option.value) {
      value = prompt(option.value) || '';
      if (!value) return false;
    }
    return value;
  }

  const content = ref('');
  const loading = ref(false);
  async function run(option: Option, global = false) {
    let value = await getValue(option);
    if (value === false) return;
    loading.value = true;
    fnLogs.value = [];
    let {
      scene,
      state,
      next,
      message: msg,
      achievements: achies,
      logs: callLogs,
    } = await gameRun({
      option: option.text,
      profile: profile.value,
      scene: currentScene.value,
      timezone: new Date().getTimezoneOffset() / -60,
      achievements: achievements.value,
      value,
      circle: circle.value,
      global,
      options: story.value.options || [],
    }).catch((err) => {
      msgType.value = 'error';
      message.value = err.message;
      loading.value = false;
      return {};
    });

    fnLogs.value.push(...callLogs);
    if (!scene) return;

    achievements.value = achies || [];
    profile.value = state;
    records.value.unshift(
      new SceneRecord(currentScene.value, option.text, profile.value.from, content.value),
    );

    const {
      options,
      content: updateContent,
      logs: optionLogs,
    } = await updateOptions(
      sceneMap.value[next || scene.name],
      profile.value,
      records.value,
      achievements.value,
      circle.value,
    ).finally(() => {
      loading.value = false;
    });

    sceneMap.value[next || scene.name].options = options;
    content.value = updateContent;
    currentScene.value = sceneMap.value[next || scene.name];
    fnLogs.value.push(...optionLogs);

    globalOptions.value = await updateOptions(
      { name: '', options: story.value.options || [] } as Scene,
      profile.value,
      records.value,
      achievements.value,
      circle.value,
    ).then((res) => res.options);

    message.value = msg;
    msgType.value = 'info';

    emit('next', currentScene.value.name);

    if (currentScene.value.isEnd) {
      message.value = '收获结局：' + currentScene.value.theEnd;
      msgType.value = 'success';
    }
  }

  const contentHTML = computed(() => {
    return DOMPurify.sanitize(marked(content.value) as any);
  });
  const messageHTML = computed(() => {
    return DOMPurify.sanitize(marked(message.value) as any);
  });

  const itemSelector = ref(false);
  const dlgMessage = ref('');
  const itemToSelect = ref<Inventory[]>([]);
  const showCount = ref(false);
  const itemCount = ref<Recordable<number>>({});
  let selectItemResolve: (value: string) => void;
  function selectItem(
    inventory: Inventory[],
    message: string,
    needCount = false,
  ): Promise<string | false> {
    dlgMessage.value = message;
    itemCount.value = {};
    inventory.forEach((item) => {
      itemCount.value[item.key] = 1;
    });
    itemToSelect.value = inventory;
    itemSelector.value = true;
    showCount.value = needCount;
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

  const targetSelectorRef = ref<InstanceType<typeof TargetSelector>>();
  function addAchievement() {
    targetSelectorRef.value?.open(achievements.value as any).then((items: Achievement[]) => {
      achievements.value = items;
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

  function addSceneAttr() {
    const key = prompt('请输入属性key');
    if (!key) return;
    const value = prompt('请输入属性值');
    if (!value) return;
    profile.value.sceneAttr[key] = isNaN(parseFloat(value)) ? value : parseFloat(value);
  }

  const jumpScene = ref('');
  async function jumpToScene(scene: string) {
    if (!scene) return;
    const targetScene = sceneMap.value[scene];
    if (!targetScene) return;

    const next = targetScene.name;
    const { options, content: updateContent } = await updateOptions(
      sceneMap.value[next],
      profile.value,
      records.value,
      achievements.value,
    ).finally(() => {
      loading.value = false;
    });
    sceneMap.value[next].options = options;
    content.value = updateContent;
    currentScene.value = sceneMap.value[next];

    currentScene.value = targetScene;
    profile.value.scene = targetScene.name;
    jumpScene.value = '';
    message.value = '';
    emit('next', currentScene.value.name);
  }

  const jsonRef = ref();
  function viewObject(data) {
    jsonRef.value?.open(data);
  }

  function getProfileAttrName(key: string) {
    if (Array.isArray(profile.value.attrName)) {
      const attr = (profile.value.attrName as { key: string; name: string }[]).find(
        (a) => a.key === key,
      );
      return attr ? attr.name + `(${attr.key})` : key;
    } else {
      return (
        (profile.value.attrName?.[key] || key) + (profile.value.attrName?.[key] ? `(${key})` : '')
      );
    }
  }
</script>

<template>
  <el-container class="h-full">
    <el-header class="flex !py-2 justify-between" height="auto">
      <section class="w-full flex space-x-2 items-center">
        <h1 class="font-bold text-xl inline-block">{{ story.name }}</h1>
        <el-select
          v-model="jumpScene"
          placeholder="跳转场景"
          size="small"
          class="max-w-30"
          @change="jumpToScene"
          filterable
        >
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
      <section class="flex items-center space-x-2">
        <label class="bg-black text-white p-1 mr-1 rounded">周目数：</label>
        <el-input-number
          v-model="circle"
          :min="1"
          size="small"
          controls-position="right"
          class="!w-20"
        />
      </section>
      <section id="profile">
        <section id="attr" class="space-x-2">
          <label class="bg-black text-white p-1 mr-1 rounded">
            <ButtonEx
              link
              icon="el-icon-plus"
              class="!text-inherit"
              content="手动添加"
              @click="addAttr"
            />
            属性
          </label>
          <span v-for="(value, key) in profile.attr" :key="key" class="inline-block my-1">
            {{ getProfileAttrName(key as string) }}:
            <el-input-number
              v-if="isNumber(value) || null === value"
              v-model="profile.attr[key]"
              size="small"
              controls-position="right"
              class="!w-20"
            />
            <el-input
              v-else-if="isString(profile.attr[key])"
              v-model="profile.attr[key]"
              size="small"
              class="!w-20"
              :type="profile.attr[key].includes('\n') ? 'textarea' : 'text'"
            />
            <ButtonEx
              v-else
              icon="i-material-symbols:search"
              link
              @click="viewObject(profile.attr[key])"
            />
          </span>
        </section>
        <section id="sceneAttr" class="space-x-2" v-if="Object.keys(profile.sceneAttr).length > 0">
          <label class="bg-black text-white p-1 mr-1 rounded">
            <ButtonEx
              link
              icon="el-icon-plus"
              class="!text-inherit"
              content="手动添加"
              @click="addSceneAttr"
            />
            场景属性
          </label>
          <span v-for="(value, key) in profile.sceneAttr" :key="key" class="inline-block my-1">
            {{ key }}:
            <el-input-number
              v-if="isNumber(value) || null === value"
              v-model="profile.sceneAttr[key]"
              size="small"
              controls-position="right"
              class="!w-20"
            />
            <el-input
              v-else-if="isString(profile.sceneAttr[key])"
              v-model="profile.sceneAttr[key]"
              size="small"
              class="!w-20"
              :type="profile.sceneAttr[key].includes('\n') ? 'textarea' : 'text'"
            />
            <ButtonEx
              v-else
              icon="i-material-symbols:search"
              link
              @click="viewObject(profile.sceneAttr[key])"
            />
          </span>
        </section>
        <section id="item" class="space-x-2">
          <label class="bg-black text-white p-1 mr-1 rounded">
            <ButtonEx
              link
              icon="el-icon-plus"
              class="!text-inherit"
              content="手动添加"
              @click="addInventory"
            />
            物品
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
        <section class="space-x-2">
          <label class="bg-black text-white p-1 mr-1 rounded">
            <ButtonEx
              link
              icon="el-icon-plus"
              class="!text-inherit"
              content="手动添加"
              @click="addAchievement"
            />
            成就
          </label>
          <span v-for="item in achievements" :key="item.key">
            <el-tooltip :content="item.description">
              <span> {{ item.name }}({{ item.key }}) </span>
            </el-tooltip>
          </span>
        </section>
        <section id="global">
          <section class="flex justify-between">
            <template v-for="o in globalOptions" :key="o.text">
              <el-button
                v-if="!o.disabled"
                plain
                type="primary"
                @click="run(o, true)"
                :loading="loading"
                :id="o.id && `option_${o.id}`"
                :class="`option_${o.text}`"
              >
                {{ o.text }}
              </el-button>
            </template>
          </section>
        </section>
      </section>
      <el-alert v-if="message" :type="msgType" :closable="false">
        <div v-html="messageHTML"></div>
      </el-alert>
      <ButtonEx
        v-if="fnLogs.length"
        icon="i-material-symbols:search"
        @click="logView = true"
        size="small"
      >
        查看函数日志
      </ButtonEx>
      <section>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div id="story" v-html="contentHTML" class="whitespace-pre-wrap"></div>
      </section>
      <section id="options" class="space-x-2">
        <template v-for="o in currentScene.options" :key="o.text">
          <el-button
            v-if="!o.disabled"
            plain
            type="primary"
            @click="run(o)"
            :loading="loading"
            :id="o.id && `option_${o.id}`"
            :class="`option_${o.text}`"
          >
            {{ o.text }}
          </el-button>
        </template>
        <el-button v-if="currentScene.isEnd" plain type="success" @click="restart">
          重新游玩
        </el-button>
      </section>
      <component :is="'style'" id="custom-style">
        {{ currentScene.customStyle }}
      </component>
      <component :is="'style'" id="global-style">
        {{ story.customStyle }}
      </component>
      <ItemSelector ref="itemRef" :story="story.id!" multiple inventory :type="type" />
      <TargetSelector ref="targetSelectorRef" :story="story.id!" :type="type" multiple />
      <el-dialog v-model="logView" width="400px" append-to-body>
        <div class="code-logs">
          <template v-for="(l, i) in fnLogs" :key="i">
            <pre
              class="whitespace-pre-wrap"
              v-if="l.type != 'dir'"
            ><code><span v-if="l.type != 'log'" :class="l.type + ' block'">{{ l.type.toUpperCase() }}</span><span>{{ l.data }}</span></code></pre>
            <ObjectTree v-else :data="l.data" />
          </template>
        </div>
      </el-dialog>
      <el-dialog v-model="itemSelector" width="400px" append-to-body>
        <p class="mb-3">{{ dlgMessage }}</p>
        <p>
          <el-tag
            class="cursor-pointer m-1 !pr-0"
            v-for="item in itemToSelect"
            :key="item.id"
            @click="
              selectItemResolve(
                showCount ? `item:${item.key}:${itemCount[item.key]}` : `item:${item.key}`,
              )
            "
          >
            <el-tooltip :content="`[${item.type}]${item.description}`">
              <span>{{ item.name }}</span>
            </el-tooltip>
            <el-input-number
              v-if="showCount"
              v-model="itemCount[item.key]"
              size="small"
              controls-position="right"
              class="!w-16 ml-2 !border-none"
              style="--el-border: none; --el-border-color: transparent"
              @click.stop
            />
          </el-tag>
        </p>
      </el-dialog>
      <JsonPreview ref="jsonRef" />
    </el-main>
    <el-footer height="auto" class="max-h-[40%] overflow-auto">
      <section
        v-for="(record, i) in records"
        class="text-sm space-y-1 rounded hover:dark:bg-gray-900 hover:bg-gray-50 bg-opacity-50 p-2"
        :key="record.time"
      >
        <p>
          <el-button
            size="small"
            link
            class="mr-2"
            icon="el-icon-delete"
            text
            type="danger"
            @click="records.splice(i, 1)"
          />
          <span>{{ record.content }}</span>
        </p>
        <p class="flex justify-between items-center">
          <el-tag>{{ record.option }}</el-tag>
          <span class="text-gray-500">{{
            formatDate(new Date(Number(record.time)), 'YYYY-MM-DD HH:mm:ss')
          }}</span>
        </p>
      </section>
    </el-footer>
  </el-container>
</template>
<style lang="less" scoped>
  .block {
    display: inline-block;
    width: 3.5em;
    padding: 0 2px;
    margin-right: 5px;
    text-align: center;
    font-size: 80%;
    line-height: 1.2;
    border: 1px solid currentColor;
    border-radius: 3px;
  }

  .log {
    color: var(--code-preview-border);
  }

  .info {
    color: #2196f3;
  }

  .error {
    color: #f44336;
  }

  .warn {
    color: #ff9800;
  }

  .debug {
    color: #9e9e9e;
  }
</style>
