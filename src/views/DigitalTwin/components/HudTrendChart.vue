<template>
  <HudPanel title="30天出入库趋势">
    <div class="trend-chart">
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        class="trend-svg"
        preserveAspectRatio="none"
      >
        <defs>
          <filter :id="`glowIn-${uid}`">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter :id="`glowOut-${uid}`">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient :id="`gradIn-${uid}`" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#00e676" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#00e676" stop-opacity="0.02" />
          </linearGradient>
          <linearGradient :id="`gradOut-${uid}`" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ff9100" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#ff9100" stop-opacity="0.02" />
          </linearGradient>
        </defs>

        <line
          v-for="i in 4"
          :key="'g' + i"
          :x1="PAD_L"
          :y1="PAD_T + i * stepY"
          :x2="W - PAD_R"
          :y2="PAD_T + i * stepY"
          stroke="rgba(0,180,240,0.06)"
          stroke-width="0.5"
          stroke-dasharray="4,4"
        />

        <text
          v-for="i in 5"
          :key="'yl' + i"
          :x="PAD_L - 4"
          :y="PAD_T + (i - 1) * stepY + 3"
          text-anchor="end"
          class="axis-label"
        >
          {{ yLabels[i - 1] }}
        </text>

        <text
          v-for="item in xLabels"
          :key="'xl' + item.idx"
          :x="toX(item.idx)"
          :y="H - 4"
          text-anchor="middle"
          class="axis-label"
        >
          {{ item.label }}
        </text>

        <polygon :points="areaInPoints" :fill="`url(#gradIn-${uid})`" />
        <polygon :points="areaOutPoints" :fill="`url(#gradOut-${uid})`" />

        <polyline
          :points="lineInPoints"
          fill="none"
          stroke="#00e676"
          stroke-width="1.8"
          :filter="`url(#glowIn-${uid})`"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <polyline
          :points="lineOutPoints"
          fill="none"
          stroke="#ff9100"
          stroke-width="1.8"
          :filter="`url(#glowOut-${uid})`"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <circle
          v-for="(p, i) in inPoints"
          :key="'di' + i"
          :cx="p.x"
          :cy="p.y"
          r="2.5"
          fill="#00e676"
          opacity="0.9"
        />
        <circle
          v-for="(p, i) in outPoints"
          :key="'do' + i"
          :cx="p.x"
          :cy="p.y"
          r="2.5"
          fill="#ff9100"
          opacity="0.9"
        />
      </svg>
      <div class="trend-legend">
        <span class="legend-item">
          <span
            class="dot"
            style="background: #00e676; box-shadow: 0 0 6px #00e676"
          ></span
          >入库
        </span>
        <span class="legend-item">
          <span
            class="dot"
            style="background: #ff9100; box-shadow: 0 0 6px #ff9100"
          ></span
          >出库
        </span>
      </div>
    </div>
  </HudPanel>
</template>

<script setup lang="ts">
import { computed } from "vue";
import HudPanel from "./HudPanel.vue";

interface TrendItem {
  OrderDate: string;
  Inbound: number;
  Outbound: number;
}

const props = defineProps<{
  data: TrendItem[];
}>();

const uid = Math.random().toString(36).slice(2, 8);

const W = 800;
const H = 160;
const PAD_T = 14;
const PAD_B = 24;
const PAD_L = 34;
const PAD_R = 6;
const chartW = W - PAD_L - PAD_R;
const chartH = H - PAD_T - PAD_B;

const maxVal = computed(() => {
  let m = 1;
  for (const d of props.data) {
    m = Math.max(m, d.Inbound, d.Outbound);
  }
  return m;
});

const stepY = chartH / 4;

const yLabels = computed(() => {
  const m = maxVal.value;
  return [
    m,
    Math.round(m * 0.75),
    Math.round(m * 0.5),
    Math.round(m * 0.25),
    0,
  ];
});

const xLabels = computed(() => {
  const data = props.data;
  if (data.length === 0) return [];
  const total = data.length;
  const indices = [
    0,
    Math.floor(total / 4),
    Math.floor(total / 2),
    Math.floor((total * 3) / 4),
    total - 1,
  ];
  return indices.map((idx) => {
    const d = data[idx]?.OrderDate || "";
    return { label: d.slice(5), idx };
  });
});

function toX(i: number): number {
  const len = props.data.length || 1;
  return PAD_L + (i / (len - 1)) * chartW;
}

function toY(v: number): number {
  return PAD_T + chartH - (v / maxVal.value) * chartH;
}

const inPoints = computed(() =>
  props.data.map((d, i) => ({ x: toX(i), y: toY(d.Inbound) }))
);
const outPoints = computed(() =>
  props.data.map((d, i) => ({ x: toX(i), y: toY(d.Outbound) }))
);

const lineInPoints = computed(() =>
  inPoints.value.map((p) => `${p.x},${p.y}`).join(" ")
);
const lineOutPoints = computed(() =>
  outPoints.value.map((p) => `${p.x},${p.y}`).join(" ")
);

const areaInPoints = computed(() => {
  const pts = inPoints.value.map((p) => `${p.x},${p.y}`).join(" ");
  return `${PAD_L},${PAD_T + chartH} ${pts} ${W - PAD_R},${PAD_T + chartH}`;
});

const areaOutPoints = computed(() => {
  const pts = outPoints.value.map((p) => `${p.x},${p.y}`).join(" ");
  return `${PAD_L},${PAD_T + chartH} ${pts} ${W - PAD_R},${PAD_T + chartH}`;
});
</script>

<style scoped>
.trend-chart {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trend-svg {
  width: 100%;
  display: block;
}

.axis-label {
  font-size: 9px;
  fill: rgba(0, 180, 240, 0.4);
  font-family: "SF Mono", "JetBrains Mono", monospace;
}

.trend-legend {
  display: flex;
  gap: 24px;
  justify-content: center;
}

.legend-item {
  font-size: 11px;
  color: rgba(180, 210, 240, 0.6);
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
</style>