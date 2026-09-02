<template>
  <div class="right-panel">
    <template v-if="store.isRootSelected">
      <div class="panel-section">
        <div class="section-title">仓库总览</div>
        <a-form layout="vertical" size="small">
          <a-form-item>
            <template #label>
              <span class="form-label">层 X 对齐</span>
            </template>
            <a-switch
              :checked="store.layerXAligned"
              @change="(v: boolean) => store.layerXAligned = v"
            />
          </a-form-item>
        </a-form>
      </div>

      <div class="panel-section">
        <div class="section-title">层汇总</div>
        <div class="slot-summary">
          {{ store.editingLayers.length }} 个层
          <div class="slot-count-detail">
            {{ totalAllWarehouses }} 个仓库 / {{ totalAllShelves }} 个货架
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="!store.selectedLayer">
      <div class="panel-empty">
        <div class="empty-icon">◻</div>
        <div class="empty-text">请在左侧选择或创建层</div>
      </div>
    </template>

    <template v-else-if="store.selectedShelfId">
      <div class="panel-section">
        <div class="section-title">
          货架属性
          <a-button
            type="link"
            size="small"
            @click="handleCopyShelf"
            style="float: right"
          >
            复制
          </a-button>
          <a-button
            type="link"
            danger
            size="small"
            @click="handleDeleteShelf"
            style="float: right"
          >
            删除
          </a-button>
        </div>

        <a-form layout="vertical" size="small">
          <a-form-item>
            <template #label>
              <span class="form-label">货架编号</span>
            </template>
            <a-input
              :value="form.shelfCode"
              @change="(e: any) => { form.shelfCode = e.target.value; onFieldChange() }"
            />
          </a-form-item>
          <a-form-item>
            <template #label>
              <span class="form-label">货架名称</span>
            </template>
            <a-input
              :value="form.shelfName"
              @change="(e: any) => { form.shelfName = e.target.value; onFieldChange() }"
            />
          </a-form-item>

          <a-divider style="margin: 8px 0" />

          <a-row :gutter="8">
            <a-col :span="8">
              <a-form-item>
                <template #label>
                  <span class="form-label">列数</span>
                </template>
                <a-input-number
                  :value="form.rows"
                  :min="1"
                  :max="10"
                  @change="(v: number | null) => { form.rows = v ?? 4; onFieldChange() }"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item>
                <template #label>
                  <span class="form-label">排数</span>
                </template>
                <a-input-number
                  :value="form.columns"
                  :min="1"
                  :max="5"
                  @change="(v: number | null) => { form.columns = v ?? 1; onFieldChange() }"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item>
                <template #label>
                  <span class="form-label">层数</span>
                </template>
                <a-input-number
                  :value="form.layers"
                  :min="1"
                  :max="20"
                  @change="(v: number | null) => { form.layers = v ?? 6; onFieldChange() }"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-divider style="margin: 8px 0" />

          <a-row :gutter="8">
            <a-col :span="12">
              <a-form-item>
                <template #label>
                  <span class="form-label">宽度 (mm)</span>
                </template>
                <a-input-number
                  :value="form.width"
                  :min="100"
                  :step="100"
                  @change="(v: number | null) => { form.width = v ?? 1800; onFieldChange() }"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item>
                <template #label>
                  <span class="form-label">深度 (mm)</span>
                </template>
                <a-input-number
                  :value="form.depth"
                  :min="100"
                  :step="100"
                  @change="(v: number | null) => { form.depth = v ?? 700; onFieldChange() }"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="8">
            <a-col :span="12">
              <a-form-item>
                <template #label>
                  <span class="form-label">高度 (mm)</span>
                </template>
                <a-input-number
                  :value="form.height"
                  :min="100"
                  :step="100"
                  @change="(v: number | null) => { form.height = v ?? 2100; onFieldChange() }"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item>
                <template #label>
                  <span class="form-label">旋转</span>
                </template>
                <a-select
                  :value="form.rotationY"
                  size="small"
                  @change="(v: number) => { form.rotationY = v; onRotationChange() }"
                  style="width: 100%"
                >
                  <a-select-option :value="0">0°</a-select-option>
                  <a-select-option :value="90">90°</a-select-option>
                  <a-select-option :value="180">180°</a-select-option>
                  <a-select-option :value="270">270°</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <a-divider style="margin: 8px 0" />

          <a-form-item>
            <template #label>
              <span class="form-label">位置 X (mm)</span>
            </template>
            <a-input-number
              :value="form.positionX"
              :step="100"
              @change="(v: number | null) => { form.positionX = v ?? 0; onPositionChange() }"
              style="width: 100%"
            />
          </a-form-item>
          <a-form-item>
            <template #label>
              <span class="form-label">位置 Z (mm)</span>
            </template>
            <a-input-number
              :value="form.positionZ"
              :step="100"
              @change="(v: number | null) => { form.positionZ = v ?? 0; onPositionChange() }"
              style="width: 100%"
            />
          </a-form-item>
        </a-form>
      </div>

      <div class="panel-section">
        <div class="section-title">货位编码生成</div>
        <a-form layout="vertical" size="small">
          <a-row :gutter="8">
            <a-col :span="12">
              <a-form-item>
                <template #label
                  ><span class="form-label">货架编码</span></template
                >
                <a-input
                  :value="form.slotCodePrefix"
                  @change="(e: any) => { form.slotCodePrefix = e.target.value; onFieldChange() }"
                  placeholder="如 100001"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item>
                <template #label
                  ><span class="form-label">区域码</span></template
                >
                <a-input
                  :value="form.slotCodeArea"
                  @change="(e: any) => { form.slotCodeArea = e.target.value; onFieldChange() }"
                  placeholder="如 AA"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="8">
            <a-col :span="12">
              <a-form-item>
                <template #label
                  ><span class="form-label">货架号</span></template
                >
                <a-input
                  :value="form.slotCodeShelfNum"
                  @change="(e: any) => { form.slotCodeShelfNum = e.target.value; onFieldChange() }"
                  placeholder="如 5"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item>
                <template #label><span class="form-label">后缀</span></template>
                <a-input
                  :value="form.slotCodeSuffix"
                  @change="(e: any) => { form.slotCodeSuffix = e.target.value; onFieldChange() }"
                  placeholder="如 3"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <span class="code-preview" v-if="form.slotCodePrefix">
            预览: {{ form.slotCodePrefix }}{{ form.slotCodeArea
            }}{{ form.slotCodeShelfNum }}<b>0101</b>{{ form.slotCodeSuffix }}
          </span>
          <a-button
            type="primary"
            size="small"
            block
            :disabled="!form.slotCodePrefix"
            style="margin-top: 8px"
            @click="handleGenerateSlotCodes"
          >
            生成编码
          </a-button>
        </a-form>
      </div>

      <div class="panel-section">
        <div class="section-title">
          货位列表
          <span class="slot-total">共 {{ totalSlots }} 个</span>
        </div>
        <div class="slot-grid">
          <div v-for="(slot, idx) in slotList" :key="idx" class="slot-item">
            <span class="slot-meta">{{ slot.key }}</span>
            <a-input
              :value="slot.code"
              size="small"
              @change="(e: any) => onSlotCodeChange(slot.key, e.target.value)"
              class="slot-input"
            />
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="store.selectedWarehouseId && store.selectedWarehouse">
      <div class="panel-section">
        <div class="section-title">
          仓库属性
          <a-button
            type="link"
            danger
            size="small"
            @click="handleDeleteWarehouse"
            style="float: right"
          >
            删除
          </a-button>
        </div>
        <a-form layout="vertical" size="small">
          <a-form-item>
            <template #label>
              <span class="form-label">仓库编号</span>
            </template>
            <a-input
              :value="store.selectedWarehouse.warehouseCode"
              @change="(e: any) => { store.selectedWarehouse!.warehouseCode = e.target.value }"
            />
          </a-form-item>
          <a-form-item>
            <template #label>
              <span class="form-label">仓库名称</span>
            </template>
            <a-input
              :value="store.selectedWarehouse.warehouseName"
              @change="(e: any) => { store.selectedWarehouse!.warehouseName = e.target.value }"
            />
          </a-form-item>

          <a-divider style="margin: 8px 0" />

          <a-row :gutter="8">
            <a-col :span="12">
              <a-form-item>
                <template #label>
                  <span class="form-label">宽度 (mm)</span>
                </template>
                <a-input-number
                  :value="whForm.width"
                  :min="1000"
                  :step="100"
                  @change="(v: number | null) => { whForm.width = v ?? 8000; onWhFieldChange() }"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item>
                <template #label>
                  <span class="form-label">长度 (mm)</span>
                </template>
                <a-input-number
                  :value="whForm.length"
                  :min="1000"
                  :step="100"
                  @change="(v: number | null) => { whForm.length = v ?? 8000; onWhFieldChange() }"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-divider style="margin: 8px 0" />

          <a-row :gutter="8">
            <a-col :span="12">
              <a-form-item>
                <template #label>
                  <span class="form-label">位置 X (mm)</span>
                </template>
                <a-input-number
                  :value="whForm.offsetX"
                  :step="100"
                  @change="(v: number | null) => { whForm.offsetX = v ?? 0; onWhFieldChange() }"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item>
                <template #label>
                  <span class="form-label">位置 Y (mm)</span>
                </template>
                <a-input-number
                  :value="whForm.offsetY"
                  :step="100"
                  @change="(v: number | null) => { whForm.offsetY = v ?? 0; onWhFieldChange() }"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <div class="panel-section">
        <div class="section-title">货位汇总</div>
        <div class="slot-summary">
          共 {{ warehouseSlots }} 个货位
          <div class="slot-count-detail">
            {{ store.selectedWarehouse.shelves.length }} 个货架
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="panel-section">
        <div class="section-title">
          层属性
          <a-button
            type="link"
            danger
            size="small"
            @click="handleDeleteLayer"
            style="float: right"
          >
            删除
          </a-button>
        </div>
        <a-form layout="vertical" size="small">
          <a-form-item>
            <template #label>
              <span class="form-label">层编号</span>
            </template>
            <a-input
              :value="store.selectedLayer.layerCode"
              @change="(e: any) => { const v = e.target.value.replace(/\D/g, ''); store.selectedLayer!.layerCode = v }"
            />
          </a-form-item>
          <a-form-item>
            <template #label>
              <span class="form-label">层名称</span>
            </template>
            <a-input
              :value="store.selectedLayer.layerName"
              @change="(e: any) => { store.selectedLayer!.layerName = e.target.value }"
            />
          </a-form-item>
          <a-form-item>
            <template #label>
              <span class="form-label">层高 (mm)</span>
            </template>
            <a-input-number
              :value="store.selectedLayer.height"
              :min="500"
              :max="20000"
              :step="100"
              style="width: 100%"
              @change="(v: number | null) => store.setLayerHeight(v ?? 1000)"
            />
          </a-form-item>

          <a-divider style="margin: 8px 0" />

          <a-row :gutter="8">
            <a-col :span="12">
              <a-form-item>
                <template #label>
                  <span class="form-label">位置 X (mm)</span>
                </template>
                <a-input-number
                  :value="store.selectedLayer.offsetX ?? 0"
                  :step="100"
                  style="width: 100%"
                  @change="(v: number | null) => store.setLayerPosition(store.selectedLayer!.layerId, v ?? 0)"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item>
                <template #label>
                  <span class="form-label">位置 Y (mm)</span>
                </template>
                <a-input-number
                  :value="store.selectedLayer.offsetY ?? 0"
                  :step="100"
                  style="width: 100%"
                  @change="(v: number | null) => store.setLayerPosition(store.selectedLayer!.layerId, store.selectedLayer!.offsetX ?? 0, v ?? 0)"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item>
            <template #label>
              <span class="form-label">Z 坐标 (mm)</span>
            </template>
            <a-input-number
              :value="store.selectedLayer.zCoord ?? 0"
              :step="100"
              style="width: 100%"
              @change="(v: number | null) => store.setLayerZCoord(store.selectedLayer!.layerId, v ?? 0)"
            />
          </a-form-item>
        </a-form>
      </div>

      <div class="panel-section">
        <div class="section-title">仓库汇总</div>
        <div class="slot-summary">
          {{ store.selectedLayer.warehouses.length }} 个仓库
          <div class="slot-count-detail">共 {{ totalShelves }} 个货架</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { message, Modal } from "ant-design-vue";
