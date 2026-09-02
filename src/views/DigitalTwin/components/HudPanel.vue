<template>
  <div class="hud-panel" :style="{ width: width || 'auto' }">
    <div class="hud-panel__corner tl"></div>
    <div class="hud-panel__corner tr"></div>
    <div class="hud-panel__corner bl"></div>
    <div class="hud-panel__corner br"></div>
    <div class="hud-panel__header" v-if="title">
      <span class="hud-panel__title">{{ title }}</span>
    </div>
    <div class="hud-panel__body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  title?: string;
  width?: string;
}>();
</script>

<style scoped>
.hud-panel {
  position: relative;
  background: rgba(0, 18, 40, 0.78);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 200, 255, 0.25);
  border-radius: 2px;
  box-shadow: 0 0 20px rgba(0, 180, 240, 0.08),
    inset 0 0 20px rgba(0, 180, 240, 0.03);
  overflow: hidden;
  font-family: "SF Mono", "JetBrains Mono", "Cascadia Code", "Consolas",
    monospace;
  color: #c8e6ff;
}

.hud-panel__corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: rgba(0, 220, 255, 0.6);
  border-style: solid;
  border-width: 0;
  z-index: 2;
}

.hud-panel__corner.tl {
  top: 1px;
  left: 1px;
  border-top-width: 1px;
  border-left-width: 1px;
}
.hud-panel__corner.tr {
  top: 1px;
  right: 1px;
  border-top-width: 1px;
  border-right-width: 1px;
}
.hud-panel__corner.bl {
  bottom: 1px;
  left: 1px;
  border-bottom-width: 1px;
  border-left-width: 1px;
}
.hud-panel__corner.br {
  bottom: 1px;
  right: 1px;
  border-bottom-width: 1px;
  border-right-width: 1px;
}

.hud-panel__header {
  padding: 10px 14px 6px;
  border-bottom: 1px solid rgba(0, 180, 240, 0.15);
}

.hud-panel__title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(0, 220, 255, 0.85);
  text-shadow: 0 0 8px rgba(0, 200, 255, 0.3);
}

.hud-panel__body {
  padding: 10px 14px;
  position: relative;
  z-index: 1;
}
</style>