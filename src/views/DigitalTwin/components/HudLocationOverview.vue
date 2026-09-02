<template>
  <HudPanel title="库位概览" width="280px">
    <div class="loc-card" v-for="item in data" :key="item.RegionCode">
      <div class="loc-primary">
        <div class="loc-primary__label">{{ item.RegionName }}</div>
        <div class="loc-primary__value">
          <span class="loc-num">{{ displayRate }}</span>
          <span class="loc-unit">%</span>
        </div>
      </div>
      <div class="loc-grid">
        <div class="loc-item used">
          <div class="loc-item__icon">■</div>
          <div class="loc-item__info">
            <span class="loc-item__label">已用</span>
            <span class="loc-item__value">{{ item.UsedLocations }}</span>
          </div>
        </div>
        <div class="loc-item free">
          <div class="loc-item__icon">□</div>
          <div class="loc-item__info">
            <span class="loc-item__label">空闲</span>
            <span class="loc-item__value">{{
              item.TotalLocations - item.UsedLocations
            }}</span>
          </div>
        </div>
        <div class="loc-item total">
          <div class="loc-item__icon">▣</div>
          <div class="loc-item__info">
            <span class="loc-item__label">总计</span>
            <span class="loc-item__value">{{ item.TotalLocations }}</span>
          </div>
        </div>
      </div>
    </div>
  </HudPanel>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import HudPanel from "./HudPanel.vue";

interface LocationUtilization {
  RegionCode: string;
  RegionName: string;
  TotalLocations: number;
  UsedLocations: number;
  UtilizationRate: number;
}

const props = defineProps<{
  data: LocationUtilization[];
}>();

const displayRate = ref(0);

function animateNumber(target: number): void {
  const duration = 800;
  const start = displayRate.value;
  const startTime = performance.now();
  function step(now: number): void {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    displayRate.value = parseFloat(
      (start + (target - start) * eased).toFixed(1)
    );
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);
}

watch(
  () => props.data[0]?.UtilizationRate,
  (val) => {
    if (val !== undefined) animateNumber(val);
  },
  { immediate: true }
);
</script>

<style scoped>
.loc-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loc-primary {
  text-align: center;
  padding: 4px 0 8px;
  border-bottom: 1px solid rgba(0, 180, 240, 0.12);
}

.loc-primary__label {
  font-size: 11px;
  color: rgba(0, 200, 255, 0.6);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.loc-primary__value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.loc-num {
  font-size: 42px;
  font-weight: 700;
  color: #00e5ff;
  text-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
  line-height: 1;
  font-family: "SF Mono", "JetBrains Mono", monospace;
}

.loc-unit {
  font-size: 14px;
  color: rgba(0, 200, 255, 0.5);
}

.loc-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.loc-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 2px;
  background: rgba(0, 100, 150, 0.1);
}

.loc-item__icon {
  font-size: 14px;
  width: 22px;
  text-align: center;
}

.loc-item.used .loc-item__icon {
  color: #ff9100;
}
.loc-item.free .loc-item__icon {
  color: #00e676;
}
.loc-item.total .loc-item__icon {
  color: #00e5ff;
}

.loc-item__info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loc-item__label {
  font-size: 12px;
  color: rgba(180, 210, 240, 0.7);
}

.loc-item__value {
  font-size: 20px;
  font-weight: 700;
  color: #e0f0ff;
  font-family: "SF Mono", "JetBrains Mono", monospace;
}
</style>