import { useWarehouseStore } from "@/stores/warehouse";
import { generateLocationCode } from "@/three/utils/LocationCodeGenerator";

const store = useWarehouseStore();

const totalAllWarehouses = computed(() =>
  store.editingLayers.reduce((sum, l) => sum + l.warehouses.length, 0)
);

const totalAllShelves = computed(() =>
  store.editingLayers.reduce(
    (sum, l) => sum + l.warehouses.reduce((s, w) => s + w.shelves.length, 0),
    0
  )
);

const totalShelves = computed(
  () =>
    store.selectedLayer?.warehouses.reduce(
      (sum, w) => sum + w.shelves.length,
      0
    ) ?? 0
);

const warehouseSlots = computed(() => {
  if (!store.selectedWarehouse) return 0;
  return store.selectedWarehouse.shelves.reduce(
    (sum, s) => sum + s.rows * s.columns * s.layers,
    0
  );
});

const totalSlots = computed(() => {
  if (!store.selectedShelf) return 0;
  return (
    store.selectedShelf.rows *
    store.selectedShelf.columns *
    store.selectedShelf.layers
  );
});

interface SlotEntry {
  key: string;
  code: string;
}

function buildSlotCodeForDisplay(
  shelf: {
    slotCodePrefix?: string;
    slotCodeArea?: string;
    slotCodeShelfNum?: string;
    slotCodeSuffix?: string;
  },
  row: number,
  col: number,
  layer: number
): string | null {
  if (!shelf.slotCodePrefix) return null;
  const area = shelf.slotCodeArea ?? "";
  const shelfNum = shelf.slotCodeShelfNum ?? "";
  const suffix = shelf.slotCodeSuffix ?? "";
  return `${shelf.slotCodePrefix}${area}${shelfNum}${String(layer).padStart(
    2,
    "0"
  )}${String(col).padStart(2, "0")}${suffix}`;
}

