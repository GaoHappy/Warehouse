<template>
  <div class="warehouse-3d-page">
    <div v-if="!isLiteMode" class="main-title-bar">
      <div class="title-ornament left"></div>
      <span class="title-text">{{ warehouseStore.screenTitle }}</span>
      <div class="title-ornament right"></div>
    </div>

    <WarehouseToolbar
      v-if="!isLiteMode"
      :warehouse-name="'3D 仓库可视化'"
      @fullscreen="handleFullscreen"
      @viewChange="handleViewChange"
      @toggleTree="showTreePanel = !showTreePanel"
      @toggleSummary="showSummaryPanel = !showSummaryPanel"
    />

    <div class="warehouse-main">
      <div v-if="!isLiteMode" class="float-panels-container">
        <Transition name="float-panel">
          <div v-if="showSummaryPanel" class="summary-float-panel">
            <div class="summary-items">
              <div class="summary-item num-row">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#60a5fa"
                  stroke-width="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 3v18" />
                </svg>
                <span class="item-label">货位总数</span>
                <span class="item-value total-value">{{ totalLocations }}</span>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-grid">
                <div class="summary-item num-row">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3b82f6"
                    stroke-width="2"
                  >
                    <path
                      d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                    />
                  </svg>
                  <span class="item-label">已占用</span>
                  <span class="item-value occupied">{{ occupiedCount }}</span>
                </div>
                <div class="summary-item num-row">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    stroke-width="2"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                  <span class="item-label">空闲</span>
                  <span class="item-value empty">{{ emptyCount }}</span>
                </div>
                <div class="summary-item num-row">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ff7a00"
                    stroke-width="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span class="item-label">锁定</span>
                  <span class="item-value locked">{{ lockedCount }}</span>
                </div>
                <div class="summary-item num-row">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8c8c8c"
                    stroke-width="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                  </svg>
                  <span class="item-label">禁用</span>
                  <span class="item-value disabled-val">{{
                    disabledCount
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <Transition name="float-panel">
          <div
            v-if="showTreePanel"
            class="tree-float-panel"
            @contextmenu.prevent="handleTreeContextMenu"
          >
            <div class="panel-title">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                style="margin-right: 6px"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              层级结构
            </div>
            <a-tree
              v-model:expandedKeys="expandedKeys"
              :tree-data="treeData"
              :checkable="true"
              v-model:checkedKeys="checkedKeys"
              :selectable="true"
              @select="handleTreeSelect"
              @check="handleTreeCheck"
              :field-names="{
                children: 'children',
                title: 'title',
                key: 'key',
              }"
            />
          </div>
        </Transition>

        <LocationDetailPanel
          v-if="warehouseStore.selectedLocationDetail"
          :detail="warehouseStore.selectedLocationDetail"
        />
      </div>

      <div class="warehouse-canvas-wrapper">
        <div ref="canvasContainer" class="warehouse-canvas"></div>
      </div>
    </div>

    <WarehouseLegend v-if="!isLiteMode" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute } from "vue-router";
import * as THREE from "three";
import WarehouseToolbar from "@/components/WarehouseToolbar.vue";
import WarehouseLegend from "@/components/WarehouseLegend.vue";
import LocationDetailPanel from "@/components/LocationDetailPanel.vue";
import { WarehouseSceneManager } from "@/three/core/WarehouseSceneManager";
import { LocationManager } from "@/three/managers/LocationManager";
import { LocationBuilder } from "@/three/builders/LocationBuilder";
import { LayerWarehouseBuilder } from "@/three/builders/LayerWarehouseBuilder";
import { SelectionManager } from "@/three/managers/SelectionManager";
import { RaycastManager } from "@/three/interactions/RaycastManager";
import { useWarehouseStore } from "@/stores/warehouse";
import type { LocationObject } from "@/three/managers/LocationManager";
import type { LayerConfig } from "@/models/warehouse";
import { ApiWarehouseDataProvider } from "@/data/providers/ApiWarehouseDataProvider";
import type { LocationStatusDto } from "@/models/location";
import { LocationStatus } from "@/models/location";

