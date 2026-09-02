<template>
  <HudPanel title="最近订单" width="280px">
    <div class="order-scroll-wrap">
      <div class="order-list" ref="listRef">
        <div v-for="o in duplicatedData" :key="o._key" class="order-item">
          <span class="order-type" :class="{ inbound: o.OrderType === 1 }">
            {{ o.OrderType === 1 ? "入" : "出" }}
          </span>
          <span class="order-no">{{ o.OrderNo }}</span>
          <span class="order-time">{{ formatTime(o.CreateTime) }}</span>
        </div>
      </div>
    </div>
  </HudPanel>
</template>

<script setup lang="ts">
import { computed } from "vue";
import HudPanel from "./HudPanel.vue";

interface OrderItem {
  OrderNo: string;
  OrderType: number;
  OrderTypeName: string;
  RegionCode: string;
  CreateTime: string;
  OrderStatus: number;
}

const props = defineProps<{
  data: OrderItem[];
}>();

const duplicatedData = computed(() => {
  if (props.data.length === 0) return [];
  const list = props.data.map((o, i) => ({
    ...o,
    _key: `a-${o.OrderNo}-${i}`,
  }));
  return [...list, ...list];
});

function formatTime(t: string): string {
  return t.slice(5, 16);
}
</script>

<style scoped>
.order-scroll-wrap {
  overflow: hidden;
  position: relative;
  flex: 1;
  min-height: 0;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  animation: scrollUp 35s linear infinite;
}

.order-list:hover {
  animation-play-state: paused;
}

@keyframes scrollUp {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}

.order-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  border-radius: 2px;
  background: rgba(0, 100, 150, 0.06);
  flex-shrink: 0;
}

.order-type {
  width: 20px;
  height: 20px;
  border-radius: 2px;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(255, 145, 0, 0.2);
  color: #ff9100;
  border: 1px solid rgba(255, 145, 0, 0.3);
}

.order-type.inbound {
  background: rgba(0, 230, 118, 0.2);
  color: #00e676;
  border-color: rgba(0, 230, 118, 0.3);
}

.order-no {
  flex: 1;
  font-size: 12px;
  color: rgba(200, 220, 240, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-time {
  font-size: 10px;
  color: rgba(140, 180, 200, 0.5);
  flex-shrink: 0;
}
</style>