const slotList = computed<SlotEntry[]>(() => {
  if (!store.selectedShelf) return [];
  const shelf = store.selectedShelf;
  const entries: SlotEntry[] = [];
  for (let row = 1; row <= shelf.rows; row++) {
    for (let col = 1; col <= shelf.columns; col++) {
      for (let layer = 1; layer <= shelf.layers; layer++) {
        const key = `${row}-${col}-${layer}`;
        const code =
          shelf.customSlotCodes?.[key] ??
          buildSlotCodeForDisplay(shelf, row, col, layer) ??
          generateLocationCode({
            shelfCode: shelf.shelfCode,
            row,
            column: col,
            layer,
          });
        entries.push({ key, code });
      }
    }
  }
  return entries;
});

const form = reactive({
  shelfCode: "",
  shelfName: "",
  rows: 4,
  columns: 1,
  layers: 6,
  width: 1800,
  depth: 700,
  height: 2100,
  rotationY: 0,
  positionX: 0,
  positionZ: 0,
  slotCodePrefix: "",
  slotCodeArea: "",
  slotCodeShelfNum: "",
  slotCodeSuffix: "",
});

const whForm = reactive({
  width: 8000,
  length: 8000,
  offsetX: 0,
  offsetY: 0,
});

watch(
  () => store.selectedShelf,
  (shelf) => {
    if (shelf) {
      form.shelfCode = shelf.shelfCode;
      form.shelfName = shelf.shelfName;
      form.rows = shelf.rows;
      form.columns = shelf.columns;
      form.layers = shelf.layers;
      form.width = shelf.width;
      form.depth = shelf.depth;
      form.height = shelf.height;
      form.rotationY = shelf.rotationY;
      form.positionX = shelf.position.x;
      form.positionZ = shelf.position.z;
      form.slotCodePrefix = shelf.slotCodePrefix ?? "";
      form.slotCodeArea = shelf.slotCodeArea ?? "";
      form.slotCodeShelfNum = shelf.slotCodeShelfNum ?? "";
      form.slotCodeSuffix = shelf.slotCodeSuffix ?? "";
    }
  },
  { immediate: true, deep: true }
);

