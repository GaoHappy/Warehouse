<template>
  <div class="config-page">
    <div class="config-toolbar">
      <div class="toolbar-left">
        <a-space :size="4">
          <a-dropdown>
            <a-button size="small">
              <template #icon>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </template>
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item key="import" @click="handleImport">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    style="margin-right: 8px"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  导入
                </a-menu-item>
                <a-menu-item key="export" @click="handleExport">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    style="margin-right: 8px"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  导出
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="reset" danger @click="handleReset">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    style="margin-right: 8px"
                  >
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  重置
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          <a-button
            size="small"
            class="btn-add-layer"
            @click="store.addLayer()"
          >
            <template #icon>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <line x1="12" y1="10" x2="12" y2="18" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
            </template>
            加层
          </a-button>
          <a-button
            v-if="store.selectedLayer"
            size="small"
            class="btn-add-wh"
            @click="store.addWarehouse()"
          >
            <template #icon>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </template>
            加仓库
          </a-button>
          <a-divider type="vertical" />
          <span class="toolbar-info">
            层: {{ store.editingLayers.length }} | 仓库: {{ totalWarehouses }} |
            货架: {{ totalShelves }} | {{ zoomPercent }}%
          </span>
        </a-space>
      </div>
      <div class="toolbar-right">
        <a-space :size="4">
          <a-button size="small" @click="showSettings = true">
            <template #icon>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path
                  d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                />
              </svg>
            </template>
            设置
          </a-button>
          <a-dropdown>
            <a-button size="small">
              发布
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                style="margin-left: 4px"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item key="publish-full" @click="goToShowFull">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    style="margin-right: 8px"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                  展示版
                </a-menu-item>
                <a-menu-item key="publish-lite" @click="goToShowLite">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    style="margin-right: 8px"
                  >
                    <path
                      d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                    />
                  </svg>
                  简单版
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          <a-button size="small" @click="handlePreview">预览</a-button>
          <a-button type="primary" size="small" @click="handleSave"
            >保存</a-button
          >
        </a-space>
      </div>
    </div>

    <div class="config-body">
      <div class="config-left">
        <LeftPanel />
      </div>
      <div class="config-center" ref="canvasContainer">
        <KonvaStage />
      </div>
      <div class="config-right">
        <RightPanel />
      </div>
    </div>

    <a-modal
      v-model:open="showSettings"
      title="系统设置"
      :footer="null"
      width="480px"
    >
      <a-form layout="vertical" style="margin-top: 16px">
        <a-form-item label="项目名称">
          <a-input
            :value="store.projectName"
            @change="(e: any) => store.projectName = e.target.value"
            placeholder="默认项目"
          />
        </a-form-item>
        <a-form-item label="大屏标题">
          <a-input
            :value="store.screenTitle"
            @change="(e: any) => store.screenTitle = e.target.value"
            placeholder="智能仓储数字孪生平台"
          />
        </a-form-item>
        <a-form-item label="接口地址">
          <a-input
            :value="store.apiUrl"
            @change="(e: any) => store.apiUrl = e.target.value"
            placeholder="http://127.0.0.1:8080"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <PreviewModal :visible="showPreview" @close="showPreview = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { message, Modal } from "ant-design-vue";
import { useWarehouseStore } from "@/stores/warehouse";
import LeftPanel from "./LeftPanel.vue";
import KonvaStage from "./KonvaStage.vue";
import RightPanel from "./RightPanel.vue";
import PreviewModal from "./PreviewModal.vue";

const router = useRouter();

const store = useWarehouseStore();

const STORAGE_KEY = "warehouse-layers";
const CONFIG_URL = "/asset/warehouse-config.json";
const showSettings = ref(false);
const showPreview = ref(false);

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

