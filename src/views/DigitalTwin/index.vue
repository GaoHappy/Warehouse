<template>
  <div class="digital-twin-page">
    <div class="dt-header">
      <div class="dt-header__line left"></div>
      <span class="dt-header__title">{{ warehouseStore.screenTitle }}</span>
      <div class="dt-header__line right"></div>
    </div>

    <div class="dt-canvas-wrapper">
      <div ref="canvasContainer" class="dt-canvas"></div>
    </div>

    <template v-if="!isLiteMode">
      <div class="hud-date">{{ dateText }}</div>
      <div class="hud-time">{{ timeText }}</div>

      <div class="hud-col hud-col--left">
        <div class="hud-item">
          <HudKpiCard :data="dashboardData.Overview" />
        </div>
        <div class="hud-item">
          <HudTaskStatus :data="dashboardData.TaskStatus" />
        </div>
        <div class="hud-item">
          <HudRecentOrders :data="dashboardData.RecentOrders" />
        </div>
      </div>

      <div class="hud-col hud-col--right">
        <div class="hud-item">
          <HudLocationOverview :data="dashboardData.LocationUtilization" />
        </div>
        <div class="hud-item">
          <HudDeviceStatus :data="dashboardData.DeviceStatus" />
        </div>
        <div class="hud-item">
          <HudSkuTop10 :data="dashboardData.SkuTop10" />
        </div>
      </div>
    </template>

    <div v-if="isLiteMode" class="dt-lite-watermark">
      {{ warehouseStore.screenTitle }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute } from "vue-router";
import HudKpiCard from "./components/HudKpiCard.vue";
import HudSkuTop10 from "./components/HudSkuTop10.vue";
import HudDeviceStatus from "./components/HudDeviceStatus.vue";
import HudTaskStatus from "./components/HudTaskStatus.vue";
import HudRecentOrders from "./components/HudRecentOrders.vue";
import HudLocationOverview from "./components/HudLocationOverview.vue";
import { WarehouseSceneManager } from "@/three/core/WarehouseSceneManager";
import { LocationManager } from "@/three/managers/LocationManager";
import { LocationBuilder } from "@/three/builders/LocationBuilder";
import { LayerWarehouseBuilder } from "@/three/builders/LayerWarehouseBuilder";
import { useWarehouseStore } from "@/stores/warehouse";
import type { LayerConfig } from "@/models/warehouse";
import type { LocationStatusDto } from "@/models/location";
import { LocationStatus } from "@/models/location";

const route = useRoute();
const isLiteMode = computed(
  () => import.meta.env.VITE_APP_MODE === "lite" || route.query.mode === "lite"
);

const canvasContainer = ref<HTMLElement | null>(null);
const warehouseStore = useWarehouseStore();

const dateText = ref("");
const timeText = ref("");
let clockTimer: ReturnType<typeof setInterval> | null = null;

function updateDateTime(): void {
  const now = new Date();
  const weekDays = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ];
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  dateText.value = `${y}-${m}-${d} ${weekDays[now.getDay()]}`;
  timeText.value = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
}

interface DashboardData {
  Overview: {
    TotalStockQty: number;
    TodayInboundCount: number;
    TodayOutboundCount: number;
    PendingTaskCount: number;
    TodayInboundTrend: number | null;
    TodayOutboundTrend: number | null;
  };
  Trend: Array<{ OrderDate: string; Inbound: number; Outbound: number }>;
  LocationUtilization: Array<{
    RegionCode: string;
    RegionName: string;
    TotalLocations: number;
    UsedLocations: number;
    UtilizationRate: number;
  }>;
  TaskStatus: {
    HandleCreateCount: number;
    HandleActiveCount: number;
    HandleCompleteCount: number;
    ConveyCreateCount: number;
    ConveyActiveCount: number;
    ConveyCompleteCount: number;
  };
  RecentOrders: Array<{
    OrderNo: string;
    OrderType: number;
    OrderTypeName: string;
    RegionCode: string;
    CreateTime: string;
    OrderStatus: number;
  }>;
  SkuTop10: Array<{ SkuNo: string; SkuName: string; StockQty: number }>;
  DeviceStatus: Array<{
    SubSysCode: string;
    SubSysName: string;
    SubSysIP: string;
    SubSysPort: number;
    Online: boolean;
  }>;
}

const dashboardData = ref<DashboardData>({
  Overview: {
    TotalStockQty: 0,
    TodayInboundCount: 0,
    TodayOutboundCount: 0,
    PendingTaskCount: 0,
    TodayInboundTrend: null,
    TodayOutboundTrend: null,
  },
  Trend: [],
  LocationUtilization: [],
  TaskStatus: {
    HandleCreateCount: 0,
    HandleActiveCount: 0,
    HandleCompleteCount: 0,
    ConveyCreateCount: 0,
    ConveyActiveCount: 0,
    ConveyCompleteCount: 0,
  },
  RecentOrders: [],
  SkuTop10: [],
  DeviceStatus: [],
});

let sceneManager: WarehouseSceneManager | null = null;
let locationManager: LocationManager | null = null;
let warehouseBuilder: LayerWarehouseBuilder | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
const POLL_INTERVAL = 10000;

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
    /* ignore */
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
      /* ignore */
    }
  }
  return null;
}