const route = useRoute();
const isLiteMode = computed(
  () => import.meta.env.VITE_APP_MODE === "lite" || route.query.mode === "lite"
);

const canvasContainer = ref<HTMLElement | null>(null);
const expandedKeys = ref<string[]>([]);
const checkedKeys = ref<string[]>([]);
const showSummaryPanel = ref(true);
const showTreePanel = ref(false);

const warehouseStore = useWarehouseStore();

let sceneManager: WarehouseSceneManager | null = null;
let locationManager: LocationManager | null = null;
let warehouseBuilder: LayerWarehouseBuilder | null = null;
let raycastManager: RaycastManager | null = null;
let selectionManager: SelectionManager | null = null;

const apiProvider = new ApiWarehouseDataProvider(warehouseStore.apiUrl);
let statusPollTimer: ReturnType<typeof setInterval> | null = null;
const STATUS_POLL_INTERVAL = 10000;

const totalLocations = computed(() => {
  let count = 0;
  for (const layer of warehouseStore.editingLayers) {
    for (const wh of layer.warehouses) {
      for (const shelf of wh.shelves) {
        count += shelf.rows * shelf.columns * shelf.layers;
      }
    }
  }
  return count;
});

const occupiedCount = computed(() => {
  return warehouseStore.locationStatuses.filter(
    (s) => s.status === LocationStatus.Occupied
  ).length;
});

const emptyCount = computed(() => {
  return warehouseStore.locationStatuses.filter(
    (s) => s.status === LocationStatus.Empty
  ).length;
});

const lockedCount = computed(() => {
  return warehouseStore.locationStatuses.filter(
    (s) => s.status === LocationStatus.Locked
  ).length;
});

const faultCount = computed(() => {
  return warehouseStore.locationStatuses.filter(
    (s) =>
      s.status === LocationStatus.Disabled || s.status === LocationStatus.Fault
  ).length;
});

const disabledCount = computed(() => {
  return warehouseStore.locationStatuses.filter(
    (s) => s.status === LocationStatus.Disabled
  ).length;
});

interface TreeNode {
  title: string;
  key: string;
  icon?: string;
  children?: TreeNode[];
  checkable?: boolean;
  isLeaf?: boolean;
  nodeType: string;
  nodeData?: any;
}

const treeData = computed<TreeNode[]>(() => {
  return warehouseStore.editingLayers.map((layer) => {
    const layerNode: TreeNode = {
      title: `${layer.layerName} `,
      key: `layer-${layer.layerId}`,
      icon: "🏢",
      nodeType: "layer",
      nodeData: layer,
      children: layer.warehouses.map((wh) => {
        const whNode: TreeNode = {
          title: `${wh.warehouseName}`,
          key: `warehouse-${wh.warehouseId}`,
          icon: "🏭",
          nodeType: "warehouse",
          nodeData: wh,
          children: wh.shelves.map((shelf) => {
            const shelfNode: TreeNode = {
              title: `${shelf.shelfName}`,
              key: `shelf-${shelf.shelfId}`,
              icon: "📦",
              nodeType: "shelf",
              nodeData: shelf,
              children: buildLocationNodes(shelf),
            };
            return shelfNode;
          }),
        };
        return whNode;
      }),
    };
    return layerNode;
  });
});

function buildLocationNodes(shelf: any): TreeNode[] {
  const nodes: TreeNode[] = [];
  for (let row = 1; row <= shelf.rows; row++) {
    for (let col = 1; col <= shelf.columns; col++) {
      for (let l = 1; l <= shelf.layers; l++) {
        const key = `${row}-${col}-${l}`;
        const code =
          shelf.customSlotCodes?.[key] ??
          `${shelf.shelfCode}-${String(row).padStart(2, "0")}-${String(
            col
          ).padStart(2, "0")}-${String(l).padStart(2, "0")}`;
        nodes.push({
          title: `${code}`,
          key: `location-${code}`,
          icon: "📍",
          nodeType: "location",
          nodeData: { code, shelfCode: shelf.shelfCode, row, col, layer: l },
          isLeaf: true,
          checkable: false,
        });
      }
    }
  }
  return nodes;
}

