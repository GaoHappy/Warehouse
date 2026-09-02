<template>
  <Teleport to="body">
    <Transition name="preview-fade">
      <div v-if="visible" class="preview-overlay" @click.self="handleClose">
        <div class="preview-container">
          <div class="preview-header">
            <span class="preview-title">3D 预览</span>
            <a-button
              type="text"
              class="preview-close-btn"
              @click="handleClose"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </a-button>
          </div>
          <div ref="previewCanvas" class="preview-canvas"></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick } from "vue";
import { WarehouseSceneManager } from "@/three/core/WarehouseSceneManager";
import { LocationManager } from "@/three/managers/LocationManager";
import { LocationBuilder } from "@/three/builders/LocationBuilder";
import { LayerWarehouseBuilder } from "@/three/builders/LayerWarehouseBuilder";
import { useWarehouseStore } from "@/stores/warehouse";

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const warehouseStore = useWarehouseStore();
const previewCanvas = ref<HTMLElement | null>(null);

let sceneManager: WarehouseSceneManager | null = null;

function handleClose(): void {
  emit("close");
}

function initPreview(): void {
  if (!previewCanvas.value) return;

  const layers = warehouseStore.editingLayers;
  if (layers.length === 0) return;

  const locationManager = new LocationManager();
  const locationBuilder = new LocationBuilder(locationManager);
  const warehouseBuilder = new LayerWarehouseBuilder(
    locationBuilder,
    locationManager
  );

  sceneManager = new WarehouseSceneManager(previewCanvas.value);
  sceneManager.initialize();
  warehouseBuilder.build(layers, sceneManager);
  sceneManager.start();
  sceneManager.resize();
}

function destroyPreview(): void {
  sceneManager?.destroy();
  sceneManager = null;
}

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 100));
      initPreview();
    } else {
      destroyPreview();
    }
  }
);

onUnmounted(() => {
  destroyPreview();
});
</script>

<style scoped>
.preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
}

.preview-container {
  width: 90vw;
  height: 85vh;
  background: #0b1829;
  border-radius: 12px;
  border: 1px solid #2a3a5a;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #0f1d33;
  border-bottom: 1px solid #1e3050;
  flex-shrink: 0;
}

.preview-title {
  color: #8899bb;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.preview-close-btn {
  color: #8899bb !important;
}

.preview-close-btn:hover {
  color: #c0d0f0 !important;
  background: rgba(255, 255, 255, 0.08) !important;
}

.preview-canvas {
  flex: 1;
  min-height: 0;
}

.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.25s ease;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
}

.preview-fade-enter-active .preview-container,
.preview-fade-leave-active .preview-container {
  transition: transform 0.25s ease;
}

.preview-fade-enter-from .preview-container {
  transform: scale(0.95);
}

.preview-fade-leave-to .preview-container {
  transform: scale(0.95);
}
</style>