# 项目记忆

## 一、项目概述

| 项           | 内容                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **项目名称** | WMS 仓库 3D 可视化系统                                                                                                    |
| **项目定位** | 智能仓储前端 3D 可视化系统。支持仓库结构（层/仓库/区域/货架/货位）的在线配置与 3D 实时渲染，货位状态通过后端 API 查询展示 |
| **当前阶段** | 核心功能已实现：3D 场景渲染、2D 配置编辑、货位交互、状态可视化、数据持久化                                                |

---

## 二、技术栈

| 层             | 技术               | 版本             | 用途                                      |
| -------------- | ------------------ | ---------------- | ----------------------------------------- |
| **框架**       | Vue 3 + TypeScript | ^3.4.38          | 响应式 UI 框架                            |
| **构建**       | Vite               | ^5.4.3           | 开发服务器 & 构建工具                     |
| **3D 引擎**    | Three.js           | ^0.168.0         | WebGL 3D 渲染核心                         |
| **3D 交互**    | OrbitControls      | 内置             | 相机轨道控制（旋转/缩放/平移）            |
| **2D 画布**    | Konva + vue-konva  | ^10.3.1 / ^3.4.0 | 配置页 2D 俯视图 & 拖拽编辑               |
| **UI 组件**    | Ant Design Vue     | ^4.2.6           | UI 组件库（Tree/Form/Modal/Descriptions） |
| **状态管理**   | Pinia              | ^2.2.2           | Composition API 风格全局状态管理          |
| **路由**       | Vue Router         | ^4.4.3           | Hash 模式路由                             |
| **HTTP**       | Axios / Fetch      | ^1.7.7           | HTTP 请求（Axios 已安装，API 层用 fetch） |
| **颜色选择器** | @simonwep/pickr    | 内置             | 货架颜色配置选择                          |
| **补间动画**   | @tweenjs/tween.js  | 内置             | 相机/物体平滑过渡动画（已安装，待集成）   |

---

## 三、系统架构

### 3.1 整体分层架构

```
┌──────────────────────────────────────────────────────────────────┐
│                        视图层 (Views)                             │
│  Warehouse3D/index.vue          WarehouseConfig/index.vue         │
│  3D 可视化主视图                 配置编辑主视图                      │
└──────────────┬───────────────────────────────┬───────────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────────┐
│      组件层 (Components)      │ │       配置子视图 (Config Sub)      │
│  WarehouseToolbar.vue        │ │  LeftPanel.vue  (模板 & 结构树)    │
│  WarehouseLegend.vue         │ │  KonvaStage.vue (2D 画布编辑)     │
│  LocationDetailPanel.vue     │ │  RightPanel.vue (属性编辑面板)     │
└──────────────┬───────────────┘ └───────────────┬──────────────────┘
               │                                 │
               ▼                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                     状态管理层 (Pinia Store)                       │
│                     useWarehouseStore                             │
│  仓库配置 / 货位状态 / 选中状态 / 编辑状态 / 树结构 / 持久化          │
└──────────────────────────┬───────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                  ▼
┌─────────────────┐ ┌──────────────┐ ┌──────────────────────┐
│  Three.js 引擎层  │ │  数据提供层   │ │     工具 & 模型层      │
│  (three/)        │ │  (data/)      │ │  (models/ + utils/)  │
│                  │ │               │ │                      │
│  core/           │ │ providers/    │ │ models/warehouse.ts  │
│  builders/       │ │   IWarehouse- │ │ models/location.ts   │
│  managers/       │ │   DataProvider│ │ models/common.ts     │
│  interactions/   │ │               │ │                      │
│  materials/      │ │ MockWarehouse-│ │ three/utils/         │
│  utils/          │ │ DataProvider  │ │   CoordinateUtils    │
│                  │ │               │ │   LocationCodeGen    │
│                  │ │ ApiWarehouse- │ │   DisposeUtils       │
│                  │ │ DataProvider  │ │                      │
└─────────────────┘ └──────────────┘ └──────────────────────┘
```

### 3.2 路由设计