function handleTreeSelect(
  selectedKeys: string[],
  info: { node: { dataRef: TreeNode } }
): void {
  const TO_M = 1 / 1000;
  const node = info.node.dataRef;
  if (!node || !sceneManager) return;

  if (node.nodeType === "layer") {
    const layer = node.nodeData;
    const target = new THREE.Vector3(
      ((layer.warehouses[0]?.width ?? 0) / 2) * TO_M,
      (layer.zCoord ?? 0) * TO_M,
      ((layer.warehouses[0]?.length ?? 0) / 2) * TO_M
    );
    sceneManager.focusObject(target);
  } else if (node.nodeType === "warehouse") {
    const wh = node.nodeData;
    const layer = warehouseStore.editingLayers.find((l) =>
      l.warehouses.some((w) => w.warehouseId === wh.warehouseId)
    );
    const target = new THREE.Vector3(
      ((wh.offsetX ?? 0) + wh.width / 2) * TO_M,
      (layer?.zCoord ?? 0) * TO_M,
      ((wh.offsetY ?? 0) + wh.length / 2) * TO_M
    );
    sceneManager.focusObject(target);
  } else if (node.nodeType === "shelf") {
    const shelf = node.nodeData;
    const layer = warehouseStore.editingLayers.find((l) =>
      l.warehouses.some((w) =>
        w.shelves.some((s) => s.shelfId === shelf.shelfId)
      )
    );
    const wh = layer?.warehouses.find((w) =>
      w.shelves.some((s) => s.shelfId === shelf.shelfId)
    );
    const target = new THREE.Vector3(
      ((wh?.offsetX ?? 0) + shelf.position.x + shelf.width / 2) * TO_M,
      ((layer?.zCoord ?? 0) + shelf.position.y + shelf.height / 2) * TO_M,
      ((wh?.offsetY ?? 0) + shelf.position.z + shelf.depth / 2) * TO_M
    );
    sceneManager.focusObject(target);
  } else if (node.nodeType === "location") {
    const loc = node.nodeData;
    const layer = warehouseStore.editingLayers.find((l) =>
      l.warehouses.some((w) =>
        w.shelves.some((s) => s.shelfCode === loc.shelfCode)
      )
    );
    const wh = layer?.warehouses.find((w) =>
      w.shelves.some((s) => s.shelfCode === loc.shelfCode)
    );
    const shelf = wh?.shelves.find((s) => s.shelfCode === loc.shelfCode);
    if (shelf) {
      const halfW = shelf.width / 2;
      const halfD = shelf.depth / 2;
      const gapX =
        (shelf.width - shelf.rows * shelf.slotWidth) / (shelf.rows + 1);
      const gapZ =
        (shelf.depth - shelf.columns * shelf.slotDepth) / (shelf.columns + 1);
      const perLayerHeight = shelf.height / shelf.layers;
      const slotX = -halfW + gapX * loc.row + shelf.slotWidth * (loc.row - 0.5);
      const slotY = (loc.layer - 0.5) * perLayerHeight;
      const slotZ = halfD - gapZ * loc.col - shelf.slotDepth * (loc.col - 0.5);
      const target = new THREE.Vector3(
        ((wh?.offsetX ?? 0) + shelf.position.x + slotX) * TO_M,
        ((layer?.zCoord ?? 0) + shelf.position.y + slotY) * TO_M,
        ((wh?.offsetY ?? 0) + shelf.position.z + slotZ) * TO_M
      );
      sceneManager.focusObject(target);
    }

    if (locationManager) {
      const locCode =
        shelf?.customSlotCodes?.[`${loc.row}-${loc.col}-${loc.layer}`] ??
        `${shelf?.shelfCode ?? ""}-${String(loc.row).padStart(2, "0")}-${String(
          loc.col
        ).padStart(2, "0")}-${String(loc.layer).padStart(2, "0")}`;
      const locObj = locationManager.get(locCode);
      if (locObj && raycastManager) {
        raycastManager.selectLocation(locObj);
      }
    }
  }
}

