<template>
  <div class="konva-wrapper" ref="wrapperRef">
    <div class="ruler ruler--corner"></div>
    <div class="ruler ruler--top">
      <canvas ref="topRulerCanvasRef"></canvas>
    </div>
    <div class="ruler ruler--left">
      <canvas ref="leftRulerCanvasRef"></canvas>
    </div>
    <v-stage
      ref="stageRef"
      :config="stageConfig"
      @wheel="handleWheel"
      @mousedown="handleStageMouseDown"
      @mousemove="handleStageMouseMove"
      @mouseup="handleStageMouseUp"
      @click="handleStageClick"
    >
      <v-layer ref="gridLayerRef">
        <v-rect
          :config="{
            x: -stageX / stageScale - 100,
            y: -stageY / stageScale - 100,
            width: stageWidth / stageScale + 200,
            height: stageHeight / stageScale + 200,
            fill: '#1a1e24',
            listening: false,
          }"
        />
        <v-rect v-if="selectionRect" :config="selectionRect" />
      </v-layer>

      <v-layer ref="layerRef">
        <template v-if="store.isRootSelected">
          <template
            v-for="layerLayout in allLayersLayout"
            :key="layerLayout.layerId"
          >
            <v-group
              :config="{
                x: layerLayout.offsetX,
                y: layerLayout.offsetY,
                draggable: true,
              }"
              @dragstart="(e: any) => onLayerDragStart(layerLayout.layerId, layerLayout.offsetY, e)"
              @dragmove="(e: any) => onLayerDragMove(layerLayout.layerId, e)"
              @dragend="(e: any) => onLayerDragEnd(layerLayout.layerId, e)"
            >
              <v-rect
                :config="{
                  x: 0,
                  y: 0,
                  width: layerLayout.warehouseWidth,
                  height: layerLayout.layerHeightPx,
                  fill: '#2a3a2a',
                  stroke: '#5a8a5a',
                  strokeWidth: 2,
                  cornerRadius: 2,
                }"
              />
              <v-text
                :config="{
                  x: layerLayout.warehouseWidth / 2,
                  y: layerLayout.layerHeightPx / 2,
                  text: `${layerLayout.layerName} (Z:${layerLayout.zCoord}mm, 高${layerLayout.height}mm)`,
                  fontSize: 12,
                  fill: '#aaccaa',
                  align: 'center',
                  verticalAlign: 'middle',
                }"
              />
            </v-group>
          </template>
          <v-text
            v-if="allLayersLayout.length === 0"
            :config="emptyTextConfig"
          />
        </template>
        <template v-else>
          <v-group :config="layerGroupConfig">
            <template v-for="wh in warehouseLayouts" :key="wh.warehouseId">
              <v-group
                :config="warehouseGroupConfigs.get(wh.warehouseId)!"
                @mousedown="(e: any) => onWarehouseMouseDown(wh.warehouseId, e)"
                @dragstart="(e: any) => onWarehouseDragStart(wh.warehouseId, e)"
                @dragmove="(e: any) => onWarehouseDragMove(wh.warehouseId, e)"
                @dragend="(e: any) => onWarehouseDragEnd(wh.warehouseId, e)"
                @click="(e: any) => onWarehouseClick(wh.warehouseId, e)"
                @tap="(e: any) => onWarehouseClick(wh.warehouseId, e)"
              >
                <v-rect :config="getGroundConfig(wh)" />
                <v-text :config="getWarehouseLabelConfig(wh)" />
                <template
                  v-for="shelf in wh.shelves"
                  :key="shelf.shelfId"
                  v-memo="[
                    shelf.position.x,
                    shelf.position.z,
                    shelf.rotationY,
                    shelf.width,
                    shelf.depth,
                    shelf.height,
                    store.selectedShelfId,
                    store.selectedShelfIds,
                  ]"
                >
                  <v-group
                    :config="getShelfGroupConfig(shelf, 0, 0)"
                    :draggable="true"
                    @dragstart="(e: any) => onShelfDragStart(shelf.shelfId, e)"
                    @dragmove="(e: any) => onShelfDragMove(shelf.shelfId, 0, 0, e)"
                    @dragend="(e: any) => onShelfDragEnd(shelf.shelfId, 0, 0, e)"
                    @click="(e: any) => onShelfClick(shelf.shelfId, e)"
                    @tap="(e: any) => onShelfClick(shelf.shelfId, e)"
                  >
                    <v-rect :config="getShelfRectConfig(shelf)" />
                    <v-rect
                      v-for="slot in getShelfSlots(shelf)"
                      :key="slot.code"
                      :config="getSlotRectConfig(slot)"
                    />
                    <v-text
                      v-for="slot in getShelfSlots(shelf)"
                      :key="'t' + slot.code"
                      :config="getSlotTextConfig(slot)"
                    />
                  </v-group>
                </template>
                <v-line
                  v-for="(line, idx) in shelfGuideLines"
                  :key="'sg' + idx"
                  :config="line"
                />
              </v-group>
            </template>
          </v-group>

          <v-text
            v-if="warehouseLayouts.length === 0"
            :config="emptyTextConfig"
          />
        </template>
      </v-layer>

      <v-layer ref="guideLayerRef">
        <v-line v-for="(line, idx) in whGuideLines" :key="idx" :config="line" />
      </v-layer>
    </v-stage>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useWarehouseStore } from "@/stores/warehouse";
import type { ShelfConfig, WarehouseConfig } from "@/models/warehouse";
import { generateLocationCode } from "@/three/utils/LocationCodeGenerator";
import { Modal } from "ant-design-vue";

const SCALE = 0.2;
const WAREHOUSE_GAP = 2000;
const GRID_MM = 100;
const GRID_PX = GRID_MM * SCALE;
const SNAP_THRESHOLD_PX = 5;

const store = useWarehouseStore();
const wrapperRef = ref<HTMLDivElement>();
const stageRef = ref<any>(null);
const gridLayerRef = ref<any>(null);
const layerRef = ref<any>(null);
const guideLayerRef = ref<any>(null);
const topRulerCanvasRef = ref<HTMLCanvasElement>();
const leftRulerCanvasRef = ref<HTMLCanvasElement>();

const stageWidth = ref(800);
const stageHeight = ref(600);
const stageScale = ref(1);
const stageX = ref(0);
const stageY = ref(0);

const stageConfig = computed(() => ({
  width: stageWidth.value,
  height: stageHeight.value,
  scaleX: stageScale.value,
  scaleY: stageScale.value,
  x: stageX.value,
  y: stageY.value,
  draggable: false,
}));

interface WarehouseLayout {
  warehouseId: string;
  warehouseName: string;
  width: number;
  length: number;
  offsetX: number;
  offsetY: number;
  shelves: ShelfConfig[];
}

