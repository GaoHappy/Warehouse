<template>
  <div class="floating-toolbar">
    <!-- <div class="toolbar-group">
      <button class="tool-btn" @click="handleBack" title="返回配置">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
    </div>

    <div class="toolbar-divider"></div> -->

    <div class="toolbar-group">
      <button class="tool-btn" title="数据概览" @click="toggleSummary">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      </button>
      <button class="tool-btn" title="层级结构" @click="toggleTree">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="5" r="2" />
          <circle cx="6" cy="17" r="2" />
          <circle cx="18" cy="17" r="2" />
          <line x1="12" y1="7" x2="6" y2="15" />
          <line x1="12" y1="7" x2="18" y2="15" />
        </svg>
      </button>

      <div class="toolbar-divider"></div>

      <button
        class="tool-btn"
        :class="{ active: activeView === 'front' }"
        @click="changeView('front')"
        title="正视图"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M3 15h18" />
        </svg>
      </button>
      <button
        class="tool-btn"
        :class="{ active: activeView === 'back' }"
        @click="changeView('back')"
        title="后视图"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 3v18" />
        </svg>
      </button>
      <button
        class="tool-btn"
        :class="{ active: activeView === 'left' }"
        @click="changeView('left')"
        title="左视图"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18M3 9h18" />
        </svg>
      </button>
      <button
        class="tool-btn"
        :class="{ active: activeView === 'right' }"
        @click="changeView('right')"
        title="右视图"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M15 3v18M3 9h18" />
        </svg>
      </button>
      <button
        class="tool-btn"
        :class="{ active: activeView === 'top' }"
        @click="changeView('top')"
        title="俯视图"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      </button>

      <div class="toolbar-divider"></div>

      <button class="tool-btn" @click="handleFullscreen" title="全屏">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

defineProps<{
  warehouseName: string;
}>();

const emit = defineEmits<{
  fullscreen: [];
  viewChange: [view: string];
  toggleTree: [];
  toggleSummary: [];
}>();

const activeView = ref<string>("front");

const router = useRouter();

function changeView(view: string): void {
  activeView.value = view;
  emit("viewChange", view);
}

function handleFullscreen(): void {
  emit("fullscreen");
}

function handleBack(): void {
  router.push("/warehouse-config");
}

function toggleTree(): void {
  emit("toggleTree");
}

function toggleSummary(): void {
  emit("toggleSummary");
}
</script>

<style scoped>
.floating-toolbar {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  background: rgba(14, 60, 78, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(35, 90, 110, 0.8);
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

.toolbar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.toolbar-divider {
  width: 24px;
  height: 1px;
  background: rgba(35, 90, 110, 0.6);
  margin: 6px 0;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tool-btn:hover {
  color: #e2e8f0;
  background: rgba(60, 150, 180, 0.2);
}

.tool-btn.active {
  color: #60a5fa;
  background: rgba(60, 150, 180, 0.25);
}
</style>