<template>
  <HudPanel title="库存 TOP10" width="280px">
    <div class="sku-list">
      <div
        v-for="(s, i) in data"
        :key="s.SkuNo"
        class="sku-item"
        :style="{ animationDelay: `${i * 0.05}s` }"
      >
        <span class="sku-rank" :class="rankClass(i + 1)">{{ i + 1 }}</span>
        <span class="sku-name">{{ s.SkuName }}</span>
        <div class="sku-bar-wrap">
          <div
            class="sku-bar"
            :style="{ width: barWidth(s.StockQty) + '%' }"
          ></div>
        </div>
        <span class="sku-qty">{{ s.StockQty }}</span>
      </div>
    </div>
  </HudPanel>
</template>

<script setup lang="ts">
import { computed } from "vue";
import HudPanel from "./HudPanel.vue";

interface SkuItem {
  SkuNo: string;
  SkuName: string;
  StockQty: number;
}

const props = defineProps<{
  data: SkuItem[];
}>();

const maxQty = computed(() => {
  if (props.data.length === 0) return 1;
  return props.data[0].StockQty || 1;
});

function barWidth(qty: number): number {
  return Math.max(4, (qty / maxQty.value) * 100);
}

function rankClass(rank: number): string {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "";
}
</script>

<style scoped>
.sku-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sku-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 4px;
  border-radius: 2px;
  background: rgba(0, 80, 130, 0.08);
  animation: fadeIn 0.35s ease-out both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sku-rank {
  width: 18px;
  height: 18px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(0, 150, 200, 0.12);
  color: rgba(0, 200, 255, 0.5);
}

.sku-rank.gold {
  background: rgba(255, 215, 0, 0.18);
  color: #ffd740;
}
.sku-rank.silver {
  background: rgba(170, 180, 190, 0.18);
  color: #aab4be;
}
.sku-rank.bronze {
  background: rgba(205, 127, 50, 0.18);
  color: #cd7f32;
}

.sku-name {
  width: 90px;
  font-size: 11px;
  color: rgba(180, 210, 240, 0.75);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.sku-bar-wrap {
  flex: 1;
  height: 3px;
  background: rgba(0, 100, 150, 0.12);
  border-radius: 2px;
  overflow: hidden;
}

.sku-bar {
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(0, 180, 240, 0.4),
    rgba(0, 220, 255, 0.7)
  );
  border-radius: 2px;
  transition: width 0.6s ease;
  box-shadow: 0 0 4px rgba(0, 200, 255, 0.2);
}

.sku-qty {
  width: 26px;
  text-align: right;
  font-size: 12px;
  font-weight: 600;
  color: #c8e0f0;
  font-family: "SF Mono", "JetBrains Mono", monospace;
  flex-shrink: 0;
}
</style>