const warehouseLayouts = computed<WarehouseLayout[]>(() => {
  const layer = store.selectedLayer;
  if (!layer) return [];

  let autoOffsetX = 0;
  return layer.warehouses.map((w) => {
    const hasCustomPos = w.offsetX !== undefined || w.offsetY !== undefined;
    const ox = hasCustomPos ? (w.offsetX ?? 0) * SCALE : autoOffsetX;
    const oy = hasCustomPos ? (w.offsetY ?? 0) * SCALE : 0;
    const layout: WarehouseLayout = {
      warehouseId: w.warehouseId,
      warehouseName: w.warehouseName,
      width: w.width * SCALE,
      length: w.length * SCALE,
      offsetX: ox,
      offsetY: oy,
      shelves: w.shelves,
    };
    if (!hasCustomPos) {
      autoOffsetX += w.width * SCALE + WAREHOUSE_GAP * SCALE;
    }
    return layout;
  });
});

const warehouseGroupConfigs = computed(() => {
  const layer = store.selectedLayer;
  if (!layer)
    return new Map<
      string,
      { x: number; y: number; draggable: boolean; name: string }
    >();

  let autoOffsetX = 0;
  const map = new Map<
    string,
    { x: number; y: number; draggable: boolean; name: string }
  >();
  for (const w of layer.warehouses) {
    const hasCustomPos = w.offsetX !== undefined || w.offsetY !== undefined;
    const ox = hasCustomPos ? (w.offsetX ?? 0) * SCALE : autoOffsetX;
    const oy = hasCustomPos ? (w.offsetY ?? 0) * SCALE : 0;
    map.set(w.warehouseId, {
      x: ox,
      y: oy,
      draggable: !isDraggingShelf.value && shiftKeyDown.value,
      name: `warehouse-${w.warehouseId}`,
    });
    if (!hasCustomPos) {
      autoOffsetX += w.width * SCALE + WAREHOUSE_GAP * SCALE;
    }
  }
  return map;
});

interface LayerLayout {
  layerId: string;
  layerName: string;
  height: number;
  offsetX: number;
  offsetY: number;
  layerHeightPx: number;
  warehouseWidth: number;
  zCoord: number;
}

const FRONT_VIEW_SCALE = 0.2;

const allLayersLayout = computed<LayerLayout[]>(() => {
  const layers = store.editingLayers;

  return layers.map((layer) => {
    const maxWhWidth = Math.max(
      ...layer.warehouses.map((w) => w.width * FRONT_VIEW_SCALE),
      0
    );
    const layerH = layer.height * FRONT_VIEW_SCALE;
    const ox = (layer.offsetX ?? 0) * FRONT_VIEW_SCALE;
    const oy = -(layer.zCoord ?? 0) * FRONT_VIEW_SCALE;

    return {
      layerId: layer.layerId,
      layerName: layer.layerName,
      height: layer.height,
      offsetX: ox,
      offsetY: oy,
      layerHeightPx: layerH,
      warehouseWidth: maxWhWidth || 2000 * FRONT_VIEW_SCALE,
      zCoord: layer.zCoord ?? 0,
    };
  });
});

const layerGroupConfig = computed(() => {
  const layer = store.selectedLayer;
  return {
    x: (layer?.offsetX ?? 0) * SCALE,
    y: (layer?.offsetY ?? 0) * SCALE,
  };
});

function getGroundConfig(wh: WarehouseLayout) {
  const isSelected = store.selectedWarehouseId === wh.warehouseId;
  const isCollision = warehouseCollisionId.value === wh.warehouseId;
  return {
    x: 0,
    y: 0,
    width: wh.width,
    height: wh.length,
    fill: isCollision ? "#6a2020" : isSelected ? "#2a4a2a" : "#2a3a2a",
    fillAlpha: 0.7,
    stroke: isCollision ? "#ff4040" : isSelected ? "#6ab0e0" : "#68a068",
    strokeWidth: isCollision ? 3 : isSelected ? 3 : 2,
    dash: isSelected ? [] : [8, 4],
    shadowColor: isCollision
      ? "#ff4040"
      : isSelected
      ? "#4a8ab5"
      : "transparent",
    shadowBlur: isCollision ? 12 : isSelected ? 8 : 0,
  };
}

function getWarehouseLabelConfig(wh: WarehouseLayout) {
  const fontSize = Math.max(11, Math.min(16, wh.width / 40));
  return {
    x: wh.width / 2,
    y: wh.length + 8,
    text: wh.warehouseName,
    fontSize,
    fill: "#aabbcc",
    align: "center",
    verticalAlign: "top",
  };
}

const emptyTextConfig = computed(() => ({
  x: stageWidth.value / 2 - 120,
  y: stageHeight.value / 2 - 10,
  text: "请选择或创建层与仓库",
  fontSize: 20,
  fill: "#556677",
  align: "center",
}));

interface SlotInfo {
  code: string;
  row: number;
  col: number;
  layer: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

function getShelfSlots(shelf: ShelfConfig): SlotInfo[] {
  const slots: SlotInfo[] = [];
  const visualW = shelf.width;
  const visualD = shelf.depth;
  const sw = shelf.slotWidth * SCALE;
  const sh = shelf.slotDepth * SCALE;
  const gapX = (visualW * SCALE - shelf.rows * sw) / (shelf.rows + 1);
  const gapY = (visualD * SCALE - shelf.columns * sh) / (shelf.columns + 1);

  for (let row = 1; row <= shelf.rows; row++) {
    for (let col = 1; col <= shelf.columns; col++) {
      const x = gapX * row + sw * (row - 0.5);
      const y = gapY * col + sh * (col - 0.5);
      const key = `${row}-${col}-1`;
      const code =
        shelf.customSlotCodes?.[key] ??
        generateLocationCode({
          shelfCode: shelf.shelfCode,
          row,
          column: col,
          layer: 1,
        });
      slots.push({
        code,
        row,
        col,
        layer: 1,
        x,
        y,
        w: sw,
        h: sh,
      });
    }
  }
  return slots;
}

function getShelfGroupConfig(
  shelf: ShelfConfig,
  _offsetX: number,
  _offsetY: number
) {
  return {
    x: shelf.position.x * SCALE,
    y: shelf.position.z * SCALE,
    rotation: shelf.rotationY,
    name: `shelf-${shelf.shelfId}`,
  };
}

function getShelfRectConfig(shelf: ShelfConfig) {
  const isSelected = store.selectedShelfIds.has(shelf.shelfId);
  const isCollision = collisionShelfId.value === shelf.shelfId;
  return {
    x: 0,
    y: 0,
    width: shelf.width * SCALE,
    height: shelf.depth * SCALE,
    fill: isCollision ? "#6a2020" : isSelected ? "#3a6a9a" : "#2a3a4a",
    stroke: isCollision ? "#ff4040" : isSelected ? "#6ab0e0" : "#5a8ab0",
    strokeWidth: isCollision ? 3 : isSelected ? 3 : 2,
    cornerRadius: 3,
    shadowColor: isCollision
      ? "#ff4040"
      : isSelected
      ? "#4a8ab5"
      : "transparent",
    shadowBlur: isCollision ? 12 : isSelected ? 8 : 0,
  };
}

function getSlotRectConfig(slot: SlotInfo) {
  return {
    x: slot.x - slot.w / 2,
    y: slot.y - slot.h / 2,
    width: slot.w,
    height: slot.h,
    fill: "#1e2e2e",
    stroke: "#4a6a4a",
    strokeWidth: 1,
  };
}

function getSlotTextConfig(slot: SlotInfo) {
  const fontSize = Math.max(10, Math.min(13, slot.w / 7));
  return {
    x: slot.x - slot.w / 2,
    y: slot.y,
    width: slot.w,
    text: slot.code,
    fontSize,
    fill: "#cceecc",
    align: "center",
    verticalAlign: "middle",
  };
}

const shelfGuideLines = ref<any[]>([]);
const whGuideLines = ref<any[]>([]);
const draggingShelfId = ref<string | null>(null);
const draggingLayerId = ref<string | null>(null);
const isDraggingShelf = ref(false);
const shiftKeyDown = ref(false);
const multiDragStartPositions = ref<Map<string, { x: number; z: number }>>(
  new Map()
);
const collisionShelfId = ref<string | null>(null);
const warehouseCollisionId = ref<string | null>(null);
const lastValidPos = ref<{ x: number; y: number } | null>(null);
const lastValidWhPos = ref<{ x: number; y: number } | null>(null);

function snapToGrid(value: number): number {
  return Math.round(value / GRID_MM) * GRID_MM;
}

interface ShelfEdge {
  shelfId: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function getShelfAABB(
  shelf: ShelfConfig,
  nodeX?: number,
  nodeY?: number
): ShelfEdge {
  const x = nodeX !== undefined ? nodeX : shelf.position.x * SCALE;
  const y = nodeY !== undefined ? nodeY : shelf.position.z * SCALE;
  const w = shelf.width * SCALE;
  const d = shelf.depth * SCALE;
  const angle = ((shelf.rotationY ?? 0) * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const corners = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: 0, y: d },
    { x: w, y: d },
  ];

