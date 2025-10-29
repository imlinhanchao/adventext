<script setup lang="ts">
  import VTree from '@wsfe/vue-tree';
  import '@wsfe/vue-tree/style.css';

  const props = defineProps<{
    data: any;
  }>();

  const treeRef = ref<InstanceType<typeof VTree>>();
  watch(
    () => props.data,
    () => {
      treeRef.value?.setData(null);
    },
  );

  function rootLabel(node: any) {
    if (Array.isArray(node)) {
      return 'Array';
    } else if (node === null) {
      return 'null';
    } else if (node === undefined) {
      return 'undefined';
    } else if (typeof node === 'object') {
      return node?.constructor?.name || Object.prototype.toString.call(node).slice(8, -1);
    } else if (typeof node === 'function') {
      return node.toString();
    } else {
      return JSON.stringify(node);
    }
  }

  function isLeaf(node: any) {
    return (
      typeof node !== 'object' ||
      node === null ||
      node === undefined ||
      ObjectKeys(node).length == 0
    );
  }

  function children(node: any, parentKey: string) {
    if (Array.isArray(node)) {
      return node.map((value, index) => ({
        id: parentKey + '.' + index,
        key: index.toString(),
        value,
        isLeaf: isLeaf(value),
      }));
    } else if (typeof node === 'object') {
      return ObjectEntries(node).map(([key, value]) => ({
        id: parentKey + '.' + key,
        key,
        value,
        isLeaf: isLeaf(value),
      }));
    } else {
      return [];
    }
  }

  function load(data: any, resolve: (data: any) => void) {
    if (data === null) {
      resolve([
        {
          id: Date.now(),
          key: rootLabel(props.data),
          value: props.data,
          isRoot: true,
        },
      ]);
    } else {
      resolve(children(data.value, data.key));
    }
  }

  function ObjectKeys(data: any) {
    if (Array.isArray(data)) {
      return data.map((_, index) => index);
    } else if (typeof data === 'object') {
      const keys: string[] = [];
      for (const key in data) {
        keys.push(key);
      }
      return keys;
    } else {
      return [];
    }
  }

  function ObjectEntries(data: any) {
    if (Array.isArray(data)) {
      return data.map((value, index) => [index, value]);
    } else if (typeof data === 'object') {
      const entries: any[] = [];
      for (const key in data) {
        entries.push([key, data[key]]);
      }
      return entries;
    } else {
      return [];
    }
  }
</script>

<template>
  <section class="object-tree">
    <VTree ref="treeRef" :load="load">
      <template #node="{ node }">
        <b class="key">{{ node.key }}</b>
        <template v-if="!node.isRoot">
          <b class="key">: </b>
          <span class="value" :class="typeof node.value">{{ rootLabel(node.value) }}</span>
        </template>
      </template>
    </VTree>
  </section>
</template>

<style>
  .object-tree .key {
    color: var(--code-preview-object-key-color);
    font-family: var(--vp-font-family-mono);
  }
  .object-tree .value {
    color: var(--code-preview-object-value-color);
    font-family: var(--vp-font-family-mono);
  }
  .object-tree .value.function::before {
    content: 'ƒ ';
    color: var(--code-preview-object-function-color);
  }
  .object-tree .value.string {
    color: var(--code-preview-object-string-color);
  }
  .object-tree .vtree-tree-node__title {
    padding: 0;
    margin: 0;
  }
  .vtree-tree-node__expand i:after {
    position: relative;
    left: 3px;
  }
  @media (any-hover: hover) {
    .vtree-tree-node__title:hover {
      background-color: var(--code-preview-object-hover-color);
    }
  }
</style>