onMounted(async () => {
  const projectName = store.projectName || "默认项目";

  try {
    const res = await fetch(
      `/api/latest-config?projectName=${encodeURIComponent(projectName)}`
    );
    if (res.ok) {
      const result = await res.json();
      if (result.config) {
        const data = result.config;
        if (data && typeof data === "object") {
          if (Array.isArray(data.layers)) {
            store.initEditingLayers(data.layers);
          } else if (Array.isArray(data)) {
            store.initEditingLayers(data);
          }
          if (data.screenTitle) {
            store.screenTitle = data.screenTitle;
          }
          if (data.apiUrl) {
            store.apiUrl = data.apiUrl;
          }
          if (data.projectName) {
            store.projectName = data.projectName;
          }
        }
        return;
      }
    }
  } catch {
    // 开发服务器未启动，尝试从静态文件加载
  }

  try {
    const res = await fetch(CONFIG_URL);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object") {
        if (Array.isArray(data.layers)) {
          store.initEditingLayers(data.layers);
        } else if (Array.isArray(data)) {
          store.initEditingLayers(data);
        }
        if (data.screenTitle) {
          store.screenTitle = data.screenTitle;
        }
        if (data.apiUrl) {
          store.apiUrl = data.apiUrl;
        }
        if (data.projectName) {
          store.projectName = data.projectName;
        }
      }
      return;
    }
  } catch {
    // 部署配置文件不存在，尝试 localStorage
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed.layers)) {
          store.initEditingLayers(parsed.layers);
        } else if (Array.isArray(parsed)) {
          store.initEditingLayers(parsed);
        }
        if (parsed.screenTitle) {
          store.screenTitle = parsed.screenTitle;
        }
        if (parsed.apiUrl) {
          store.apiUrl = parsed.apiUrl;
        }
        if (parsed.projectName) {
          store.projectName = parsed.projectName;
        }
      }
      return;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
});

watch(
  () => store.editingLayers,
  () => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          layers: store.editingLayers,
          screenTitle: store.screenTitle,
          apiUrl: store.apiUrl,
          projectName: store.projectName,
        })
      );
    }, 2000);
  },
  { deep: true }
);

onUnmounted(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
});

const fileInputRef = ref<HTMLInputElement>();

const totalWarehouses = computed(() =>
  store.editingLayers.reduce((sum, l) => sum + l.warehouses.length, 0)
);

const totalShelves = computed(() =>
  store.editingLayers.reduce(
    (sum, l) => sum + l.warehouses.reduce((s, w) => s + w.shelves.length, 0),
    0
  )
);

const zoomPercent = computed(() => Math.round(store.stageScale * 100));

function goToShowFull(): void {
  publishConfig();
  router.push("/show");
}

function goToShowLite(): void {
  publishConfig();
  router.push("/show?mode=lite");
}

function handlePreview(): void {
  saveVersionedConfig();
  showPreview.value = true;
}

async function saveVersionedConfig(): Promise<void> {
  try {
    const payload = {
      target: "versioned",
      projectName: store.projectName || "默认项目",
      config: {
        layers: store.editingLayers,
        screenTitle: store.screenTitle,
        apiUrl: store.apiUrl,
        projectName: store.projectName,
      },
    };
    const res = await fetch("/api/save-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const result = await res.json();
      const layerCount = store.editingLayers.length;
      const shelfCount = totalShelves.value;
      message.success(
        `配置已保存到 public/asset/${result.filename}（${layerCount} 个层，${shelfCount} 个货架）`
      );
    } else {
      const err = await res.json().catch(() => ({ error: "未知错误" }));
      message.error(`保存失败: ${err.error}`);
    }
  } catch {
    message.error("保存失败，请确认开发服务器已启动 (npm run dev)");
  }
}

async function publishConfig(): Promise<void> {
  try {
    const payload = {
      target: "publish",
      config: {
        layers: store.editingLayers,
        screenTitle: store.screenTitle,
        apiUrl: store.apiUrl,
        projectName: store.projectName,
      },
    };
    const res = await fetch("/api/save-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const layerCount = store.editingLayers.length;
      const shelfCount = totalShelves.value;
      message.success(
        `配置已发布到 public/asset/warehouse-config.json（${layerCount} 个层，${shelfCount} 个货架）`
      );
    } else {
      const err = await res.json().catch(() => ({ error: "未知错误" }));
      message.error(`发布失败: ${err.error}`);
    }
  } catch {
    message.error("发布失败，请确认开发服务器已启动 (npm run dev)");
  }
}

async function handleSave(): Promise<void> {
  await saveVersionedConfig();
}