  const worldCorners = corners.map((c) => ({
    x: x + c.x * cos - c.y * sin,
    y: y + c.x * sin + c.y * cos,
  }));

  return {
    shelfId: shelf.shelfId,
    left: Math.min(...worldCorners.map((c) => c.x)),
    right: Math.max(...worldCorners.map((c) => c.x)),
    top: Math.min(...worldCorners.map((c) => c.y)),
    bottom: Math.max(...worldCorners.map((c) => c.y)),
  };
}

interface AlignmentResult {
  lines: any[];
  snapX: number | null;
  snapY: number | null;
  snapTargetX: number | null;
  snapTargetY: number | null;
}

function detectAlignment(
  draggedEdges: ShelfEdge,
  wh: WarehouseLayout
): AlignmentResult {
  const lines: any[] = [];
  const threshold = SNAP_THRESHOLD_PX;

  const otherShelves = wh.shelves.filter(
    (s) => s.shelfId !== draggedEdges.shelfId
  );

  const verticalTargets: Array<{ x: number; y1: number; y2: number }> = [];
  const horizontalTargets: Array<{ y: number; x1: number; x2: number }> = [];

  verticalTargets.push({
    x: 0,
    y1: 0,
    y2: wh.length,
  });
  verticalTargets.push({
    x: wh.width,
    y1: 0,
    y2: wh.length,
  });

  for (const shelf of otherShelves) {
    const edges = getShelfAABB(shelf);
    verticalTargets.push({ x: edges.left, y1: edges.top, y2: edges.bottom });
    verticalTargets.push({ x: edges.right, y1: edges.top, y2: edges.bottom });
    horizontalTargets.push({ y: edges.top, x1: edges.left, x2: edges.right });
    horizontalTargets.push({
      y: edges.bottom,
      x1: edges.left,
      x2: edges.right,
    });
  }

  const draggedX = [draggedEdges.left, draggedEdges.right];
  const draggedY = [draggedEdges.top, draggedEdges.bottom];

  let snapX: number | null = null;
  let snapY: number | null = null;
  let snapTargetX: number | null = null;
  let snapTargetY: number | null = null;

  for (const target of verticalTargets) {
    for (const dx of draggedX) {
      const dist = dx - target.x;
      if (Math.abs(dist) < threshold) {
        snapX = draggedEdges.left - dist;
        snapTargetX = target.x;
        lines.push({
          points: [
            target.x,
            Math.min(target.y1, draggedEdges.top),
            target.x,
            Math.max(target.y2, draggedEdges.bottom),
          ],
          stroke: "#ff6b6b",
          strokeWidth: 2,
          listening: false,
        });
        break;
      }
    }
    if (snapX !== null) break;
  }

  for (const target of horizontalTargets) {
    for (const dy of draggedY) {
      const dist = dy - target.y;
      if (Math.abs(dist) < threshold) {
        snapY = draggedEdges.top - dist;
        snapTargetY = target.y;
        lines.push({
          points: [
            Math.min(target.x1, draggedEdges.left),
            target.y,
            Math.max(target.x2, draggedEdges.right),
            target.y,
          ],
          stroke: "#ff6b6b",
          strokeWidth: 2,
          listening: false,
        });
        break;
      }
    }
    if (snapY !== null) break;
  }

  return { lines, snapX, snapY, snapTargetX, snapTargetY };
}

function onShelfDragStart(shelfId: string, e: any): void {
  e.cancelBubble = true;
  e.evt?.stopPropagation();
  isSelecting.value = false;
  draggingShelfId.value = shelfId;
  isDraggingShelf.value = true;
  const node = e.target;
  lastValidPos.value = { x: node.x(), y: node.y() };

  if (store.selectedShelfIds.has(shelfId) && store.selectedShelfIds.size > 1) {
    multiDragStartPositions.value = new Map<string, { x: number; z: number }>();
    const wh = store.selectedWarehouse;
    if (wh) {
      store.selectedShelfIds.forEach((id) => {
        const s = wh.shelves.find((s) => s.shelfId === id);
        if (s) {
          multiDragStartPositions.value.set(id, {
            x: s.position.x,
            z: s.position.z,
          });
        }
      });
    }
  }
}

function onLayerDragStart(layerId: string, _baseY: number, _e: any): void {
  draggingLayerId.value = layerId;
}

function onLayerDragMove(layerId: string, e: any): void {
  const node = e.target;
  const newX = Math.round(node.x() / FRONT_VIEW_SCALE);
  const newY = Math.round(node.y() / FRONT_VIEW_SCALE);
  const snap = detectLayerAlignment(layerId, newX, newY);
  if (snap.snapX !== null) {
    node.x(snap.snapX * FRONT_VIEW_SCALE);
  }
  if (snap.snapY !== null) {
    node.y(snap.snapY * FRONT_VIEW_SCALE);
  }
  // 水平拖拽 → offsetX
  store.setLayerPosition(layerId, snap.snapX ?? newX);
  // 垂直拖拽 → zCoord（3D 高度）
  const finalY = snap.snapY ?? newY;
  store.setLayerZCoord(layerId, Math.max(0, -finalY));
  whGuideLines.value = snap.lines;
}

function onLayerDragEnd(layerId: string, _e: any): void {
  const node = _e.target;
  const newX = Math.round(node.x() / FRONT_VIEW_SCALE);
  const newY = Math.round(node.y() / FRONT_VIEW_SCALE);
  const snap = detectLayerAlignment(layerId, newX, newY);
  store.setLayerPosition(layerId, snap.snapX ?? newX);
  store.setLayerZCoord(layerId, Math.max(0, -(snap.snapY ?? newY)));
  whGuideLines.value = [];
  draggingLayerId.value = null;
}

function detectLayerAlignment(
  draggedLayerId: string,
  draggedX: number,
  draggedY: number
): { lines: any[]; snapX: number | null; snapY: number | null } {
  const lines: any[] = [];
  const thresholdMm = SNAP_THRESHOLD_PX / FRONT_VIEW_SCALE;
  const draggedLayer = allLayersLayout.value.find(
    (l) => l.layerId === draggedLayerId
  );
  if (!draggedLayer) return { lines, snapX: null, snapY: null };

  const draggedLeft = draggedX;
  const draggedRight =
    draggedX + draggedLayer.warehouseWidth / FRONT_VIEW_SCALE;
  const draggedTop = draggedY;
  const draggedBottom =
    draggedY + draggedLayer.layerHeightPx / FRONT_VIEW_SCALE;

  let snapX: number | null = null;
  let snapY: number | null = null;

  const otherLayers = allLayersLayout.value.filter(
    (l) => l.layerId !== draggedLayerId
  );

  for (const other of otherLayers) {
    const otherLeft = other.offsetX / FRONT_VIEW_SCALE;
    const otherRight = otherLeft + other.warehouseWidth / FRONT_VIEW_SCALE;
    const otherTop = other.offsetY / FRONT_VIEW_SCALE;
    const otherBottom = otherTop + other.layerHeightPx / FRONT_VIEW_SCALE;

    if (snapX === null) {
      if (Math.abs(draggedLeft - otherLeft) < thresholdMm) {
        snapX = otherLeft;
        lines.push({
          points: [
            otherLeft * FRONT_VIEW_SCALE,
            Math.min(draggedTop, otherTop) * FRONT_VIEW_SCALE,
            otherLeft * FRONT_VIEW_SCALE,
            Math.max(draggedBottom, otherBottom) * FRONT_VIEW_SCALE,
          ],
          stroke: "#ff6b6b",
          strokeWidth: 2,
          listening: false,
        });
      } else if (Math.abs(draggedRight - otherRight) < thresholdMm) {
        snapX = otherRight - draggedLayer.warehouseWidth / FRONT_VIEW_SCALE;
        lines.push({
          points: [
            otherRight * FRONT_VIEW_SCALE,
            Math.min(draggedTop, otherTop) * FRONT_VIEW_SCALE,
            otherRight * FRONT_VIEW_SCALE,
            Math.max(draggedBottom, otherBottom) * FRONT_VIEW_SCALE,
          ],
          stroke: "#ff6b6b",
          strokeWidth: 2,
          listening: false,
        });
      }
    }

    if (snapY === null) {
      if (Math.abs(draggedTop - otherTop) < thresholdMm) {
        snapY = otherTop;
        lines.push({
          points: [
            Math.min(draggedLeft, otherLeft) * FRONT_VIEW_SCALE,
            otherTop * FRONT_VIEW_SCALE,
            Math.max(draggedRight, otherRight) * FRONT_VIEW_SCALE,
            otherTop * FRONT_VIEW_SCALE,
          ],
          stroke: "#ff6b6b",
          strokeWidth: 2,
          listening: false,
        });
      } else if (Math.abs(draggedBottom - otherBottom) < thresholdMm) {
        snapY = otherBottom - draggedLayer.layerHeightPx / FRONT_VIEW_SCALE;
        lines.push({
          points: [
            Math.min(draggedLeft, otherLeft) * FRONT_VIEW_SCALE,
            otherBottom * FRONT_VIEW_SCALE,
            Math.max(draggedRight, otherRight) * FRONT_VIEW_SCALE,
            otherBottom * FRONT_VIEW_SCALE,
          ],
          stroke: "#ff6b6b",
          strokeWidth: 2,
          listening: false,
        });
      }
    }
  }

  return { lines, snapX, snapY };
}

function clampShelfToWarehouse(
  shelf: ShelfConfig,
  wh: WarehouseLayout,
  nodeX: number,
  nodeY: number
): { x: number; y: number } {
  const aabb = getShelfAABB(shelf, nodeX, nodeY);

  let dx = 0;
  let dy = 0;
  if (aabb.left < 0) dx = -aabb.left;
  if (aabb.right > wh.width) dx = wh.width - aabb.right;
  if (aabb.top < 0) dy = -aabb.top;
  if (aabb.bottom > wh.length) dy = wh.length - aabb.bottom;

  return { x: nodeX + dx, y: nodeY + dy };
}

function detectShelfCollision(
  shelfId: string,
  wh: WarehouseLayout,
  nodeX: number,
  nodeY: number
): string | null {
  const shelf = wh.shelves.find((s) => s.shelfId === shelfId);
  if (!shelf) return null;

  const draggedAABB = getShelfAABB(shelf, nodeX, nodeY);

  for (const other of wh.shelves) {
    if (other.shelfId === shelfId) continue;

    const otherAABB = getShelfAABB(other);

    if (
      draggedAABB.left < otherAABB.right &&
      draggedAABB.right > otherAABB.left &&
      draggedAABB.top < otherAABB.bottom &&
      draggedAABB.bottom > otherAABB.top
    ) {
      return other.shelfId;
    }
  }

  return null;
}

function getWarehouseAABB(
  wh: WarehouseLayout,
  nodeX?: number,
  nodeY?: number
): ShelfEdge {
  const x = nodeX !== undefined ? nodeX : wh.offsetX;
  const y = nodeY !== undefined ? nodeY : wh.offsetY;
  return {
    shelfId: wh.warehouseId,
    left: x,
    right: x + wh.width,
    top: y,
    bottom: y + wh.length,
  };
}

function detectWarehouseCollision(
  warehouseId: string,
  nodeX: number,
  nodeY: number
): string | null {
  const draggedAABB = getWarehouseAABB(
    warehouseLayouts.value.find((w) => w.warehouseId === warehouseId)!,
    nodeX,
    nodeY
  );

  for (const other of warehouseLayouts.value) {
    if (other.warehouseId === warehouseId) continue;

    const otherAABB = getWarehouseAABB(other);

    if (
      draggedAABB.left < otherAABB.right &&
      draggedAABB.right > otherAABB.left &&
      draggedAABB.top < otherAABB.bottom &&
      draggedAABB.bottom > otherAABB.top
    ) {
      return other.warehouseId;
    }
  }

  return null;
}

function detectWarehouseAlignment(
  warehouseId: string,
  nodeX: number,
  nodeY: number
): AlignmentResult {
  const lines: any[] = [];
  const threshold = SNAP_THRESHOLD_PX;

  const draggedAABB = getWarehouseAABB(
    warehouseLayouts.value.find((w) => w.warehouseId === warehouseId)!,
    nodeX,
    nodeY
  );

  const otherWhs = warehouseLayouts.value.filter(
    (w) => w.warehouseId !== warehouseId
  );

  const verticalTargets: Array<{ x: number; y1: number; y2: number }> = [];
  const horizontalTargets: Array<{ y: number; x1: number; x2: number }> = [];

  for (const other of otherWhs) {
    const aabb = getWarehouseAABB(other);
    verticalTargets.push({ x: aabb.left, y1: aabb.top, y2: aabb.bottom });
    verticalTargets.push({ x: aabb.right, y1: aabb.top, y2: aabb.bottom });
    horizontalTargets.push({ y: aabb.top, x1: aabb.left, x2: aabb.right });
    horizontalTargets.push({ y: aabb.bottom, x1: aabb.left, x2: aabb.right });
  }

  let snapX: number | null = null;
  let snapY: number | null = null;

  for (const target of verticalTargets) {
    for (const dx of [draggedAABB.left, draggedAABB.right]) {
      if (Math.abs(dx - target.x) < threshold) {
        snapX = nodeX - (dx - target.x);
        lines.push({
          points: [
            target.x,
            Math.min(target.y1, draggedAABB.top),
            target.x,
            Math.max(target.y2, draggedAABB.bottom),
          ],
          stroke: "#ff6b6b",
          strokeWidth: 2,
          listening: false,
        });
        break;
      }
    }
    if (snapX !== null) break;
  }

  for (const target of horizontalTargets) {
    for (const dy of [draggedAABB.top, draggedAABB.bottom]) {
      if (Math.abs(dy - target.y) < threshold) {
        snapY = nodeY - (dy - target.y);
        lines.push({
          points: [
            Math.min(target.x1, draggedAABB.left),
            target.y,
            Math.max(target.x2, draggedAABB.right),
            target.y,
          ],
          stroke: "#ff6b6b",
          strokeWidth: 2,
          listening: false,
        });
        break;
      }
    }
    if (snapY !== null) break;
  }

  return { lines, snapX, snapY, snapTargetX: null, snapTargetY: null };
}

function onShelfDragMove(
  shelfId: string,
  offsetX: number,
  offsetY: number,
  e: any
): void {
  const node = e.target;
  const wh = warehouseLayouts.value.find((w) =>
    w.shelves.some((s) => s.shelfId === shelfId)
  );
  if (!wh) return;

  const shelf = wh.shelves.find((s) => s.shelfId === shelfId);
  if (!shelf) return;

  const clamped = clampShelfToWarehouse(shelf, wh, node.x(), node.y());
  node.x(clamped.x);
  node.y(clamped.y);

  const collided = detectShelfCollision(shelfId, wh, node.x(), node.y());
  collisionShelfId.value = collided;

  const draggedEdges = getShelfAABB(shelf, node.x(), node.y());

  const result = detectAlignment(draggedEdges, wh);
  shelfGuideLines.value = result.lines;

  if (result.snapX !== null) {
    node.x(result.snapX);
  }
  if (result.snapY !== null) {
    node.y(result.snapY);
  }

  const gridX = snapToGrid(node.x() / SCALE);
  const gridY = snapToGrid(node.y() / SCALE);
  node.x(gridX * SCALE);
  node.y(gridY * SCALE);

  store.updateShelf(shelfId, {
    position: {
      x: gridX,
      y: 0,
      z: gridY,
    },
  });

  if (multiDragStartPositions.value.size > 1) {
    const startPos = multiDragStartPositions.value.get(shelfId);
    if (startPos) {
      const deltaX = gridX - startPos.x;
      const deltaZ = gridY - startPos.z;
      multiDragStartPositions.value.forEach((pos, id) => {
        if (id !== shelfId) {
          store.updateShelf(id, {
            position: {
              x: pos.x + deltaX,
              y: 0,
              z: pos.z + deltaZ,
            },
          });
        }
      });
    }
  }
}

function onShelfDragEnd(
  shelfId: string,
  _offsetX: number,
  _offsetY: number,
  e: any
): void {
  const node = e.target;
  const wh = warehouseLayouts.value.find((w) =>
    w.shelves.some((s) => s.shelfId === shelfId)
  );
  if (!wh) return;

  const shelf = wh.shelves.find((s) => s.shelfId === shelfId);
  if (!shelf) return;

  if (collisionShelfId.value) {
    collisionShelfId.value = null;
    if (lastValidPos.value) {
      node.x(lastValidPos.value.x);
      node.y(lastValidPos.value.y);
    }
  }

  // 最终位置在 onShelfDragMove 中已实时同步到 store，这里只做最终确认
  const rawX = node.x() / SCALE;
  const rawZ = node.y() / SCALE;
  const snappedX = snapToGrid(rawX);
  const snappedZ = snapToGrid(rawZ);

  node.x(snappedX * SCALE);
  node.y(snappedZ * SCALE);

  store.updateShelf(shelfId, {
    position: {
      x: snappedX,
      y: 0,
      z: snappedZ,
    },
  });

  // 延迟清除拖拽状态，让 Vue 重渲染在节点位置稳定后发生
  requestAnimationFrame(() => {
    draggingShelfId.value = null;
    isDraggingShelf.value = false;
    shelfGuideLines.value = [];
    multiDragStartPositions.value = new Map();
  });
}

function onShelfClick(shelfId: string, e: any): void {
  if (justDrewRect.value) {
    justDrewRect.value = false;
    return;
  }
  e.cancelBubble = true;
  const ctrl = e.evt?.ctrlKey || e.evt?.metaKey;
  if (ctrl) {
    if (store.selectedShelfIds.has(shelfId)) {
      const next = new Set(store.selectedShelfIds);
      next.delete(shelfId);
      store.selectShelves([...next]);
    } else {
      store.selectShelves([...store.selectedShelfIds, shelfId]);
    }
  } else {
    store.selectShelf(shelfId);
  }
}

function onWarehouseClick(warehouseId: string, e: any): void {
  if (justDrewRect.value) {
    justDrewRect.value = false;
    return;
  }
  e.cancelBubble = true;
  store.selectWarehouse(warehouseId);
}

function onWarehouseMouseDown(warehouseId: string, e: any): void {
  if (e.evt.button !== 0) return;
  e.cancelBubble = true;
  store.selectWarehouse(warehouseId);
  isSelecting.value = true;
  const stage = stageRef.value?.getStage();
  if (!stage) return;
  const pos = stage.getPointerPosition();
  if (!pos) return;
  selectStartX.value = (pos.x - stageX.value) / stageScale.value;
  selectStartY.value = (pos.y - stageY.value) / stageScale.value;
  selectEndX.value = selectStartX.value;
  selectEndY.value = selectStartY.value;
}

// ─── 仓库拖拽 ───────────────────────────────────────────

const draggingWarehouseId = ref<string | null>(null);

function onWarehouseDragStart(warehouseId: string, e: any): void {
  if (isDraggingShelf.value) return;
  e.cancelBubble = true;
  draggingWarehouseId.value = warehouseId;
  store.selectWarehouse(warehouseId);
  const node = e.target;
  lastValidWhPos.value = { x: node.x(), y: node.y() };
}

function onWarehouseDragMove(warehouseId: string, e: any): void {
  if (isDraggingShelf.value) return;
  const node = e.target;

  const collided = detectWarehouseCollision(warehouseId, node.x(), node.y());
  warehouseCollisionId.value = collided;

  const alignment = detectWarehouseAlignment(warehouseId, node.x(), node.y());
  whGuideLines.value = alignment.lines;

  if (alignment.snapX !== null) {
    node.x(alignment.snapX);
  }
  if (alignment.snapY !== null) {
    node.y(alignment.snapY);
  }

  const rawX = Math.round(node.x() / SCALE);
  const rawY = Math.round(node.y() / SCALE);
  store.setWarehousePosition(snapToGrid(rawX), snapToGrid(rawY));
}

function onWarehouseDragEnd(_warehouseId: string, _e: any): void {
  if (isDraggingShelf.value) return;
  const node = _e.target;

  if (warehouseCollisionId.value) {
    warehouseCollisionId.value = null;
    if (lastValidWhPos.value) {
      node.x(lastValidWhPos.value.x);
      node.y(lastValidWhPos.value.y);
    }
  }

  draggingWarehouseId.value = null;
  whGuideLines.value = [];
  lastValidWhPos.value = null;

  const rawX = Math.round(node.x() / SCALE);
  const rawY = Math.round(node.y() / SCALE);
  store.setWarehousePosition(snapToGrid(rawX), snapToGrid(rawY));
}

// ─── 画布平移 / 框选 ─────────────────────────────────

const isPanning = ref(false);
const panStartX = ref(0);
const panStartY = ref(0);

const isSelecting = ref(false);
const selectStartX = ref(0);
const selectStartY = ref(0);
const selectEndX = ref(0);
const selectEndY = ref(0);
const justDrewRect = ref(false);

const selectionRect = computed(() => {
  if (!isSelecting.value) return null;
  const x = Math.min(selectStartX.value, selectEndX.value);
  const y = Math.min(selectStartY.value, selectEndY.value);
  const w = Math.abs(selectEndX.value - selectStartX.value);
  const h = Math.abs(selectEndY.value - selectStartY.value);
  return {
    x,
    y,
    width: w,
    height: h,
    fill: "rgba(64, 150, 255, 0.15)",
    stroke: "rgba(64, 150, 255, 0.6)",
    strokeWidth: 1,
    dash: [4, 4],
    listening: false,
  };
});

function handleStageMouseDown(e: any): void {
  if (e.evt.button === 1) {
    e.evt.preventDefault();
    isPanning.value = true;
    panStartX.value = e.evt.clientX - stageX.value;
    panStartY.value = e.evt.clientY - stageY.value;
    if (wrapperRef.value) {
      wrapperRef.value.style.cursor = "grabbing";
    }
    return;
  }

  if (e.evt.button === 0) {
    const stage = stageRef.value?.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    isSelecting.value = true;
    selectStartX.value = (pos.x - stageX.value) / stageScale.value;
    selectStartY.value = (pos.y - stageY.value) / stageScale.value;
    selectEndX.value = selectStartX.value;
    selectEndY.value = selectStartY.value;
  }
}

function handleStageMouseMove(e: any): void {
  if (isPanning.value) {
    e.evt.preventDefault();
    stageX.value = e.evt.clientX - panStartX.value;
    stageY.value = e.evt.clientY - panStartY.value;
    return;
  }

  if (isSelecting.value) {
    const stage = stageRef.value?.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    selectEndX.value = (pos.x - stageX.value) / stageScale.value;
    selectEndY.value = (pos.y - stageY.value) / stageScale.value;
  }
}

function handleStageMouseUp(): void {
  if (isPanning.value) {
    endPanning();
    return;
  }

  if (isSelecting.value) {
    isSelecting.value = false;
    const selectW = Math.abs(selectEndX.value - selectStartX.value);
    const selectH = Math.abs(selectEndY.value - selectStartY.value);
    if (selectW > 5 || selectH > 5) {
      justDrewRect.value = true;
      const rect = selectionRect.value;
      if (rect) {
        const selectedIds: string[] = [];
        const layerGroupX = (store.selectedLayer?.offsetX ?? 0) * SCALE;
        const layerGroupY = (store.selectedLayer?.offsetY ?? 0) * SCALE;
        const wh = store.selectedWarehouse;
        if (wh) {
          const whLayout = warehouseLayouts.value.find(
            (w) => w.warehouseId === wh.warehouseId
          );
          const whOffsetX = whLayout
            ? whLayout.offsetX
            : (wh.offsetX ?? 0) * SCALE;
          const whOffsetY = whLayout
            ? whLayout.offsetY
            : (wh.offsetY ?? 0) * SCALE;
          for (const shelf of wh.shelves) {
            const sx = layerGroupX + whOffsetX + shelf.position.x * SCALE;
            const sz = layerGroupY + whOffsetY + shelf.position.z * SCALE;
            const sw = shelf.width * SCALE;
            const sd = shelf.depth * SCALE;
            const rx = rect.x;
            const ry = rect.y;
            const rw = rect.width;
            const rh = rect.height;
            if (sx + sw > rx && sx < rx + rw && sz + sd > ry && sz < ry + rh) {
              selectedIds.push(shelf.shelfId);
            }
          }
        }
        store.selectShelves(selectedIds);
      }
    }
    selectEndX.value = selectStartX.value;
    selectEndY.value = selectStartY.value;
  }
}

function handleGlobalMouseUp(): void {
  endPanning();
  if (isSelecting.value) {
    handleStageMouseUp();
  }
}

function handleKeyDown(e: KeyboardEvent): void {
  if (e.key === "Shift") {
    shiftKeyDown.value = true;
    if (wrapperRef.value) {
      wrapperRef.value.style.cursor = "grab";
    }
  }

  if (e.key === "Delete") {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }
    e.preventDefault();

    if (store.selectedShelfIds.size > 1) {
      Modal.confirm({
        title: "确认删除",
        content: `确定要删除选中的 ${store.selectedShelfIds.size} 个货架吗？`,
        okText: "删除",
        okType: "danger",
        cancelText: "取消",
        onOk: () => {
          store.deleteSelectedNode();
        },
      });
    } else if (store.selectedShelf) {
      Modal.confirm({
        title: "确认删除",
        content: `确定要删除货架「${store.selectedShelf.shelfName}」吗？`,
        okText: "删除",
        okType: "danger",
        cancelText: "取消",
        onOk: () => {
          store.deleteSelectedNode();
        },
      });
    } else if (store.selectedWarehouse) {
      Modal.confirm({
        title: "确认删除",
        content: `确定要删除仓库「${store.selectedWarehouse.warehouseName}」吗？\n仓库下的所有货架也将被删除。`,
        okText: "删除",
        okType: "danger",
        cancelText: "取消",
        onOk: () => {
          store.deleteSelectedNode();
        },
      });
    } else if (store.selectedLayer) {
      Modal.confirm({
        title: "确认删除",
        content: `确定要删除「${store.selectedLayer.layerName}」吗？\n该层下的所有仓库和货架也将被删除。`,
        okText: "删除",
        okType: "danger",
        cancelText: "取消",
        onOk: () => {
          store.deleteSelectedNode();
        },
      });
    }
  }