function handleTreeCheck(
  checked: string[],
  info: { node: { dataRef: TreeNode } }
): void {
  checkedKeys.value = checked;
  const node = info.node.dataRef;
  if (!node || !sceneManager) return;

  if (node.nodeType === "layer") {
    const layerId = node.nodeData.layerId;
    const layerGroup = sceneManager
      .getScene()
      .children.find(
        (c) => c.userData?.type === "Layer" && c.userData?.layerId === layerId
      );
    if (layerGroup) {
      const isChecked = checked.includes(node.key);
      layerGroup.visible = isChecked;
      setChildrenVisibility(layerGroup, isChecked);
    }
  }
}

function setChildrenVisibility(group: THREE.Object3D, visible: boolean): void {
  group.traverse((child) => {
    child.visible = visible;
  });
}

function initAllCheckedKeys(): void {
  const keys: string[] = [];
  for (const layer of warehouseStore.editingLayers) {
    keys.push(`layer-${layer.layerId}`);
  }
  checkedKeys.value = keys;
  expandedKeys.value = keys;
}

function handleTreeContextMenu(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  const treeNode = target.closest(".ant-tree-treenode") as HTMLElement;
  if (!treeNode) return;

  const nodeContent = treeNode.querySelector(
    ".ant-tree-node-content-wrapper"
  ) as HTMLElement;
  if (!nodeContent) return;

  const titleEl = nodeContent.querySelector(".ant-tree-title");
  const key =
    titleEl?.getAttribute("data-node-key") ||
    nodeContent.getAttribute("data-node-key") ||
    treeNode.getAttribute("data-node-key");
  if (!key) return;

  const idx = checkedKeys.value.indexOf(key);
  if (idx >= 0) {
    checkedKeys.value.splice(idx, 1);
  } else {
    checkedKeys.value.push(key);
  }
}

function handleViewChange(view: string): void {
  sceneManager?.setView(view);
}

function handleFullscreen(): void {
  const el = canvasContainer.value?.parentElement;
  if (!el) return;
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    el.requestFullscreen();
  }
}

async function initWarehouse(): Promise<void> {
  warehouseStore.setLoading(true);

  let layers = warehouseStore.editingLayers;

  const hasRealData = layers.some((l) =>
    l.warehouses.some((w) => w.shelves.length > 0)
  );

  if (!hasRealData) {
    const config = await loadConfig();
    if (config) {
      layers = config.layers;
      if (layers.length > 0) {
        warehouseStore.initEditingLayers(layers);
      }
      if (config.screenTitle) {
        warehouseStore.screenTitle = config.screenTitle;
      }
      if (config.apiUrl) {
        warehouseStore.apiUrl = config.apiUrl;
      }
    }
  }

  if (layers.length === 0) {
    warehouseStore.setLoading(false);
    return;
  }

  async function loadConfig(): Promise<{
    layers: LayerConfig[];
    screenTitle?: string;
    apiUrl?: string;
  } | null> {
    try {
      const res = await fetch("/asset/warehouse-config.json");
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === "object") {
          if (Array.isArray(data.layers)) {
            return {
              layers: data.layers,
              screenTitle: data.screenTitle,
              apiUrl: data.apiUrl,
            };
          } else if (Array.isArray(data)) {
            return { layers: data };
          }
        }
      }
    } catch {
      // 部署配置文件加载失败，尝试 localStorage
    }

    const saved = localStorage.getItem("warehouse-layers");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.layers)) {
            return {
              layers: parsed.layers,
              screenTitle: parsed.screenTitle,
              apiUrl: parsed.apiUrl,
            };
          } else if (Array.isArray(parsed)) {
            return { layers: parsed };
          }
        }
      } catch {
        // ignore
      }
    }

    return null;
  }

  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 100));
  initScene();

  warehouseStore.setLoading(false);
}