watch(
  () => store.selectedWarehouse,
  (wh) => {
    if (wh) {
      whForm.width = wh.width;
      whForm.length = wh.length;
      whForm.offsetX = wh.offsetX ?? 0;
      whForm.offsetY = wh.offsetY ?? 0;
    }
  },
  { immediate: true, deep: true }
);

function onFieldChange(): void {
  if (!store.selectedShelf) return;
  store.updateShelf(store.selectedShelf.shelfId, {
    shelfCode: form.shelfCode,
    shelfName: form.shelfName,
    rows: form.rows,
    columns: form.columns,
    layers: form.layers,
    width: form.width,
    depth: form.depth,
    height: form.height,
    slotCodePrefix: form.slotCodePrefix || undefined,
    slotCodeArea: form.slotCodeArea || undefined,
    slotCodeShelfNum: form.slotCodeShelfNum || undefined,
    slotCodeSuffix: form.slotCodeSuffix || undefined,
  });
}

function onRotationChange(): void {
  if (!store.selectedShelf) return;
  store.updateShelf(store.selectedShelf.shelfId, {
    rotationY: form.rotationY,
  });
}

function onWhFieldChange(): void {
  if (!store.selectedWarehouse) return;
  store.setWarehouseSize(whForm.width, whForm.length);
  store.setWarehousePosition(whForm.offsetX, whForm.offsetY);
}