  const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  if (arrowKeys.includes(e.key) && store.selectedShelfIds.size > 0) {
    e.preventDefault();
    const step = 100;
    let dx = 0;
    let dz = 0;
    if (e.key === "ArrowUp") dz = -step;
    if (e.key === "ArrowDown") dz = step;
    if (e.key === "ArrowLeft") dx = -step;
    if (e.key === "ArrowRight") dx = step;
    store.moveSelectedShelves(dx, dz);
  }

  if (e.key === "r" || e.key === "R") {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }
    if (store.selectedShelf) {
      e.preventDefault();
      const current = store.selectedShelf.rotationY;
      const next = (current + 90) % 360;
      store.updateShelf(store.selectedShelf.shelfId, { rotationY: next });
    }
  }

  if ((e.key === "d" || e.key === "D") && (e.ctrlKey || e.metaKey)) {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }
    if (store.selectedShelf) {
      e.preventDefault();
      store.copyShelf(store.selectedShelf.shelfId);
    }
  }
}
function handleKeyUp(e: KeyboardEvent): void {
  if (e.key === "Shift") {
    shiftKeyDown.value = false;
    if (!isPanning.value && wrapperRef.value) {
      wrapperRef.value.style.cursor = "";
    }
  }
  if (!isPanning.value && wrapperRef.value) {
    wrapperRef.value.style.cursor = "";
  }
}

