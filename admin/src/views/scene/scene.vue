<script setup lang="ts">
  import { Scene } from '@/api/scene';
  import { useEventListener } from '@/hooks/event/useEventListener';

  const props = defineProps<{
    story: string;
    scene: Scene;
    sceneMap: Recordable<Scene>;
    start?: boolean;
  }>();

  const emit = defineEmits(['next', 'edit', 'remove', 'start']);
  const data = ref<Scene>(props.scene);

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
    beginPos.value.x = client.x - data.value.position.x;
    beginPos.value.y = client.y - data.value.position.y;
  }

  useEventListener({
    el: document.body,
    name: 'mousemove',
    listener: (e: MouseEvent) => {
      if (isMove.value) {
        data.value.position.x = e.clientX - beginPos.value.x;
        data.value.position.y = e.clientY - beginPos.value.y;
      }
    },
    wait: 0,
  });

  useEventListener({
    el: document.body,
    name: 'touchmove',
    listener: (e: TouchEvent) => {
      if (isMove.value) {
        data.value.position.x = e.touches[0].clientX - beginPos.value.x;
        data.value.position.y = e.touches[0].clientY - beginPos.value.y;
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

  const content = computed(() => {
    let content = `<b>${data.value.content}</b>`;
    data.value.options.forEach((option) => {
      if (option.append) {
        if (content.includes('${' + option.text + '}')) {
          content = content.replaceAll(
            '${' + option.text + '}', 
            `</b><span title="来自选项：${option.text}" class="hover:font-bold">${option.append}</span><b>`
          );
        } else {
          content += `<span title="来自选项：${option.text}" class="hover:font-bold">${option.append}</span>`;
        }
      }
    });
    return content;
  });

  const loading = ref(false);
  function remove() {
    loading.value = true;
    emit('remove', data.value, () => loading.value = false);
  }
</script>
<template>
  <section
    class="absolute transition-none group w-[400px]"
    :style="{ left: scene.position.x + 'px', top: scene.position.y + 'px' }"
  >
    <el-card class="scene w-full" :header="scene.name" header-class="!flex justify-between">
      <template #header>
        <span class="text-lg font-bold select-none cursor-move flex items-center space-x-1" @mousedown.stop="beginMove" @touchstart.stop="beginMove">
          <el-tooltip content="移动场景"><Icon icon="i-tdesign:move" /></el-tooltip>
          <span>{{ scene.name }}</span>
          <Icon title="起始场景" :size="20" color="#f63832" v-if="start" icon="i-lets-icons:flag-fill" />
          <Icon title="结局" :size="20" color="#1f8bf4" v-if="scene.isEnd" icon="i-carbon:circle-filled" />
        </span>
        <span>
          <ButtonEx class="!group-hover:inline !hidden" icon="i-lets-icons:flag-duotone" v-if="!start && !scene.isEnd" link @click="$emit('start', scene)" content="设置为起始场景" />
          <ButtonEx type="danger" link icon="el-icon-delete" @click="remove" :loading="loading" content="删除" />
          <ButtonEx type="primary" link icon="el-icon-edit" @click="$emit('edit', scene)" content="编辑" />
        </span>
      </template>
      <p class="my-2">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span class="whitespace-pre-wrap" v-html="content"></span>
      </p>
      <section>
        <ul>
          <li v-for="(item, index) in scene.options" :key="index" class="flex justify-between">
            <span>
              <span class="inline-block mr-2">{{ item.text }}</span>
              <span>
                <Icon icon="i-vaadin:input" v-if="item.value" :title="item.value" />
                <Icon
                  icon="i-tabler:filter"
                  v-if="item.conditions?.length"
                  :title="`条件x` + item.conditions?.length"
                />
                <Icon
                  icon="i-eva:gift-outline"
                  v-if="item.effects?.length"
                  :title="`效果x` + item.effects?.length"
                />
                <Icon icon="i-icon-park-outline:play-once" v-if="(item.loop ?? 0) < 0" title="单次执行" />
                <Icon icon="i-icon-park-outline:loop-once" v-if="(item.loop ?? 0) > 0" :title="`循环/${item.loop}s`" />
              </span>
            </span>
            <span 
              ref="nextRef" 
              :class="{ 
                'cursor-pointer': item.next != '<back>', 
                'bg-red px-2 rounded font-bold': item.next != '<back>' && !sceneMap[item.next] 
              }" 
              @click="item.next != '<back>' && emit('next', item.next)"
            >→{{ item.next }}</span>
          </li>
        </ul>
      </section>
    </el-card>
  </section>
</template>
