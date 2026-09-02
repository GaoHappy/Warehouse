<template>
  <div class="location-detail-panel">
    <div class="panel-header">
      <svg
        class="panel-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
      <span>货位详情</span>
    </div>
    <div v-if="!detail" class="panel-empty">
      <span class="empty-icon">⊞</span>
      <span>点击货位查看详情</span>
    </div>
    <div v-else class="panel-content">
      <div class="detail-code">{{ detail.locationCode }}</div>
      <div class="detail-divider"></div>
      <div class="detail-grid">
        <div class="detail-field">
          <span class="field-label">货架</span>
          <span class="field-value">{{ detail.shelfCode }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">排</span>
          <span class="field-value">{{ detail.row }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">列</span>
          <span class="field-value">{{ detail.column }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">层</span>
          <span class="field-value">{{ detail.layer }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">仓库</span>
          <span class="field-value">{{ detail.warehouseCode || "-" }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">区域</span>
          <span class="field-value">{{ detail.areaCode || "-" }}</span>
        </div>
      </div>
      <div class="detail-divider"></div>
      <div class="detail-status-row">
        <span class="field-label">状态</span>
        <span class="status-badge" :class="statusClass">{{ statusLabel }}</span>
      </div>
      <div class="detail-quantity">
        <span class="field-label">库存数量</span>
        <span class="quantity-value">{{ detail.quantity }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { LocationDetail } from "@/models/location";
import { LocationStatus, LocationStatusLabel } from "@/models/location";

const props = defineProps<{
  detail: LocationDetail | null;
}>();

const statusClass = computed(() => {
  if (!props.detail) return "";
  const classMap: Record<LocationStatus, string> = {
    [LocationStatus.Empty]: "status-empty",
    [LocationStatus.Occupied]: "status-occupied",
    [LocationStatus.Locked]: "status-locked",
    [LocationStatus.Disabled]: "status-disabled",
    [LocationStatus.Fault]: "status-fault",
  };
  return classMap[props.detail.status];
});

const statusLabel = computed(() => {
  if (!props.detail) return "";
  return LocationStatusLabel[props.detail.status];
});
</script>

<style scoped>
.location-detail-panel {
  width: 260px;
  background: linear-gradient(180deg, #123a4a 0%, #0f3040 100%);
  border-left: 1px solid rgba(35, 90, 110, 0.5);
  padding: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: rgba(60, 150, 180, 0.06);
  border-bottom: 1px solid rgba(35, 90, 110, 0.5);
}

.panel-icon {
  color: #60a5fa;
  opacity: 0.8;
}

.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 16px;
  color: #475569;
  font-size: 13px;
}

.empty-icon {
  font-size: 32px;
  opacity: 0.3;
}

.panel-content {
  padding: 16px;
}

.detail-code {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  font-family: "SF Mono", "Cascadia Code", "Fira Code", monospace;
  letter-spacing: 0.03em;
  margin-bottom: 12px;
  word-break: break-all;
}

.detail-divider {
  height: 1px;
  background: rgba(35, 90, 110, 0.4);
  margin: 12px 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field-value {
  font-size: 13px;
  font-weight: 500;
  color: #cbd5e1;
}

.detail-status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 4px;
  letter-spacing: 0.02em;
}

.status-badge.status-empty {
  color: #64748b;
  background: rgba(60, 150, 180, 0.1);
}

.status-badge.status-occupied {
  color: #34d399;
  background: rgba(52, 211, 153, 0.12);
}

.status-badge.status-locked {
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.12);
}

.status-badge.status-disabled {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
}

.status-badge.status-fault {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
}

.detail-quantity {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.quantity-value {
  font-size: 20px;
  font-weight: 700;
  color: #e2e8f0;
  font-family: "SF Mono", "Cascadia Code", "Fira Code", monospace;
}
</style>