function endPanning(): void {
  if (isPanning.value) {
    isPanning.value = false;
    if (wrapperRef.value) {
      wrapperRef.value.style.cursor = "";
    }
  }
}

function handleStageClick(): void {
  if (justDrewRect.value) {
    justDrewRect.value = false;
    return;
  }
  store.selectShelf(null);
}

function handleWheel(e: any): void {
  e.evt.preventDefault();
  if (e.evt.ctrlKey || e.evt.metaKey) {
    const scaleBy = 1.1;
    const oldScale = stageScale.value;
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    stageScale.value = Math.max(0.2, Math.min(3, newScale));
    store.setStageScale(stageScale.value);
  } else {
    stageY.value -= e.evt.deltaY;
  }
  drawRulers();
}

function handleResize(): void {
  if (wrapperRef.value) {
    stageWidth.value = wrapperRef.value.clientWidth;
    stageHeight.value = wrapperRef.value.clientHeight;
  }
  drawRulers();
}

const RULER_SIZE = 30;

function getNiceInterval(pixelsPerMm: number, targetPixels: number): number {
  const mmPerTarget = targetPixels / (pixelsPerMm || 0.001);
  const niceIntervals = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
  for (const interval of niceIntervals) {
    if (interval >= mmPerTarget) return interval;
  }
  return 10000;
}

