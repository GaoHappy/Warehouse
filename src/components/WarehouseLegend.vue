<template>
  <div class="warehouse-legend">
    <div class="legend-pill">
      <div class="legend-item">
        <span class="legend-dot empty"></span>
        <span>空闲</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot occupied"></span>
        <span>有物料</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot empty-box"></span>
        <span>空箱子</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot locked"></span>
        <span>锁定</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot disabled"></span>
        <span>禁用</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.warehouse-legend {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  pointer-events: none;
}

.legend-pill {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 8px 20px;
  background: rgba(14, 60, 78, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(35, 90, 110, 0.8);
  border-radius: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  letter-spacing: 0.02em;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  display: inline-block;
  flex-shrink: 0;
}

.legend-dot.empty {
  background: transparent;
  border: 1.5px solid #1a3a5c;
  border-radius: 2px;
}

.legend-dot.occupied {
  background: #3b82f6;
  box-shadow: 0 0 6px rgba(59, 130, 246, 0.4);
}

.legend-dot.empty-box {
  background: #ffffff;
  box-shadow: 0 0 6px rgba(96, 165, 250, 0.4);
}

.legend-dot.locked {
  background: #ff7a00;
}

.legend-dot.disabled {
  background: #8c8c8c;
  box-shadow: 0 0 6px rgba(140, 140, 140, 0.4);
}

.legend-dot.fault {
  background: #722ed1;
  box-shadow: 0 0 6px rgba(114, 46, 209, 0.4);
}
</style>