| 路径                | 名称            | 组件                              | 说明                      |
| ------------------- | --------------- | --------------------------------- | ------------------------- |
| `/`                 | (重定向)        | → `/warehouse-config`             | 默认进入配置页            |
| `/warehouse3d`      | Warehouse3D     | `views/Warehouse3D/index.vue`     | 3D 可视化 + 层级树 + 详情 |
| `/warehouse-config` | WarehouseConfig | `views/WarehouseConfig/index.vue` | 2D 配置编辑器             |

使用 `createWebHashHistory`（Hash 模式），适配静态部署场景。

---

## 四、Three.js 3D 引擎架构

### 4.1 核心管理器 (core/)

Three.js 场景采用 **管理器分离** 模式，将场景初始化、相机、光照、渲染器各自封装为独立管理器，由 `WarehouseSceneManager` 统一协调。

#### 4.1.1 WarehouseSceneManager（场景总控）

[WarehouseSceneManager.ts](file:///e:/WorkDoc/06.智能仓储/04.Code/Front/src/three/core/WarehouseSceneManager.ts)

- **职责**：场景生命周期管理（初始化 → 渲染循环 → 销毁）
- **原理**：基于 `requestAnimationFrame` 驱动渲染循环，每帧更新 OrbitControls 后执行渲染
- **关键设计**：
  - 渲染循环有 `isRunning` 标志位，防止重复启动
  - `destroy()` 方法逐层清理：停止循环 → 移除灯光 → 遍历场景子节点并 dispose Geometry/Material → 销毁 Renderer
  - 提供 `addToScene` / `removeFromScene` 封装，统一管理场景对象

#### 4.1.2 CameraManager（相机管理）

[CameraManager.ts](file:///e:/WorkDoc/06.智能仓储/04.Code/Front/src/three/core/CameraManager.ts)

- **相机类型**：PerspectiveCamera（透视相机），FOV=50°，近裁面 0.5m，远裁面 200m
- **交互控制**：OrbitControls（轨道控制），支持旋转、缩放、平移
- **关键参数**：
  - `minDistance=3, maxDistance=60`：限制缩放范围
  - `maxPolarAngle=Math.PI/2.2`：限制俯仰角，防止翻到底部
  - `enableDamping=true, dampingFactor=0.1`：启用惯性阻尼
- **聚焦功能**：`focusObject(target)` 将相机移动到目标位置（target + (5, 8, 5)）

#### 4.1.3 LightManager（光照管理）

[LightManager.ts](file:///e:/WorkDoc/06.智能仓储/04.Code/Front/src/three/core/LightManager.ts)

- **三点光照系统**：
  - `AmbientLight(0xffffff, 0.6)`：环境光，提供基础亮度
  - `DirectionalLight(0xffffff, 0.8)`：主方向光，投射阴影，位于 (15, 20, 15)
  - `DirectionalLight(0x8899cc, 0.3)`：补光，位于 (-10, 10, -10)，冷色调，减少暗部过黑
- **阴影配置**：Shadow Map 分辨率 2048×2048，类型 PCFSoftShadowMap

#### 4.1.4 RendererManager（渲染器管理）

[RendererManager.ts](file:///e:/WorkDoc/06.智能仓储/04.Code/Front/src/three/core/RendererManager.ts)

- **渲染器**：WebGLRenderer，抗锯齿开启，透明背景
- **像素比**：`Math.min(devicePixelRatio, 2)`，限制最大像素比以保证性能
- **阴影**：启用 Shadow Map，使用 PCFSoft 软阴影
- **背景色**：`0x1a1a2e`（深蓝黑）

### 4.2 构建器模式 (builders/)

采用 **Builder 模式** 构建 3D 场景对象，每一层配置对象对应一个 Builder，负责将配置数据转换为 Three.js 3D 对象。

#### 构建器层级关系

```
LayerWarehouseBuilder（层+仓库）
├── 遍历 LayerConfig[] → 为每层创建 Group
│   └── 遍历 WarehouseConfig[] → 为每个仓库创建 Group
│       ├── buildWarehouseGround() → 仓库地面 + 边框
│       └── ShelfBuilder → 为每个货架创建 Group
│           ├── buildFrame() → 货架框架（立柱+横梁+层板）
│           └── LocationBuilder → 为每个货位创建容器
│               ├── buildContainer() → 货位容器（底板+侧壁+前后壁）
│               └── LocationManager.register() → 注册货位对象
```

#### 4.2.1 LayerWarehouseBuilder（层+仓库构建器）

[LayerWarehouseBuilder.ts](file:///e:/WorkDoc/06.智能仓储/04.Code/Front/src/three/builders/LayerWarehouseBuilder.ts)

- **核心原理**：将毫米单位的配置数据转换为米单位的 Three.js 坐标
- **坐标转换**：`MM_TO_M = 1/1000`，所有位置、尺寸均乘以该系数
- **层级结构**：Layer Group → Warehouse Group → Shelf Group → Location Group
- **Z 轴定位**：层使用 `layer.zCoord` 作为 Y 轴位置（Three.js 中 Y 轴为高度）

#### 4.2.2 ShelfBuilder（货架构建器）

[ShelfBuilder.ts](file:///e:/WorkDoc/06.智能仓储/04.Code/Front/src/three/builders/ShelfBuilder.ts)

- **货架框架**：4 根立柱（BoxGeometry 0.15×h×0.15）+ 上/下横梁（前后各 2 根 + 左右各 2 根）
- **层板**：根据 `layers` 数量均匀分布，每层高度 = `height / layers`
- **材质**：金属质感（`roughness: 0.5, metalness: 0.7`），颜色 `0x607d8b`（蓝灰）
- **旋转支持**：`group.rotation.y = shelfConfig.rotationY`，支持货架旋转摆放

#### 4.2.3 LocationBuilder（货位构建器）

[LocationBuilder.ts](file:///e:/WorkDoc/06.智能仓储/04.Code/Front/src/three/builders/LocationBuilder.ts)

- **货位容器**：只有底板 + 左右侧壁 + 前后壁（无顶板），开放顶部以展示货物
- **共享几何体优化**：`sharedBottomGeo`、`sharedSideWallGeo`、`sharedFrontWallGeo` 均为单例，所有货位共用同一 Geometry 实例，显著减少 GPU 内存占用
- **货物块**：每个货位默认 3 个货物块（`CARGO_BLOCK_COUNT=3`），块之间有间隙（`BLOCK_GAP_RATIO=0.2`）
- **货位编码生成**：`LocationCodeGenerator.generateLocationCode()` 生成 `{shelfCode}-{row}-{col}-{layer}` 格式编码
- **容器可见性**：默认 `container.visible = false`，初始隐藏所有货位容器，待状态更新时才显示

### 4.3 管理器模式 (managers/)

#### 4.3.1 LocationManager（货位管理器）

[LocationManager.ts](file:///e:/WorkDoc/06.智能仓储/04.Code/Front/src/three/managers/LocationManager.ts)

- **核心数据结构**：`Map<string, LocationObject>`，以 `locationCode` 为键
- **LocationObject 结构**：
  ```typescript
  interface LocationObject {
    cargoGroup: THREE.Group // 货物块容器（用于渲染货物）
    container: THREE.Group // 货位容器（底板+侧壁，用于显示边界）
    locationCode: string // 货位编码
    shelfCode: string // 所属货架编码
    row: number
    column: number
    layer: number // 位置索引
    status: LocationStatus // 状态枚举
    quantity: number // 货物数量
  }
  ```
- **状态驱动渲染**：
  - `Empty` → 隐藏 container，清空 cargoGroup
  - `Occupied`（有数量）→ 显示 container，填充 3 个货物块
  - 其他状态（有数量为 0）→ 显示 container，添加不可见块（用于射线检测）
- **货物块排列**：沿 Z 轴（深度方向）排列，`z = innerStartZ + blockD/2 + i × (blockD + gap)`

#### 4.3.2 SelectionManager（选择管理器）

[SelectionManager.ts](file:///e:/WorkDoc/06.智能仓储/04.Code/Front/src/three/managers/SelectionManager.ts)

- **状态管理**：维护 `selectedLocation` 和 `hoveredLocation` 两个状态
- **观察者模式**：通过回调函数 `onSelectionChange` / `onHoverChange` 通知外部
- **去重逻辑**：`select()` 和 `hover()` 方法内部判断是否与当前值相同，避免重复触发

#### 4.3.3 SceneObjectManager（场景对象管理器）

[SceneObjectManager.ts](file:///e:/WorkDoc/06.智能仓储/04.Code/Front/src/three/managers/SceneObjectManager.ts)

- 维护交互对象列表，供 Raycaster 射线检测使用

### 4.4 交互系统 (interactions/)

#### 4.4.1 RaycastManager（射线交互管理器）

[RaycastManager.ts](file:///e:/WorkDoc/06.智能仓储/04.Code/Front/src/three/interactions/RaycastManager.ts)

- **核心原理**：基于 Three.js `Raycaster` 实现鼠标拾取
- **坐标转换**：屏幕坐标 → NDC（归一化设备坐标）：
  ```
  mouse.x = (clientX - rect.left) / rect.width * 2 - 1
  mouse.y = -(clientY - rect.top) / rect.height * 2 + 1
  ```
- **检测流程**：
  1. 遍历所有 LocationObject 的 cargoGroup 中的 Mesh 子节点
  2. 收集所有 Mesh 组成待检测数组
  3. `raycaster.intersectObjects(meshes, false)` 执行射线检测（不递归子节点）
  4. 通过 `mesh.userData.locationCode` 反查 LocationObject，去重
- **交互效果**：
  - **悬停（hover）**：设置 `material.emissive = 0x333333`（微弱发光）
  - **选中（click）**：设置 `material.emissive = 0x666666`（较强发光）
  - 每次切换前清除上一次的效果（`emissive = 0x000000`）

### 4.5 材质系统 (materials/)

#### 4.5.1 LocationStatusMaterialManager（货位状态材质管理器）

[LocationStatusMaterialManager.ts](file:///e:/WorkDoc/06.智能仓储/04.Code/Front/src/three/materials/LocationStatusMaterialManager.ts)

- **状态 → 颜色映射**：
  | 状态 | 颜色 | 不透明度 |
  | -------- | -------- | -------- |
  | 空闲 | #4caf50 | 0.5 |
  | 已占用 | #5b9bd5 | 0.9 |
  | 锁定 | #e8b830 | 0.8 |
  | 禁用 | #8c8c8c | 0.35 |
  | 故障 | #e05555 | 0.85 |
- **缓存优化**：使用 `Map<number, Material>` 缓存每种状态的材质，避免重复创建
- **单例导出**：`locationStatusMaterialManager` 为全局单例，模块级共享

### 4.6 工具函数 (utils/)

- **CoordinateUtils.ts**：向量坐标转换（当前为透传，预留扩展空间）
- **LocationCodeGenerator.ts**：货位编码生成与解析，格式 `{shelfCode}-{row2位}-{col2位}-{layer2位}`
- **DisposeUtils.ts**：Three.js 资源释放工具，递归释放 Mesh/Geometry/Material/Texture/Group/Scene

---

## 五、Konva 2D 配置编辑器架构

### 5.1 设计原理

配置页使用 Konva（基于 HTML5 Canvas 的 2D 图形库）实现仓库的 **俯视图（Top-Down View）** 编辑器，支持拖拽式布局。

### 5.2 核心组件

#### 5.2.1 KonvaStage.vue（2D 画布主组件）

[KonvaStage.vue](file:///e:/WorkDoc/06.智能仓储/04.Code/Front/src/views/WarehouseConfig/KonvaStage.vue)

- **三层结构**：
  - `gridLayer`：网格背景层（绘制参考网格线，辅助对齐）
  - `layerRef`：主体内容层（仓库、货架的矩形 + 文字标签）
  - `guideLayerRef`：辅助线层（拖拽时的对齐参考线）
- **视图模式**：
  - **根节点选中（`isRootSelected`）**：显示所有层的侧视图（Layer 列表），支持拖拽调整层位置
  - **层选中**：显示该层下所有仓库的俯视图，支持拖拽仓库和货架
- **坐标缩放**：`SCALE = 0.2`，即 1mm = 0.2px，在 Canvas 上进行等比缩放
- **网格对齐**：`GRID_MM = 100mm`（网格间距），`SNAP_THRESHOLD_PX = 5px`（吸附阈值）

#### 5.2.2 拖拽交互

- **货架拖拽**：拖拽货架 Group 调整其 position，释放时自动吸附到网格
- **仓库拖拽**：按住 Shift 键拖拽仓库 Group，调整其 offsetX/offsetY
- **层拖拽**：在根节点视图下拖拽层 Group，调整其 offsetY（层间距）和 Z 坐标
- **框选**：支持鼠标拖拽绘制矩形框进行多选货架

#### 5.2.3 LeftPanel.vue（左侧面板）

- 货架模板列表（拖拽添加货架）
- 结构树（Tree 组件，展示 层→仓库→货架→货位 层级）

#### 5.2.4 RightPanel.vue（右侧面板）

- 选中对象的属性编辑（货架编号/名称/尺寸/颜色等）
- 仓库总览统计

---

## 六、数据架构

### 6.1 数据模型 (models/)

```
Vector3Config { x, y, z }                         // 三维坐标

LayerConfig {
  layerId, layerCode, layerName, layerLevel,
  height, offsetX, offsetY, zCoord,                // zCoord 决定 3D 中的 Y 轴位置
  warehouses: WarehouseConfig[]
}

WarehouseConfig {
  warehouseId, warehouseCode, warehouseName,
  width, length, height, offsetX, offsetY,
  areas: AreaConfig[], shelves: ShelfConfig[]
}

AreaConfig { areaId, areaCode, areaName, position: Vector3Config, width, length }

ShelfConfig {
  shelfId, shelfCode, shelfName,
  position: Vector3Config, rotationY,
  rows, columns, layers,                         // 货位布局：列数×排数×层数
  width, height, depth,                          // 货架整体尺寸 (mm)
  slotWidth, slotHeight, slotDepth,              // 单个货位尺寸 (mm)
  customSlotCodes?: Record<string, string>       // 自定义货位编码映射
}

LocationStatus enum { Empty=0, Occupied=1, Locked=2, Disabled=3, Fault=4 }

LocationStatusDto { locationCode, status, materialCode?, materialName?, quantity? }

LocationDetail { locationCode, shelfCode, row, column, layer, status, ... }
```

### 6.2 坐标体系

| 层级     | 单位   | 说明                                             |
| -------- | ------ | ------------------------------------------------ |
| 配置数据 | **mm** | 所有配置数据以毫米为单位，便于仓库实际尺寸对应   |
| 3D 场景  | **m**  | Three.js 默认单位，通过 `MM_TO_M = 1/1000` 转换  |
| 2D 画布  | **px** | Konva Canvas 像素，通过 `SCALE = 0.2` 从 mm 转换 |

**坐标映射关系**（配置 → 3D）：

- 配置 `(x, y, z)` → Three.js `(x, y, z)`，Y 轴为楼层高度
- `layer.zCoord` → 层的 Y 轴位置（层在垂直方向上的叠加）
- 仓库 `offsetX/offsetY` → 仓库在层内的 X/Z 偏移
- 货架 `position` → 货架在仓库内的位置
- 货位 `(row, col, layer)` → 在货架内的网格位置，通过 gap 间距计算

### 6.3 状态管理 (Pinia Store)

[warehouse.ts](file:///e:/WorkDoc/06.智能仓储/04.Code/Front/src/stores/warehouse.ts)

- **Composition API 风格**：使用 `defineStore` + `setup` 函数
- **核心状态**：
  - `editingLayers: LayerConfig[]`：编辑中的层配置（配置页核心数据）
  - `warehouseConfig: WarehouseConfig | null`：3D 视图使用的仓库配置
  - `locationStatuses: LocationStatusDto[]`：货位状态数据
  - `selectedLayerId / selectedWarehouseId / selectedShelfId`：选中状态
  - `selectedShelfIds: Set<string>`：多选状态（框选）
  - `stageScale`：2D 画布缩放比例
  - `layerXAligned`：层 X 轴对齐开关
- **计算属性**：
  - `selectedLayer / selectedWarehouse / selectedShelf`：派生选中对象
  - `treeData`：Ant Design Tree 组件数据源
  - `isRootSelected`：是否选中根节点
- **持久化**：通过 `localStorage.setItem('warehouse-layers', JSON)` 进行浏览器本地存储

### 6.4 数据提供者模式 (data/providers/)

采用 **策略模式** 设计数据访问层：

```
IWarehouseDataProvider (接口)
├── MockWarehouseDataProvider (开发/演示用模拟数据)
└── ApiWarehouseDataProvider (生产环境后端 API)
```

- **MockWarehouseDataProvider**：返回硬编码的模拟数据，每个方法有 200ms 延迟模拟网络请求
- **ApiWarehouseDataProvider**：通过 `fetch` 调用后端 REST API，baseUrl 可配置
- **接口方法**：
  - `getWarehouseConfig(warehouseId)` → 仓库结构配置
  - `getLocationStatuses(warehouseId)` → 批量货位状态
  - `getLocationDetail(locationCode)` → 单个货位详情

### 6.5 模拟数据 (data/mock/)

- **warehouse.mock.ts**：模拟 1 个仓库，3 个区域（A/B/C），每区 3 个货架，每货架 4列×6层=24 个货位
- **location.mock.ts**：基于货架配置自动生成所有货位的状态，使用哈希函数分配状态（约 40% 空闲，30% 占用，10% 锁定，10% 禁用，10% 故障）
- **状态模拟变更**：`simulateLocationStatusChange()` 随机选取一个货位变更状态

---

## 七、关键业务流程

### 7.1 3D 场景初始化流程

```
Warehouse3D/index.vue onMounted()
  → warehouseStore.editingLayers 读取配置
  → 如果没有真实数据，从 localStorage 加载
  → initScene()
    → new WarehouseSceneManager(container)
    → sceneManager.initialize()  // 设置光照 + OrbitControls
    → new LocationManager()
    → new LocationBuilder(locationManager)
    → new LayerWarehouseBuilder(locationBuilder, locationManager)
    → warehouseBuilder.build(layers, sceneManager)  // 构建所有 3D 对象
    → new SelectionManager()
    → new RaycastManager(...)  // 绑定鼠标交互
    → raycastManager.enable()
    → sceneManager.start()  // 启动渲染循环
    → sceneManager.resize()  // 自适应窗口大小
```

### 7.2 货位状态更新流程

```
API 返回 LocationStatusDto[]
  → warehouseStore.setLocationStatuses(statuses)
  → locationManager.updateStatuses(statuses)
    → 遍历每个状态项
    → locationManager.updateStatus(locationCode, status, quantity)
      → 查找 LocationObject
      → 更新 status 和 quantity
      → clearCargoGroup()  // 清除旧货物块
      → 根据状态决定渲染：
        - Empty → container.visible = false
        - Occupied + quantity > 0 → container.visible = true + fillCargoGroup(3)
        - 其他 → container.visible = true + addInvisibleBlock()
```

### 7.3 鼠标交互流程

```
鼠标移动 → RaycastManager.onMouseMove(event)
  → getIntersections(event)
    → 屏幕坐标 → NDC 转换
    → raycaster.setFromCamera(mouse, camera)
    → 收集所有 LocationObject 的 cargoGroup 子 Mesh
    → raycaster.intersectObjects(meshes)
    → 通过 mesh.userData.locationCode 反查 LocationObject
  → 与 previousHover 比较，去重
  → 应用/清除 hover 效果（emissive 变化）
  → selectionManager.hover(locationObj)

鼠标点击 → RaycastManager.onClick(event)
  → 同上获取交点
  → 清除上一个选中效果
  → 应用选中效果
  → selectionManager.select(locationObj)
  → 外部监听 selectionManager.onSelectionChange → 更新 UI
```

### 7.4 配置持久化流程

```
保存：store.editingLayers → JSON.stringify → localStorage.setItem('warehouse-layers')
加载：localStorage.getItem('warehouse-layers') → JSON.parse → store.initEditingLayers()
导出：exportData { version, exportedAt, layers } → Blob → download .json
导入：FileReader.readAsText → JSON.parse → validateImportData → store.initEditingLayers()
```

---

## 八、3D 渲染原理

### 8.1 渲染管线

```
requestAnimationFrame(animate)
  → cameraManager.updateControls()  // 更新 OrbitControls 阻尼
  → rendererManager.render(scene, camera)  // WebGL 渲染

每帧执行，约 60fps（取决于设备性能）
```

### 8.2 共享几何体优化

在 `LocationBuilder` 中，所有货位共享同一组 Geometry 实例：

- 货位容器底板、侧壁、前后壁 → 各一个 `BoxGeometry` 实例
- 货物块 → 一个 `BoxGeometry` 实例

**原理**：Three.js 中，多个 `Mesh` 可以共享同一个 `Geometry` 引用，GPU 只需存储一份顶点数据，不同 Mesh 通过不同的 `position`/`rotation`/`scale` 进行变换。这在大量重复几何体（如数百个货位）的场景下显著减少内存占用。

### 8.3 材质与光照

- **PBR 材质**：使用 `MeshStandardMaterial`（基于物理的渲染），支持 roughness/metalness 参数
- **阴影**：主方向光投射阴影，地面接收阴影，Shadow Map 2048×2048
- **半透明**：状态材质使用 `transparent: true` + 不同 `opacity` 值区分状态

### 8.4 内存管理

- `WarehouseSceneManager.destroy()` 递归清理所有 Geometry 和 Material
- `LocationBuilder.dispose()` 释放共享几何体
- `LocationStatusMaterialManager.dispose()` 释放所有缓存材质
- `DisposeUtils` 提供通用资源释放工具函数

---

## 九、目录结构

```
src/
├── main.ts                          // 入口：创建 Vue App，注册 Pinia/Router/Antd/Konva
├── App.vue                          // 根组件：<router-view />
├── vite-env.d.ts                    // Vite 类型声明
│
├── router/
│   └── index.ts                     // Hash 路由：/warehouse3d, /warehouse-config
│
├── stores/
│   └── warehouse.ts                 // Pinia Store：配置/状态/选中/树结构/持久化
│
├── models/
│   ├── index.ts                     // 统一导出
│   ├── common.ts                    // Vector3Config
│   ├── warehouse.ts                 // LayerConfig, WarehouseConfig, AreaConfig, ShelfConfig
│   └── location.ts                  // LocationStatus enum, LocationStatusDto, LocationDetail
│
├── views/
│   ├── Warehouse3D/
│   │   └── index.vue                // 3D 可视化主视图（Three.js 场景 + 层级树 + 详情面板）
│   └── WarehouseConfig/
│       ├── index.vue                // 配置编辑主视图（工具栏 + 三栏布局）
│       ├── KonvaStage.vue           // 2D 画布编辑器（Konva 俯视图）
│       ├── LeftPanel.vue            // 左侧面板（货架模板 + 结构树）
│       └── RightPanel.vue           // 右侧面板（属性编辑）
│
├── components/
│   ├── WarehouseToolbar.vue         // 3D 视图工具栏（重置视角/全屏）
│   ├── WarehouseLegend.vue          // 状态图例（空闲/占用/锁定/禁用/故障）
│   └── LocationDetailPanel.vue      // 货位详情面板（Ant Design Descriptions）
│
├── three/
│   ├── core/
│   │   ├── WarehouseSceneManager.ts // 场景总控：生命周期管理
│   │   ├── CameraManager.ts         // 相机 + OrbitControls 管理
│   │   ├── LightManager.ts          // 三点光照系统
│   │   └── RendererManager.ts       // WebGLRenderer 管理
│   │
│   ├── builders/
│   │   ├── LayerWarehouseBuilder.ts // 层+仓库构建器（mm→m 转换）
│   │   ├── WarehouseBuilder.ts      // 旧版仓库构建器（兼容）
│   │   ├── AreaBuilder.ts           // 区域构建器（半透明地面+边框）
│   │   ├── ShelfBuilder.ts          // 货架构建器（框架+层板+调用 LocationBuilder）
│   │   └── LocationBuilder.ts       // 货位构建器（容器+共享几何体+注册到 LocationManager）
│   │
│   ├── managers/
│   │   ├── LocationManager.ts       // 货位管理器（Map<code, LocationObject>）
│   │   ├── SelectionManager.ts      // 选择管理器（选中/悬停 + 观察者回调）
│   │   └── SceneObjectManager.ts    // 场景对象管理器（交互对象列表）
│   │
│   ├── interactions/
│   │   └── RaycastManager.ts        // 射线交互（鼠标拾取 + hover/click 效果）
│   │
│   ├── materials/
│   │   └── LocationStatusMaterialManager.ts  // 状态材质（颜色+透明度+缓存）
│   │
│   └── utils/
│       ├── CoordinateUtils.ts       // 坐标转换工具
│       ├── LocationCodeGenerator.ts // 货位编码生成/解析
│       └── DisposeUtils.ts          // Three.js 资源释放工具
│
├── data/
│   ├── providers/
│   │   ├── IWarehouseDataProvider.ts       // 数据提供者接口
│   │   ├── MockWarehouseDataProvider.ts    // 模拟数据实现
│   │   └── ApiWarehouseDataProvider.ts     // API 数据实现
│   └── mock/
│       ├── warehouse.mock.ts        // 模拟仓库配置数据
│       └── location.mock.ts         // 模拟货位状态数据
│
├── index.html                       // HTML 入口
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts                   // Vite 配置（@ 别名 + 端口 3000）
```

---

## 十、设计模式总结

| 模式                | 应用位置                         | 说明                                  |
| ------------------- | -------------------------------- | ------------------------------------- |
| **Builder**         | `three/builders/`                | 将配置数据逐步构建为 3D 对象          |
| **Manager**         | `three/core/`, `three/managers/` | 各子系统独立管理，通过总控协调        |
| **Strategy**        | `data/providers/`                | Mock 与 API 数据源可替换              |
| **Observer**        | `SelectionManager` 回调          | 选中/悬停状态变化通知外部             |
| **Singleton**       | `LocationStatusMaterialManager`  | 全局唯一材质管理器                    |
| **Flyweight**       | `LocationBuilder` 共享几何体     | 多个 Mesh 共享同一 Geometry，减少内存 |
| **Composition API** | `useWarehouseStore`              | Pinia setup store 风格                |

---

## 十一、重要约束

1. **仓库结构（层/仓库/区域/货架/货位）由前端配置**，决定 3D 场景的骨架，可导出为 JSON 文件
2. **货位状态数据来自后端 API**，通过货位编码查询，前端仅负责展示
3. **坐标单位**：配置数据为 **mm**，3D 场景为 **m**（1/1000 转换），2D 画布为 **px**（0.2 比例）
4. **层与层之间通过 `zCoord` 控制垂直间距**，避免视觉重叠
5. **货架在层上的位置由 `position`（mm）决定**，支持 `rotationY` 旋转
6. **相机**：使用 OrbitControls 轨道控制，支持旋转、缩放、平移
7. **性能**：共享几何体、限制像素比 ≤2、Shadow Map 2048
8. **持久化**：配置数据存储在 `localStorage`，支持 JSON 文件导入/导出
9. **路由**：Hash 模式，适配静态文件部署
10. **UI 暗色主题**：全局使用深色配色方案（`#1a1a2e` / `#16213e` / `#0f0f23`）