function drawRulers(): void {
  drawTopRuler();
  drawLeftRuler();
}

function drawTopRuler(): void {
  const canvas = topRulerCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.clientWidth;
  const height = RULER_SIZE;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = "#1a1e24";
  ctx.fillRect(0, 0, width, height);

  const pixelsPerMm = SCALE * stageScale.value;
  const majorInterval = getNiceInterval(pixelsPerMm, 100);
  const minorInterval = majorInterval / 5;

  const leftMm = (RULER_SIZE - stageX.value) / pixelsPerMm;
  const rightMm = (stageWidth.value + RULER_SIZE - stageX.value) / pixelsPerMm;

  const startMinor = Math.floor(leftMm / minorInterval) * minorInterval;
  for (let mm = startMinor; mm <= rightMm; mm += minorInterval) {
    const screenX = mm * pixelsPerMm + stageX.value;
    const canvasX = screenX - RULER_SIZE;
    const isMajor = Math.abs(mm % majorInterval) < 0.01;
    const tickHeight = isMajor ? height * 0.55 : height * 0.3;

    ctx.strokeStyle = isMajor ? "#8a9aaa" : "#4a5a6a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvasX, height);
    ctx.lineTo(canvasX, height - tickHeight);
    ctx.stroke();

    if (isMajor) {
      const label = mm >= 1000 ? `${(mm / 1000).toFixed(1)}m` : `${mm}`;
      ctx.fillStyle = "#8a9aaa";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, canvasX, height - tickHeight - 4);
    }
  }

  ctx.strokeStyle = "#3a4a5a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height - 0.5);
  ctx.lineTo(width, height - 0.5);
  ctx.stroke();
}