function onPositionChange(): void {
  if (!store.selectedShelf) return;
  const wh = store.selectedWarehouse;
  if (!wh) return;
  const shelf = store.selectedShelf;

  const x = form.positionX;
  const z = form.positionZ;

  store.updateShelf(store.selectedShelf.shelfId, {
    position: {
      x,
      y: 0,
      z,
    },
  });
}

function handleGenerateSlotCodes(): void {
  if (!store.selectedShelf) return;
  const shelf = store.selectedShelf;
  const customCodes: Record<string, string> = {};
  for (let row = 1; row <= shelf.rows; row++) {
    for (let col = 1; col <= shelf.columns; col++) {
      for (let layer = 1; layer <= shelf.layers; layer++) {
        const key = `${row}-${col}-${layer}`;
        const code = buildSlotCodeForDisplay(
          {
            slotCodePrefix: form.slotCodePrefix,
            slotCodeArea: form.slotCodeArea,
            slotCodeShelfNum: form.slotCodeShelfNum,
            slotCodeSuffix: form.slotCodeSuffix,
          },
          row,
          col,
          layer
        );
        if (code) {
          customCodes[key] = code;
        }
      }
    }
  }
  store.updateShelf(shelf.shelfId, { customSlotCodes: customCodes });
  message.success(`已生成 ${Object.keys(customCodes).length} 个货位编码`);
}

