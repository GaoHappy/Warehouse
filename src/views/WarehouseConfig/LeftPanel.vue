<template>
  <div class="left-panel">
    <div class="panel-section">
      <div class="section-title">货架模板</div>
      <div class="template-list">
        <div
          v-for="tpl in templates"
          :key="tpl.id"
          class="template-item"
          draggable="true"
          @dragstart="onDragStart($event, tpl)"
        >
          <div class="template-name">{{ tpl.name }}</div>
          <div class="template-desc">
            {{ tpl.rows }}列 × {{ tpl.layers }}层 | {{ tpl.width }}×{{
              tpl.depth
            }}mm
          </div>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <div class="section-title">结构树</div>
      <a-tree
        v-model:expandedKeys="expandedKeys"
        v-model:selectedKeys="selectedKeys"
        :tree-data="treeNodes"
        :field-names="{ title: 'title', key: 'key', children: 'children' }"
        @click="onTreeClick"
        class="config-tree"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useWarehouseStore } from "@/stores/warehouse";

interface ShelfTemplate {
  id: string;
  name: string;
  rows: number;
  columns: number;
  layers: number;
  width: number;
  depth: number;
  height: number;
  slotWidth: number;
  slotDepth: number;
  slotHeight: number;
}

const templates: ShelfTemplate[] = [
  {
    id: "tpl-4x6",
    name: "标准货架 4列6层",
    rows: 4,
    columns: 1,
    layers: 6,
    width: 1800,
    depth: 600,
    height: 2100,
    slotWidth: 365,
    slotDepth: 550,
    slotHeight: 260,
  },
  {
    id: "tpl-5x8",
    name: "大货架 5列8层",
    rows: 5,
    columns: 1,
    layers: 8,
    width: 2200,
    depth: 600,
    height: 2800,
    slotWidth: 365,
    slotDepth: 550,
    slotHeight: 260,
  },
  {
    id: "tpl-custom",
    name: "自定义货架",
    rows: 1,
    columns: 1,
    layers: 6,
    width: 450,
    depth: 600,
    height: 2100,
    slotWidth: 365,
    slotDepth: 550,
    slotHeight: 260,
  },
];

const store = useWarehouseStore();
const expandedKeys = ref<string[]>([]);
const selectedKeys = ref<string[]>([]);

const treeNodes = computed(() => [
  {
    title: "仓库总览",
    key: "__ROOT__",
    children: store.editingLayers.map((layer) => ({
      title: layer.layerName,
      key: layer.layerId,
      children: layer.warehouses.map((w) => ({
        title: w.warehouseName,
        key: w.warehouseId,
        children: w.shelves.map((s) => ({
          title: s.shelfName,
          key: s.shelfId,
        })),
      })),
    })),
  },
]);

watch(
  () => [
    store.selectedNodeKey,
    store.selectedLayerId,
    store.selectedWarehouseId,
    store.selectedShelfId,
  ],
  ([nodeKey, layerId, warehouseId, shelfId]) => {
    const keys: string[] = [];
    if (nodeKey === "__ROOT__") {
      keys.push("__ROOT__");
      expandedKeys.value = [...new Set([...expandedKeys.value, "__ROOT__"])];
    } else if (shelfId) {
      keys.push(shelfId);
      if (warehouseId)
        expandedKeys.value = [
          ...new Set([
            ...expandedKeys.value,
            "__ROOT__",
            layerId!,
            warehouseId,
          ]),
        ];
    } else if (warehouseId) {
      keys.push(warehouseId);
      if (layerId)
        expandedKeys.value = [
          ...new Set([...expandedKeys.value, "__ROOT__", layerId]),
        ];
    } else if (layerId) {
      keys.push(layerId);
      expandedKeys.value = [...new Set([...expandedKeys.value, "__ROOT__"])];
    }
    selectedKeys.value = keys;
  },
  { immediate: true }
);

function onTreeClick(e: MouseEvent, node: any): void {
  const target = e.target as HTMLElement;
  if (target.closest(".ant-tree-switcher")) return;
  if (node?.key) {
    store.selectTreeNode(node.key);
  }
}

function onDragStart(event: DragEvent, tpl: ShelfTemplate): void {
  event.dataTransfer!.setData("application/json", JSON.stringify(tpl));
  event.dataTransfer!.effectAllowed = "copy";
}
</script>

<style scoped>
.left-panel {
  padding: 12px;
}

.panel-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #ccddee;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #2a2a4a;
}

:deep(.ant-form-item-label > label) {
  color: #ccddee !important;
  font-size: 13px;
}

:deep(.ant-input-number) {
  background: #1a1a3e;
  border-color: #2a2a5a;
}

:deep(.ant-input-number-input) {
  color: #ccddee !important;
}

:deep(.ant-input-number-handler-wrap) {
  background: #2a2a5a;
  border-color: #3a3a6a;
}

:deep(.ant-input-number-handler) {
  border-color: #3a3a6a;
}

:deep(.ant-input-number-handler:active) {
  background: #3a3a6a;
}

:deep(.ant-input-number-handler-up-inner),
:deep(.ant-input-number-handler-down-inner) {
  color: #aabbcc !important;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.template-item {
  padding: 10px;
  background: #1a1a3e;
  border: 1px solid #2a2a5a;
  border-radius: 6px;
  cursor: grab;
  transition: border-color 0.2s;
}

.template-item:hover {
  border-color: #4a7ab5;
}

.template-item:active {
  cursor: grabbing;
}

.template-name {
  font-size: 13px;
  font-weight: 500;
  color: #ccddee;
  margin-bottom: 4px;
}

.template-desc {
  font-size: 11px;
  color: #8899aa;
}

.config-tree {
  background: transparent;
}

.config-tree :deep(.ant-tree) {
  background: transparent;
  color: #ccddee;
}

.config-tree :deep(.ant-tree-treenode) {
  padding: 2px 0;
}

.config-tree :deep(.ant-tree-title) {
  color: #ccddee !important;
  font-size: 13px;
}

.config-tree :deep(.ant-tree-node-content-wrapper) {
  background: transparent !important;
  transition: background 0.2s;
}

.config-tree :deep(.ant-tree-node-content-wrapper:hover) {
  background: #1a2a4a !important;
}

.config-tree :deep(.ant-tree-node-selected) {
  background: #2a4a6a !important;
}

.config-tree :deep(.ant-tree-switcher) {
  color: #8899aa;
  width: 20px;
}

.config-tree :deep(.ant-tree-switcher:hover) {
  color: #aabbcc;
}

.config-tree :deep(.ant-tree-node-selected .ant-tree-title) {
  color: #ffffff !important;
}
</style>