function drawLeftRuler(): void {
  const canvas = leftRulerCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = RULER_SIZE;
  const height = canvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = "#1a1e24";
  ctx.fillRect(0, 0, width, height);

  const pixelsPerMm = SCALE * stageScale.value;
  const majorInterval = getNiceInterval(pixelsPerMm, 100);
  const minorInterval = majorInterval / 5;

  const topMm = (RULER_SIZE - stageY.value) / pixelsPerMm;
  const bottomMm =
    (stageHeight.value + RULER_SIZE - stageY.value) / pixelsPerMm;

  const startMinor = Math.floor(topMm / minorInterval) * minorInterval;
  for (let mm = startMinor; mm <= bottomMm; mm += minorInterval) {
    const screenY = mm * pixelsPerMm + stageY.value;
    const canvasY = screenY - RULER_SIZE;
    const isMajor = Math.abs(mm % majorInterval) < 0.01;
    const tickWidth = isMajor ? width * 0.55 : width * 0.3;

    ctx.strokeStyle = isMajor ? "#8a9aaa" : "#4a5a6a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width, canvasY);
    ctx.lineTo(width - tickWidth, canvasY);
    ctx.stroke();

    if (isMajor) {
      const label = mm >= 1000 ? `${(mm / 1000).toFixed(1)}m` : `${mm}`;
      ctx.fillStyle = "#8a9aaa";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(label, width - tickWidth - 4, canvasY);
    }
  }

  ctx.strokeStyle = "#3a4a5a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width - 0.5, 0);
  ctx.lineTo(width - 0.5, height);
  ctx.stroke();
}