async function fetchDashboardData(): Promise<void> {
  try {
    const apiUrl = warehouseStore.apiUrl || "http://127.0.0.1:8080";
    const res = await fetch(
      `${apiUrl}/api/dashboard/BigScreen/getBigScreenData`
    );
    if (!res.ok) return;
    const json = await res.json();
    if (json.data) {
      dashboardData.value = {
        Overview: json.data.Overview || dashboardData.value.Overview,
        Trend: json.data.Trend || [],
        LocationUtilization: json.data.LocationUtilization || [],
        TaskStatus: json.data.TaskStatus || dashboardData.value.TaskStatus,
        RecentOrders: json.data.RecentOrders || [],
        SkuTop10: json.data.SkuTop10 || [],
        DeviceStatus: json.data.DeviceStatus || [],
      };

      if (json.data.LocationView && locationManager) {
        const allLocations: Array<{
          LocationCode: string;
          StatusView: string;
          Column: number;
          Level: number;
          StockQty?: number;
        }> = [];
        for (const view of json.data.LocationView) {
          if (view.Locations) {
            allLocations.push(...view.Locations);
          }
        }
        const statuses: LocationStatusDto[] = allLocations.map((item) => {
          let status: LocationStatus;
          switch (item.StatusView) {
            case "Occupy":
              status = LocationStatus.Occupied;
              break;
            case "Lock":
              status = LocationStatus.Locked;
              break;
            case "Enabled":
              status = LocationStatus.Disabled;
              break;
            default:
              status = LocationStatus.Empty;
          }
          return {
            locationCode: item.LocationCode,
            status,
            column: item.Column,
            layer: item.Level,
            quantity: item.StockQty ?? 0,
          };
        });
        locationManager.updateStatuses(statuses);
        warehouseStore.setLocationStatuses(statuses);
      }
    }
  } catch {
    /* 后端不可用时静默跳过 */
  }
}

function initScene(): void {
  if (!canvasContainer.value) return;

  locationManager = new LocationManager();
  const locationBuilder = new LocationBuilder(locationManager);
  warehouseBuilder = new LayerWarehouseBuilder(
    locationBuilder,
    locationManager
  );

  sceneManager = new WarehouseSceneManager(canvasContainer.value);
  sceneManager.initialize();
  warehouseBuilder.build(warehouseStore.editingLayers, sceneManager);

  sceneManager.start();
  sceneManager.resize();
  window.addEventListener("resize", () => sceneManager?.resize());
}

async function initPage(): Promise<void> {
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

  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 100));
  initScene();

  warehouseStore.setLoading(false);

  fetchDashboardData();
  pollTimer = setInterval(fetchDashboardData, POLL_INTERVAL);
}

function destroy(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  window.removeEventListener("resize", () => sceneManager?.resize());
  locationManager?.clear();
  sceneManager?.destroy();
  sceneManager = null;
  locationManager = null;
  warehouseBuilder = null;
}

onMounted(() => {
  updateDateTime();
  clockTimer = setInterval(updateDateTime, 1000);
  initPage();
});

onUnmounted(() => {
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
  destroy();
});
</script>

<style scoped>
.digital-twin-page {
  width: 100%;
  height: 100%;
  position: relative;
  background: #020d1a;
  overflow: hidden;
  font-family: "HanYiYaKuHei", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.dt-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  z-index: 100;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(0, 30, 60, 0.95) 0%,
    rgba(0, 20, 40, 0.5) 80%,
    transparent 100%
  );
}

.dt-header__line {
  width: 80px;
  height: 1px;
  position: relative;
}

.dt-header__line::before,
.dt-header__line::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  transform: translateY(-50%);
  background: rgba(0, 200, 255, 0.8);
  box-shadow: 0 0 8px rgba(0, 200, 255, 0.5);
}

.dt-header__line.left {
  background: linear-gradient(90deg, transparent, rgba(0, 200, 255, 0.4));
}

.dt-header__line.left::before {
  left: 0;
}

.dt-header__line.right {
  background: linear-gradient(90deg, rgba(0, 200, 255, 0.4), transparent);
}

.dt-header__line.right::after {
  right: 0;
}

.dt-header__title {
  font-size: 1.7rem;
  font-weight: 700;
  color: #e0f0ff;
  letter-spacing: 0.12em;
  text-shadow: 0 0 30px rgba(0, 180, 240, 0.4);
}

.dt-canvas-wrapper {
  width: 100%;
  height: 100%;
}

.dt-canvas {
  width: 100%;
  height: 100%;
}

.hud-col {
  position: absolute;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: auto;
  width: 280px;
  top: 66px;
  bottom: 14px;
}

.hud-col--left {
  left: 14px;
}

.hud-col--right {
  right: 14px;
}

.hud-date {
  position: absolute;
  top: 10px;
  left: 16px;
  z-index: 110;
  font-size: 15px;
  font-weight: 600;
  color: #e0f0ff;
  padding: 4px 14px;
  letter-spacing: 0.05em;
  pointer-events: none;
}

.hud-time {
  position: absolute;
  top: 10px;
  right: 16px;
  z-index: 110;
  font-size: 15px;
  font-weight: 600;
  color: #e0f0ff;
  padding: 4px 14px;
  letter-spacing: 0.05em;
  pointer-events: none;
}

.hud-item {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.hud-item:first-child {
  flex: 1.2;
}

.hud-item:last-child {
  flex: 1.5;
}

.hud-item :deep(.hud-panel) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.hud-item :deep(.hud-panel__body) {
  flex: 1;
  min-height: 0;
}

.hud-item:last-child :deep(.hud-panel__body) {
  overflow-y: auto;
}

.hud-item:last-child :deep(.hud-panel__body)::-webkit-scrollbar {
  width: 3px;
}

.hud-item:last-child :deep(.hud-panel__body)::-webkit-scrollbar-thumb {
  background: rgba(0, 180, 240, 0.2);
  border-radius: 2px;
}

.hud-zone {
  position: absolute;
  z-index: 50;
  pointer-events: auto;
}

.dt-lite-watermark {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  color: rgba(0, 200, 255, 0.3);
  letter-spacing: 0.12em;
  z-index: 50;
  pointer-events: none;
}
</style>