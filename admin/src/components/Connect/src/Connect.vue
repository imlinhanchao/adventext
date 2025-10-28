<script setup lang="ts">
  import { add, angleOf, len, mul, norm, perp, sub } from '../index';
  
  const props = withDefaults(defineProps<{
    elementMap: Recordable<any>;
    connections: Recordable<{ id: string; from: string; to: string }[]>;
    parent?: HTMLElement;
    spacing?: number;
    tension?: number;
    minCtrl?: number;
  }>(), {
    spacing: 14,
    tension: 0.30,
    minCtrl: 0,
  });

  const nodes = computed(() => Object.entries(props.elementMap).reduce((acc, [key, el]) => {
    if (el) acc[key] = el.$el || el;
    return acc;
  }, {} as Recordable<HTMLElement>));
    
  const svgRect = ref({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  function getSvgRect() {
    const rect = { left: 0, top: 0, width: 0, height: 0 };
    for (const key in nodes.value) {
      const r = nodes.value[key].getBoundingClientRect();
      rect.left = Math.min(rect.left, r.left);
      rect.top = Math.min(rect.top, r.top);
      rect.width = Math.max(rect.width, r.right);
      rect.height = Math.max(rect.height, r.bottom);
    }
    rect.width = rect.width - rect.left;
    rect.height = rect.height - rect.top;
    return rect;
  }

  /* ---------- 几何与锚点计算 ---------- */
  function getCenter(el) {
    const parentNode = props.parent || el.parentNode as HTMLElement;
    const r = el.getBoundingClientRect();
    const pr = parentNode.getBoundingClientRect();
    return { x: r.left + r.width/2 - pr.left, y: r.top + r.height/2 - pr.top };
  }

  // 返回元素四边中点之一，选择哪一边取决于目标方向（避免线穿过元素）
  function getEdgeAnchor(el, targetPoint) {
    const parentNode = props.parent || el.parentNode as HTMLElement;
    let r = el.getBoundingClientRect();
    const pr = parentNode.getBoundingClientRect();
    r = {
      left: r.left - pr.left,
      top: r.top - pr.top,
      right: r.right - pr.left,
      bottom: r.bottom - pr.top,
      width: r.width,
      height: r.height,
    };
    const cx = r.left + r.width/2, cy = r.top + r.height/2;
    const dx = targetPoint.x - cx, dy = targetPoint.y - cy;
    if (Math.abs(dx) > Math.abs(dy)) {
      // 左右
      return { x: dx > 0 ? r.right : r.left, y: cy };
    } else {
      // 上下
      return { x: cx, y: dy > 0 ? r.bottom : r.top };
    }
  }

  /* ---------- 索引分配（按角度排序后给并列索引） ---------- */
  function computeIndexes() {
    const outMap = {};
    const inMap = {};
    const centers = {};
    for (const id in nodes.value) centers[id] = getCenter(nodes.value[id]);

    for (const key in props.connections) {
      for (const conn of props.connections[key]) {
        const from = conn.from, to = conn.to;
        const fromC = centers[from];
        const toC = centers[to];

        const angOut = angleOf(sub(toC, fromC));
        outMap[from] = outMap[from] || [];
        outMap[from].push({ conn, angle: angOut, to });

        const angIn = angleOf(sub(fromC, toC));
        inMap[to] = inMap[to] || [];
        inMap[to].push({ conn, angle: angIn, from });
      }
    }

    const outIndex = new Map();
    const inIndex = new Map();
    for (const nodeId in outMap) {
      const arr = outMap[nodeId];
      arr.sort((a,b)=> a.angle - b.angle);
      const total = arr.length;
      arr.forEach((it, i) => outIndex.set(it.conn.id, { idx: i, total }));
    }
    for (const nodeId in inMap) {
      const arr = inMap[nodeId];
      arr.sort((a,b)=> a.angle - b.angle);
      const total = arr.length;
      arr.forEach((it, i) => inIndex.set(it.conn.id, { idx: i, total }));
    }
    return { outIndex, inIndex };
  }
  

  /* ---------- 生成单条连接的 SVG path d（增强版：在控制点上加入 perp 曲率偏移） ---------- */
  function computeConnectionPath(srcEl, dstEl, idxSrc = 0, totalSrc = 1, idxDst = 0, totalDst = 1, spacingPx = 14, tensionRatio = 0.28) {
    const dstCenter = getCenter(dstEl);
    const srcCenter = getCenter(srcEl);

    // 基本锚点（边缘中点）
    const A = getEdgeAnchor(srcEl, dstCenter);
    const B = getEdgeAnchor(dstEl, srcCenter);

    // 方向与法线
    let baseDir = sub(B, A);
    const distAB = len(baseDir);
    if (distAB < 1) baseDir = {x:1,y:0};
    baseDir = norm(baseDir);
    const basePerp = norm(perp(baseDir));

    // 计算源/目标端的并列偏移
    const offsetSrc = (idxSrc - (totalSrc - 1) / 2) * spacingPx;
    const offsetDst = (idxDst - (totalDst - 1) / 2) * spacingPx;

    // 分别偏移两端
    const A_off = add(A, mul(basePerp, offsetSrc));
    const B_off = add(B, mul(basePerp, offsetDst));

    // 计算控制点沿方向的伸展距离
    const fullDist = len(sub(B_off, A_off));
    const d1 = Math.max(props.minCtrl, fullDist * tensionRatio);
    const d2 = Math.max(props.minCtrl, fullDist * tensionRatio);

    // 基础控制点（沿方向）
    let c1 = add(A_off, mul(baseDir, d1));
    let c2 = sub(B_off, mul(baseDir, d2));

    // 在控制点上加入垂直方向的曲率偏移，使曲线更明显
    let curvature = (offsetSrc - offsetDst) * 0.6;
    if (Math.abs(curvature) < 1) {
      const defaultCurv = Math.min(fullDist * 0.18, 120);
      const sign = (baseDir.x * baseDir.y >= 0) ? 1 : -1;
      curvature = defaultCurv * sign;
    }
    c1 = add(c1, mul(basePerp, curvature));
    c2 = add(c2, mul(basePerp, curvature));

    return `M ${A_off.x} ${A_off.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${B_off.x} ${B_off.y}`;
  }

  /* ---------- 渲染 ---------- */
  let pending = false;
  const pathMap = ref<Recordable<SVGAElement>>({});
  function render() {
    pending = false;

    svgRect.value = getSvgRect(); 
    const { outIndex, inIndex } = computeIndexes();

    for (const key in props.connections) {
      for (const conn of props.connections[key]) {
        const srcEl = document.getElementById(conn.id) || nodes.value[conn.from];
        const dstEl = nodes.value[conn.to];

        const outInfo = outIndex.get(conn.id) || { idx: 0, total: 1 };
        const inInfo  = inIndex.get(conn.id)  || { idx: 0, total: 1 };

        const d = computeConnectionPath(srcEl, dstEl, outInfo.idx, outInfo.total, inInfo.idx, inInfo.total, props.spacing, props.tension);
        const pathEl = pathMap.value[conn.id];
        pathEl.setAttribute('d', d);
      }
    }
  }

  function requestRender() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(render);
  }

  watch(() => props.connections, () => {
    requestRender();
  }, { deep: true });

  defineExpose({
    render: requestRender,
  });
</script>

<template>
  <svg 
    id="svgLayer" 
    xmlns="http://www.w3.org/2000/svg" 
    class="absolute top-0 left-0 w-full h-full pointer-events-none"
    :viewBox="`${svgRect.left} ${svgRect.top} ${svgRect.width} ${svgRect.height}`"
    :style="{
      left: svgRect.left + 'px',
      top: svgRect.top + 'px',
      width: svgRect.width + 'px',
      height: svgRect.height + 'px',
    }"
  >
    <defs>
      <marker 
        id="arrow-small"
        viewBox="0 0 6 10"
        refX="5" refY="5"
        markerWidth="15" markerHeight="15"
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <path d="M0 1 L6 5 L0 9 z" fill="var(--el-color-primary)" />
      </marker>
    </defs>
    <template v-for="(conn, key) in connections" :key="key">
      <path 
        v-for="c in conn"
        :ref="(el) => pathMap[c.id] = el as any"
        :key="c.id"
        :id="`conn-path-${c.id}`" 
        stroke="var(--el-color-primary)" 
        stroke-width="2" 
        fill="none" 
        marker-end="url(#arrow-small)" 
      />
    </template>
  </svg>
</template>