function handleDrop(event: DragEvent): void {
  event.preventDefault();
  if (!store.selectedWarehouse) return;

  const json = event.dataTransfer?.getData("application/json");
  if (!json) return;

  const tpl = JSON.parse(json);
  const rect = wrapperRef.value!.getBoundingClientRect();
  const mouseX = (event.clientX - rect.left - stageX.value) / stageScale.value;
  const mouseY = (event.clientY - rect.top - stageY.value) / stageScale.value;

  const wh = warehouseLayouts.value.find(
    (w) => w.warehouseId === store.selectedWarehouseId
  );
  if (!wh) return;

  const totalShelves =
    store.selectedLayer?.warehouses.reduce(
      (sum, w) => sum + w.shelves.length,
      0
    ) ?? 0;
  const shelfId = `SHELF-${String(totalShelves + 1).padStart(3, "0")}`;
  const shelfCode = `${String(totalShelves + 1).padStart(2, "0")}`;

  const layerGroupX = (store.selectedLayer?.offsetX ?? 0) * SCALE;
  const layerGroupY = (store.selectedLayer?.offsetY ?? 0) * SCALE;

  const rawX = Math.round((mouseX - layerGroupX - wh.offsetX) / SCALE);
  const rawZ = Math.round((mouseY - layerGroupY - wh.offsetY) / SCALE);

  const maxX = (wh.width - tpl.width * SCALE) / SCALE;
  const maxZ = (wh.length - tpl.depth * SCALE) / SCALE;

  const newShelf: ShelfConfig = {
    shelfId,
    shelfCode,
    shelfName: `货架-${shelfCode}`,
    position: {
      x: snapToGrid(Math.max(0, Math.min(maxX, rawX))),
      y: 0,
      z: snapToGrid(Math.max(0, Math.min(maxZ, rawZ))),
    },
    rotationY: 0,
    rows: tpl.rows,
    columns: tpl.columns,
    layers: tpl.layers,
    width: tpl.width,
    height: tpl.height,
    depth: tpl.depth,
    slotWidth: tpl.slotWidth,
    slotHeight: tpl.slotHeight,
    slotDepth: tpl.slotDepth,
  };

  store.addShelf(newShelf);
}

function handleDragOver(event: DragEvent): void {
  event.preventDefault();
  event.dataTransfer!.dropEffect = "copy";
}

const PADDING = 60;

function fitToContent(): void {
  if (!store.isRootSelected && !store.selectedLayer) return;

  if (store.isRootSelected) {
    const layouts = allLayersLayout.value;
    if (layouts.length === 0) return;

    const minX = Math.min(...layouts.map((l) => l.offsetX));
    const maxX = Math.max(...layouts.map((l) => l.offsetX + l.warehouseWidth));
    const minY = Math.min(...layouts.map((l) => l.offsetY));
    const maxY = Math.max(...layouts.map((l) => l.offsetY + l.layerHeightPx));
    const contentW = maxX - minX;
    const contentH = maxY - minY;

    const availW = stageWidth.value - PADDING * 2;
    const availH = stageHeight.value - PADDING * 2;
    const scaleX = availW / (contentW || 1);
    const scaleY = availH / (contentH || 1);
    stageScale.value = Math.min(scaleX, scaleY, 1);
    store.setStageScale(stageScale.value);

    stageX.value =
      (stageWidth.value - contentW * stageScale.value) / 2 -
      minX * stageScale.value;
    stageY.value =
      (stageHeight.value - contentH * stageScale.value) / 2 -
      minY * stageScale.value;
  } else if (store.selectedLayer) {
    const whs = warehouseLayouts.value;
    if (whs.length === 0) {
      stageScale.value = 1;
      store.setStageScale(1);
      stageX.value = 0;
      stageY.value = 0;
      return;
    }

    const ox = (store.selectedLayer.offsetX ?? 0) * SCALE;
    const oy = (store.selectedLayer.offsetY ?? 0) * SCALE;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const wh of whs) {
      const wx = wh.offsetX;
      const wy = wh.offsetY;
      const ww = wh.width;
      const wh_len = wh.length;
      if (wx < minX) minX = wx;
      if (wx + ww > maxX) maxX = wx + ww;
      if (wy < minY) minY = wy;
      if (wy + wh_len > maxY) maxY = wy + wh_len;

      for (const shelf of wh.shelves) {
        const sx = wx + shelf.position.x * SCALE;
        const sy = wy + shelf.position.z * SCALE;
        const aabb = getShelfAABB(shelf, sx, sy);
        if (aabb.right > maxX) maxX = aabb.right;
        if (aabb.bottom > maxY) maxY = aabb.bottom;
        if (aabb.left < minX) minX = aabb.left;
        if (aabb.top < minY) minY = aabb.top;
      }
    }

    const contentW = maxX - minX;
    const contentH = maxY - minY;

    const availW = stageWidth.value - PADDING * 2;
    const availH = stageHeight.value - PADDING * 2;
    const scaleX = availW / (contentW || 1);
    const scaleY = availH / (contentH || 1);
    stageScale.value = Math.min(scaleX, scaleY, 1);
    store.setStageScale(stageScale.value);

    stageX.value =
      (stageWidth.value - contentW * stageScale.value) / 2 -
      (minX + ox) * stageScale.value;
    stageY.value =
      (stageHeight.value - contentH * stageScale.value) / 2 -
      (minY + oy) * stageScale.value;
  }
}

watch(
  () => [store.selectedNodeKey, store.selectedLayerId],
  () => {
    fitToContent();
  },
  { immediate: true }
);

watch(
  () => store.editingLayers.length,
  () => {
    fitToContent();
  }
);

watch([stageX, stageY, stageScale, stageWidth, stageHeight], () => {
  drawRulers();
});

onMounted(() => {
  handleResize();
  window.addEventListener("resize", handleResize);
  window.addEventListener("mouseup", handleGlobalMouseUp);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  wrapperRef.value?.addEventListener("drop", handleDrop);
  wrapperRef.value?.addEventListener("dragover", handleDragOver);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("mouseup", handleGlobalMouseUp);
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  wrapperRef.value?.removeEventListener("drop", handleDrop);
  wrapperRef.value?.removeEventListener("dragover", handleDragOver);
});
</script>

<style scoped>
.konva-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.ruler {
  position: absolute;
  z-index: 10;
  pointer-events: none;
}

.ruler--corner {
  top: 0;
  left: 0;
  width: 30px;
  height: 30px;
  background: #1a1e24;
  border-right: 1px solid #3a4a5a;
  border-bottom: 1px solid #3a4a5a;
}

.ruler--top {
  top: 0;
  left: 30px;
  right: 0;
  height: 30px;
  background: #1a1e24;
  border-bottom: 1px solid #3a4a5a;
}

.ruler--top canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.ruler--left {
  top: 30px;
  left: 0;
  bottom: 0;
  width: 30px;
  background: #1a1e24;
  border-right: 1px solid #3a4a5a;
}

.ruler--left canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>