function initScene(): void {
  if (!canvasContainer.value) return;

  locationManager = new LocationManager();
  const locationBuilder = new LocationBuilder(locationManager);
  selectionManager = new SelectionManager();
  warehouseBuilder = new LayerWarehouseBuilder(
    locationBuilder,
    locationManager
  );

  sceneManager = new WarehouseSceneManager(canvasContainer.value);
  sceneManager.initialize();
  warehouseBuilder.build(warehouseStore.editingLayers, sceneManager);

  raycastManager = new RaycastManager(
    locationManager,
    selectionManager,
    sceneManager.getCamera(),
    sceneManager.getDomElement()
  );
  raycastManager.enable();

  selectionManager.onSelectionChangeListener(handleSelectionChange);
  selectionManager.onHoverChangeListener(handleHoverChange);

  sceneManager.start();
  sceneManager.resize();
  window.addEventListener("resize", handleResize);

  initAllCheckedKeys();
  startStatusPolling();
}

function handleSelectionChange(locationObj: LocationObject | null): void {
  if (!locationObj) {
    warehouseStore.setSelectedLocationDetail(null);
    return;
  }

  let warehouseCode = "";
  let areaCode = "";
  for (const layer of warehouseStore.editingLayers) {
    for (const wh of layer.warehouses) {
      const shelf = wh.shelves.find(
        (s) => s.shelfCode === locationObj.shelfCode
      );
      if (shelf) {
        warehouseCode = wh.warehouseCode;
        areaCode = layer.layerCode;
        break;
      }
    }
    if (warehouseCode) break;
  }

  warehouseStore.setSelectedLocationDetail({
    locationCode: locationObj.locationCode,
    shelfCode: locationObj.shelfCode,
    row: locationObj.row,
    column: locationObj.column,
    layer: locationObj.layer,
    status: locationObj.status,
    quantity: locationObj.quantity,
    warehouseCode,
    areaCode,
  });
}

function handleHoverChange(_locationObj: LocationObject | null): void {
  // Hover state is handled visually by RaycastManager
}

function handleResize(): void {
  sceneManager?.resize();
}

async function fetchSlotStatuses(): Promise<void> {
  try {
    const statuses: LocationStatusDto[] = await apiProvider.getLocationStatuses(
      ""
    );
    if (locationManager) {
      locationManager.updateStatuses(statuses);
    }
    warehouseStore.setLocationStatuses(statuses);
  } catch {
    // 后端不可用时静默跳过，保持前端本地状态
  }
}

function startStatusPolling(): void {
  fetchSlotStatuses();
  statusPollTimer = setInterval(fetchSlotStatuses, STATUS_POLL_INTERVAL);
}

function stopStatusPolling(): void {
  if (statusPollTimer) {
    clearInterval(statusPollTimer);
    statusPollTimer = null;
  }
}

function destroy(): void {
  stopStatusPolling();
  window.removeEventListener("resize", handleResize);
  raycastManager?.dispose();
  selectionManager?.clear();
  locationManager?.clear();
  sceneManager?.destroy();
  sceneManager = null;
  locationManager = null;
  warehouseBuilder = null;
  raycastManager = null;
  selectionManager = null;
}

onMounted(() => {
  initWarehouse();
});

onUnmounted(() => {
  destroy();
});
</script>

<style scoped>
.warehouse-3d-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0b1829;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
    "PingFang SC", "Microsoft YaHei", sans-serif;
  position: relative;
}

.main-title-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 75px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 8px;
  gap: 20px;
  z-index: 5;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(18, 70, 90, 0.95) 0%,
    rgba(18, 70, 90, 0.6) 70%,
    transparent 100%
  );
}

.title-ornament {
  margin-top: -15px;
  width: 60px;
  height: 2px;
  border-radius: 1px;
  position: relative;
}

.title-ornament::before,
.title-ornament::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  transform: translateY(-50%);
}

.title-ornament.left {
  background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.6));
}

.title-ornament.left::before {
  left: 0;
  background: rgba(96, 165, 250, 0.8);
  box-shadow: 0 0 8px rgba(96, 165, 250, 0.6);
}

.title-ornament.right {
  background: linear-gradient(90deg, rgba(96, 165, 250, 0.6), transparent);
}

