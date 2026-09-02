<template>
  <HudPanel title="实时概览" width="280px">
    <div class="kpi-card">
      <div class="kpi-primary">
        <div class="kpi-primary__label">库存总量</div>
        <div class="kpi-primary__value">
          <span class="kpi-num">{{ displayStock }}</span>
          <span class="kpi-unit">件</span>
        </div>
      </div>
      <div class="kpi-grid">
        <div class="kpi-item inbound">
          <div class="kpi-item__icon">▲</div>
          <div class="kpi-item__info">
            <span class="kpi-item__label">今日入库</span>
            <span class="kpi-item__value">{{ data.TodayInboundCount }}</span>
          </div>
        </div>
        <div class="kpi-item outbound">
          <div class="kpi-item__icon">▼</div>
          <div class="kpi-item__info">
            <span class="kpi-item__label">今日出库</span>
            <span class="kpi-item__value">{{ data.TodayOutboundCount }}</span>
          </div>
        </div>
        <div class="kpi-item pending">
          <div class="kpi-item__icon">⏳</div>
          <div class="kpi-item__info">
            <span class="kpi-item__label">待处理任务</span>
            <span class="kpi-item__value">{{ data.PendingTaskCount }}</span>
          </div>
        </div>
      </div>
    </div>
  </HudPanel>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import HudPanel from "./HudPanel.vue";

interface OverviewData {
  TotalStockQty: number;
  TodayInboundCount: number;
  TodayOutboundCount: number;
  PendingTaskCount: number;
}

const props = defineProps<{
  data: OverviewData;
}>();

const displayStock = ref(0);

function animateNumber(target: number): void {
  const duration = 800;
  const start = displayStock.value;
  const startTime = performance.now();
  function step(now: number): void {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    displayStock.value = Math.round(start + (target - start) * eased);
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);
}

watch(
  () => props.data.TotalStockQty,
  (val) => {
    animateNumber(val);
  },
  { immediate: true }
);
</script>

<style scoped>
.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kpi-primary {
  text-align: center;
  padding: 4px 0 8px;
  border-bottom: 1px solid rgba(0, 180, 240, 0.12);
}

.kpi-primary__label {
  font-size: 11px;
  color: rgba(0, 200, 255, 0.6);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.kpi-primary__value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.kpi-num {
  font-size: 42px;
  font-weight: 700;
  color: #00e5ff;
  text-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
  line-height: 1;
  font-family: "SF Mono", "JetBrains Mono", monospace;
}

.kpi-unit {
  font-size: 14px;
  color: rgba(0, 200, 255, 0.5);
}

.kpi-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kpi-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 2px;
  background: rgba(0, 100, 150, 0.1);
}

.kpi-item__icon {
  font-size: 14px;
  width: 22px;
  text-align: center;
}

.kpi-item.inbound .kpi-item__icon {
  color: #00e676;
}
.kpi-item.outbound .kpi-item__icon {
  color: #ff9100;
}
.kpi-item.pending .kpi-item__icon {
  color: #ffd740;
}

.kpi-item__info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-item__label {
  font-size: 12px;
  color: rgba(180, 210, 240, 0.7);
}

.kpi-item__value {
  font-size: 20px;
  font-weight: 700;
  color: #e0f0ff;
  font-family: "SF Mono", "JetBrains Mono", monospace;
}
</style>