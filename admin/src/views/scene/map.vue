<template>
  <div ref="chartRef" class="w-full h-full"></div>
</template>

<script setup lang="ts">
  import * as echarts from 'echarts';

  const props = withDefaults(
    defineProps<{
      scenes: Array<{
        name: string;
        options: Array<{
          text: string;
          next: string;
        }>;
      }>;
      width?: string;
      height?: string;
      layout?: 'force' | 'circular' | 'none';
      createPlaceholderForUnknownNext?: boolean;
      forceOptions?: any;
    }>(),
    {
      width: '100%',
      height: '100%',
      layout: 'force',
      createPlaceholderForUnknownNext: true,
      forceOptions: () => ({ repulsion: 800 }),
    },
  );

  const emit = defineEmits(['edge-click', 'node-click']);

  const chartRef = ref(null);
  let chart: echarts.ECharts;
  let resizeObserver: ResizeObserver;

  /**
   * 将 scenes 转换为 echarts 的 nodes/links
   * - 支持同一对节点有多条边（通过 curveness 分散）
   */
  function buildGraph(scenes) {
    const nodesMap = new Map();
    const linksGrouped = new Map(); // key: source|target -> array of { text, source, target }
    const itemColor = '#b45510';
    // 先添加所有已知场景为节点
    for (const s of scenes || []) {
      nodesMap.set(s.name, {
        id: s.name,
        name: s.name,
        label: { show: true, formatter: s.name },
        symbolSize: 40,
        itemStyle: { color: itemColor }, // 节点填充颜色
      });
    }

    // 收集 edges（分组以便后面计算 curveness）
    for (const s of scenes || []) {
      const opts = s.options || [];
      for (const opt of opts) {
        const src = s.name;
        const tgt = opt.next;
        const text = opt.text == null ? '' : String(opt.text);

        if (!tgt) {
          // 若 next 为空/假值，默认忽略。如果需要可改为指向一个 END 节点
          continue;
        }

        // 如果目标节点不存在且允许创建占位节点，则创建
        if (!nodesMap.has(tgt) && props.createPlaceholderForUnknownNext) {
          nodesMap.set(tgt, {
            id: tgt,
            name: tgt,
            label: { show: true, formatter: tgt, color: '#fff' },
            symbolSize: 36,
            itemStyle: { opacity: 0.6, color: itemColor },
          });
        }

        const key = `${src}|||${tgt}`;
        if (!linksGrouped.has(key)) linksGrouped.set(key, []);
        linksGrouped.get(key).push({ source: src, target: tgt, text });
      }
    }

    // 从分组生成最终 links，按 index 计算 curveness（使并行边分散）
    const links: any[] = [];
    for (const [_, arr] of linksGrouped.entries()) {
      const n = arr.length;
      for (let i = 0; i < n; i++) {
        const item = arr[i];
        let curveness = 0;
        if (n === 1) {
          // 单条边也可用轻微曲线，显得更柔和
          curveness = 0.08;
        } else {
          const mid = (n - 1) / 2;
          curveness = (i - mid) * 0.18;
        }
        // 限制最大绝对值，避免过度弯曲
        if (Math.abs(curveness) > 0.6) {
          curveness = Math.sign(curveness) * 0.6;
        }
        links.push({
          source: item.source,
          target: item.target,
          value: item.text,
          color: '#d78710',
          label: { show: true, formatter: item.text, position: 'middle' },
          lineStyle: { color: '#d78710', curveness },
          emphasis: { label: { show: true } }, // hover 时显示
        });
      }
    }

    const nodes = Array.from(nodesMap.values());
    return { nodes, links };
  }

  function getOptionFromGraph(nodes, links) {
    return {
      tooltip: {
        trigger: 'item',
      },
      series: [
        {
          type: 'graph',
          layout: props.layout,
          data: nodes,
          links: links,
          roam: true,
          focusNodeAdjacency: true,
          symbolSize: 40,
          draggable: true,
          label: { show: true },
          // 边的箭头
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: [0, 8],
          // 如果希望大图性能更好，可以把 edgeLabel 全局设为 false，单独用 link.label 显示每条边
          edgeLabel: { show: false },
          // 允许每条 link 自带 label（上面构造时已设置 link.label）
          // 力导向参数
          force: props.layout === 'force' ? { ...(props.forceOptions || {}) } : undefined,
          lineStyle: { color: '#d78710', width: 3 },
        },
      ],
    };
  }

  function initChart() {
    if (!chartRef.value) return;
    chart = echarts.init(chartRef.value);
    chart.on('click', (params) => {
      if (params.dataType === 'edge') {
        // params.data contains edge data we set earlier
        emit('edge-click', params.data);
      } else if (params.dataType === 'node') {
        emit('node-click', params.data);
      }
    });

    // 自动响应容器大小变化（使用 ResizeObserver，如果不支持可回退到 window resize）
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        chart && chart.resize();
      });
      resizeObserver.observe(chartRef.value);
    } else {
      window.addEventListener('resize', onWindowResize);
    }
  }

  function onWindowResize() {
    chart && chart.resize();
  }

  function renderFromScenes(scenes) {
    if (!chart) return;
    const { nodes, links } = buildGraph(scenes);
    const option = getOptionFromGraph(nodes, links);
    console.log('Rendering chart with option:', option);
    chart.setOption(option, { notMerge: true });
  }

  onMounted(async () => {
    await nextTick();
    initChart();
    renderFromScenes(props.scenes);
  });

  onBeforeUnmount(() => {
    if (resizeObserver && chartRef.value) {
      resizeObserver.unobserve(chartRef.value);
      resizeObserver.disconnect && resizeObserver.disconnect();
    } else {
      window.removeEventListener('resize', onWindowResize);
    }
    chart && chart.dispose();
  });

  // 当 scenes 变动时重新渲染
  watch(
    () => props.scenes,
    (newVal) => {
      renderFromScenes(newVal);
    },
    { deep: true },
  );
</script>
