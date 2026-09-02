<template>
  <HudPanel title="设备状态" width="280px">
    <div class="device-list">
      <div
        v-for="d in data"
        :key="d.SubSysCode + d.SubSysName"
        class="device-item"
      >
        <span class="device-dot" :class="{ online: d.Online }"></span>
        <span class="device-name">{{ d.SubSysName }}</span>
        <span class="device-status" :class="{ online: d.Online }">
          {{ d.Online ? "ONLINE" : "OFFLINE" }}
        </span>
      </div>
    </div>
  </HudPanel>
</template>

<script setup lang="ts">
import HudPanel from "./HudPanel.vue";

interface DeviceItem {
  SubSysCode: string;
  SubSysName: string;
  SubSysIP: string;
  SubSysPort: number;
  Online: boolean;
}

defineProps<{
  data: DeviceItem[];
}>();
</script>

<style scoped>
.device-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  border-radius: 2px;
  background: rgba(0, 100, 150, 0.08);
}

.device-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff1744;
  flex-shrink: 0;
}

.device-dot.online {
  background: #00e676;
  box-shadow: 0 0 8px rgba(0, 230, 118, 0.6);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 4px rgba(0, 230, 118, 0.4);
  }
  50% {
    box-shadow: 0 0 14px rgba(0, 230, 118, 0.8);
  }
}

.device-name {
  flex: 1;
  font-size: 12px;
  color: rgba(180, 210, 240, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-status {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: rgba(255, 80, 80, 0.8);
}

.device-status.online {
  color: rgba(0, 230, 118, 0.8);
}
</style>