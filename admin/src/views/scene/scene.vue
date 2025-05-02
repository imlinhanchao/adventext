<script setup lang="ts">
  import { Scene } from '@/api/scene';
  import { useEventListener } from '@/hooks/event/useEventListener';

  const props = defineProps<{
    story: number;
    scene: Scene;
  }>();

  const emit = defineEmits(['next', 'edit']);
  const data = ref<Scene>(props.scene);

  const isMove = ref(false);
  const beginPos = ref({
    x: 0,
    y: 0,
  });
  function beginMove(e: MouseEvent) {
    isMove.value = true;
    beginPos.value.x = e.clientX - data.value.position.x;
    beginPos.value.y = e.clientY - data.value.position.y;
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
    name: 'mouseup',
    listener: () => {
      isMove.value = false;
    },
    wait: 0,
  });

</script>
<template>
  <section
    class="absolute"
    :style="{ left: scene.position.x + 'px', top: scene.position.y + 'px' }"
  >
    <el-card class="scene min-w-[400px]" :header="scene.name" header-class="!flex justify-between">
      <template #header>
        <span class="text-lg font-bold select-none cursor-move" @mousedown="beginMove">{{
          scene.name
        }}</span>
        <el-button type="primary" link icon="el-icon-edit" @click="$emit('edit', scene)" />
      </template>
      <p class="my-2">
        <span class="font-bold">{{ scene.content }}</span>
        <span v-for="(item, index) in scene.options" :key="index">
          {{ item.append || '' }}
        </span>
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
                  :title="`影响x` + item.effects?.length"
                />
              </span>
            </span>
            <span ref="nextRef" :class="{ 'cursor-pointer': item.next != '<back>' }" @click="emit('next', item.next)">→{{ item.next }}</span>
          </li>
        </ul>
      </section>
    </el-card>
  </section>
</template>