function handleExport(): void {
  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    layers: store.editingLayers,
    screenTitle: store.screenTitle,
    apiUrl: store.apiUrl,
    projectName: store.projectName,
  };
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `warehouse-config-${new Date()
    .toLocaleString()
    .slice(0, 19)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  const layerCount = store.editingLayers.length;
  const shelfCount = totalShelves.value;
  message.success(`配置已导出：${layerCount} 个层，${shelfCount} 个货架`);
}

function validateImportData(data: unknown): {
  valid: boolean;
  error?: string;
  layers?: unknown[];
  screenTitle?: string;
  apiUrl?: string;
  projectName?: string;
} {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "文件内容不是有效的 JSON 对象" };
  }

  const obj = data as Record<string, unknown>;

  if (Array.isArray(obj.layers)) {
    return {
      valid: true,
      layers: obj.layers,
      screenTitle:
        typeof obj.screenTitle === "string" ? obj.screenTitle : undefined,
      apiUrl: typeof obj.apiUrl === "string" ? obj.apiUrl : undefined,
    };
  }

  if (Array.isArray(data)) {
    for (const item of data as unknown[]) {
      if (item && typeof item === "object" && "layerId" in (item as object)) {
        return { valid: true, layers: data as unknown[] };
      }
    }
    return {
      valid: false,
      error: "JSON 数组中的元素不包含 layerId 字段，无法识别为仓库配置",
    };
  }

  return {
    valid: false,
    error:
      "JSON 数据缺少 layers 字段，且不是有效的层数组。请确认文件为仓库配置导出文件",
  };
}

function handleImport(): void {
  const hasData =
    store.editingLayers.length > 0 &&
    store.editingLayers.some((l) => l.warehouses.length > 0);

  if (hasData) {
    Modal.confirm({
      title: "导入配置",
      content:
        "导入将覆盖当前所有配置数据（包括层、仓库、货架）。当前数据将丢失，确定要继续吗？",
      okText: "导入并覆盖",
      okType: "danger",
      cancelText: "取消",
      onOk: () => doImport(),
    });
  } else {
    doImport();
  }
}

function doImport(): void {
  if (!fileInputRef.value) {
    fileInputRef.value = document.createElement("input");
    fileInputRef.value.type = "file";
    fileInputRef.value.accept = ".json";
    fileInputRef.value.style.display = "none";
    document.body.appendChild(fileInputRef.value);
    fileInputRef.value.addEventListener("change", onFileSelected);
  }
  fileInputRef.value.click();
}

function onFileSelected(e: Event): void {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    message.error("文件过大（超过 10MB），请检查文件");
    target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const raw = JSON.parse(evt.target?.result as string);
      const validation = validateImportData(raw);

      if (!validation.valid) {
        message.error(validation.error || "文件格式错误，无法导入");
        return;
      }

      store.initEditingLayers(validation.layers as any);
      if (validation.projectName) {
        store.projectName = validation.projectName;
      }
      if (validation.screenTitle) {
        store.screenTitle = validation.screenTitle;
      }
      if (validation.apiUrl) {
        store.apiUrl = validation.apiUrl;
      }
      const layerCount = store.editingLayers.length;
      const shelfCount = store.editingLayers.reduce(
        (sum, l) =>
          sum + l.warehouses.reduce((s, w) => s + w.shelves.length, 0),
        0
      );
      message.success(`配置已导入：${layerCount} 个层，${shelfCount} 个货架`);
    } catch {
      message.error("JSON 解析失败，请确认文件内容完整且格式正确");
    }
  };
  reader.onerror = () => {
    message.error("文件读取失败，请重试");
  };
  reader.readAsText(file);
  target.value = "";
}

function handleReset(): void {
  Modal.confirm({
    title: "确认重置",
    content: "重置将清除所有配置数据，恢复到默认状态。确定要继续吗？",
    okText: "重置",
    okType: "danger",
    cancelText: "取消",
    onOk: () => {
      store.initEditingLayers();
      store.screenTitle = "智能仓储数字孪生平台";
      store.apiUrl = "http://127.0.0.1:8080";
      store.projectName = "默认项目";
      message.success("配置已重置");
    },
  });
}
</script>

<style scoped>
.config-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1a1a2e;
  color: #e0e0e0;
}

.config-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #16213e;
  border-bottom: 1px solid #2a2a4a;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.toolbar-info {
  color: #8899aa;
  font-size: 13px;
}

.btn-add-layer {
  border-color: #2d6a4f !important;
  color: #52b788 !important;
  background: rgba(45, 106, 79, 0.15) !important;
}

.btn-add-layer:hover {
  border-color: #52b788 !important;
  color: #74c69d !important;
  background: rgba(45, 106, 79, 0.25) !important;
}

.btn-add-wh {
  border-color: #1e6091 !important;
  color: #48b1e0 !important;
  background: rgba(30, 96, 145, 0.15) !important;
}

.btn-add-wh:hover {
  border-color: #48b1e0 !important;
  color: #68c8f0 !important;
  background: rgba(30, 96, 145, 0.25) !important;
}

.config-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.config-left {
  width: 250px;
  flex-shrink: 0;
  border-right: 1px solid #2a2a4a;
  background: #16213e;
  overflow-y: auto;
}

.config-center {
  flex: 1;
  overflow: hidden;
  background: #0f0f23;
}

.config-right {
  width: 300px;
  flex-shrink: 0;
  border-left: 1px solid #2a2a4a;
  background: #16213e;
  overflow-y: auto;
}
</style>