.title-ornament.right::after {
  right: 0;
  background: rgba(96, 165, 250, 0.8);
  box-shadow: 0 0 8px rgba(96, 165, 250, 0.6);
}

.title-text {
  margin-top: -15px;
  font-size: 2.2rem;
  font-weight: 700;
  color: #e2e8f0;
  letter-spacing: 0.08em;
  text-shadow: 0 0 30px rgba(96, 165, 250, 0.3);
  line-height: 1;
}

.warehouse-main {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.float-panels-container {
  position: absolute;
  top: 68px;
  left: 12px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: calc(100% - 80px);
}

.summary-float-panel {
  width: 260px;
  background: rgba(14, 60, 78, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(35, 90, 110, 0.8);
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.tree-float-panel {
  width: 260px;
  flex: 1;
  min-height: 200px;
  background: rgba(14, 60, 78, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(35, 90, 110, 0.8);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.summary-section {
  padding: 12px;
  border-bottom: 1px solid #1e293b;
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background 0.2s ease;
  flex-wrap: nowrap;
}

.summary-item svg {
  flex-shrink: 0;
}

.summary-item .item-label {
  white-space: nowrap;
}

.summary-item .item-value {
  white-space: nowrap;
  flex-shrink: 0;
}

.summary-item:hover {
  background: rgba(35, 90, 110, 0.3);
}

.summary-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-item.num-row {
  padding: 4px 8px;
  justify-content: flex-start;
  gap: 6px;
}

.summary-item.num-row .item-label {
  font-size: 12px;
  flex: 1;
}

.summary-item.num-row .item-value {
  font-size: 18px;
  margin-left: auto;
}

.summary-divider {
  height: 1px;
  background: rgba(35, 90, 110, 0.4);
  margin: 4px 8px;
}

.item-value {
  font-size: 18px;
  font-weight: 700;
  color: #e2e8f0;
  font-family: "SF Mono", "Cascadia Code", "Fira Code", monospace;
  line-height: 1;
  margin-left: auto;
}

.item-value.total-value {
  font-size: 28px;
  color: #60a5fa;
}

.item-value.occupied {
  color: #3b82f6;
}

.item-value.empty {
  color: #94a3b8;
}

.item-value.locked {
  color: #ff7a00;
}

.item-value.fault {
  color: #3b82f6;
}

.item-value.disabled-val {
  color: #8c8c8c;
}

.item-label {
  font-size: 12px;
  color: #94a3b8;
  letter-spacing: 0.02em;
}

.panel-title {
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: rgba(60, 150, 180, 0.06);
  border-bottom: 1px solid rgba(35, 90, 110, 0.5);
  display: flex;
  align-items: center;
}

.tree-float-panel :deep(.ant-tree) {
  background: transparent;
  color: #cbd5e1;
  padding: 6px 4px;
  flex: 1;
  overflow-y: auto;
}

.tree-float-panel :deep(.ant-tree .ant-tree-node-content-wrapper) {
  color: #cbd5e1;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.tree-float-panel :deep(.ant-tree .ant-tree-node-content-wrapper:hover) {
  background: rgba(96, 165, 250, 0.08);
  color: #e2e8f0;
}

.tree-float-panel :deep(.ant-tree .ant-tree-node-selected) {
  background: rgba(96, 165, 250, 0.15) !important;
  color: #60a5fa !important;
}

.tree-float-panel :deep(.ant-tree-treenode) {
  padding: 1px 0;
}

.tree-float-panel :deep(.ant-tree-switcher) {
  color: #64748b;
}

.tree-float-panel :deep(.ant-tree-checkbox-inner) {
  border-color: #475569;
  background: transparent;
}

.tree-float-panel :deep(.ant-tree-checkbox-checked .ant-tree-checkbox-inner) {
  background: #60a5fa;
  border-color: #60a5fa;
}

.warehouse-canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: radial-gradient(ellipse at center, #001a33 0%, #0b1829 100%);
}

.warehouse-canvas {
  width: 100%;
  height: 100%;
}

.float-panel-enter-active,
.float-panel-leave-active {
  transition: all 0.25s ease;
}

.float-panel-enter-from,
.float-panel-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
</style>