function onSlotCodeChange(key: string, value: string): void {
  if (!store.selectedShelf) return;
  const shelf = store.selectedShelf;
  const customCodes = { ...(shelf.customSlotCodes ?? {}) };
  if (value) {
    customCodes[key] = value;
  } else {
    delete customCodes[key];
  }
  store.updateShelf(shelf.shelfId, {
    customSlotCodes:
      Object.keys(customCodes).length > 0 ? customCodes : undefined,
  });
}

function handleDeleteShelf(): void {
  if (!store.selectedShelf) return;
  Modal.confirm({
    title: "确认删除",
    content: `确定要删除货架「${store.selectedShelf.shelfName}」吗？`,
    okText: "删除",
    okType: "danger",
    cancelText: "取消",
    onOk: () => {
      store.removeShelf(store.selectedShelf!.shelfId);
    },
  });
}

function handleCopyShelf(): void {
  if (!store.selectedShelf) return;
  const copy = store.copyShelf(store.selectedShelf.shelfId);
  if (copy) {
    message.success(`已复制货架「${copy.shelfName}」`);
  }
}

function handleDeleteWarehouse(): void {
  if (!store.selectedWarehouse) return;
  Modal.confirm({
    title: "确认删除",
    content: `确定要删除仓库「${store.selectedWarehouse.warehouseName}」吗？\n仓库下的所有货架也将被删除。`,
    okText: "删除",
    okType: "danger",
    cancelText: "取消",
    onOk: () => {
      store.removeWarehouse(store.selectedWarehouse!.warehouseId);
    },
  });
}

function handleDeleteLayer(): void {
  if (!store.selectedLayer) return;
  Modal.confirm({
    title: "确认删除",
    content: `确定要删除「${store.selectedLayer.layerName}」吗？\n该层下的所有仓库和货架也将被删除。`,
    okText: "删除",
    okType: "danger",
    cancelText: "取消",
    onOk: () => {
      store.removeLayer(store.selectedLayer!.layerId);
    },
  });
}
</script>

<style scoped>
.right-panel {
  padding: 12px;
}

.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #667788;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.3;
}

.empty-text {
  font-size: 14px;
  margin-bottom: 6px;
  color: #8899aa;
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

:deep(.ant-input) {
  background: #1a1a3e;
  border-color: #2a2a5a;
  color: #ccddee;
}

:deep(.ant-input:hover) {
  border-color: #3a5a7a;
}

:deep(.ant-input:focus) {
  border-color: #4a7ab5;
  box-shadow: 0 0 0 2px rgba(74, 122, 181, 0.2);
}

:deep(.ant-input-number) {
  background: #1a1a3e;
  border-color: #2a2a5a;
}

:deep(.ant-input-number:hover) {
  border-color: #3a5a7a;
}

:deep(.ant-input-number-focused) {
  border-color: #4a7ab5;
  box-shadow: 0 0 0 2px rgba(74, 122, 181, 0.2);
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

:deep(.ant-divider) {
  border-color: #2a2a4a;
}

:deep(.ant-divider-horizontal.ant-divider-with-text) {
  border-color: #2a2a4a;
}

:deep(.ant-divider-inner-text) {
  color: #8899aa;
}

.slot-summary {
  font-size: 13px;
  color: #aabbcc;
}

.slot-count-detail {
  font-size: 12px;
  color: #8899aa;
  margin-top: 4px;
}

.slot-total {
  font-size: 12px;
  font-weight: 400;
  color: #8899aa;
  margin-left: 8px;
}

.slot-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.slot-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 100px;
  flex: 1;
}

.slot-meta {
  font-size: 10px;
  color: #667788;
  font-family: monospace;
}

.slot-input {
  width: 100%;
}

:deep(.slot-input .ant-input) {
  font-size: 11px;
  padding: 2px 6px;
  height: 24px;
}

:deep(.slot-input .ant-input-sm) {
  font-size: 11px;
}
</style>