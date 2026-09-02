# 3D 仓储可视化 - 绘制原理

## 一、架构总览（分层架构）

```
┌─────────────────────────────────────────────────┐
│  Vue 页面层                                      │
│  Warehouse3D/index.vue  /  PreviewModal.vue      │
│  (初始化管理器、加载配置、调用构建器)              │
├─────────────────────────────────────────────────┤
│  core/    核心引擎                                │
│  WarehouseSceneManager  → 场景总管               │
│  CameraManager           → 相机控制               │
│  RendererManager         → 渲染器                 │
│  LightManager            → 灯光                   │
├─────────────────────────────────────────────────┤
│  builders/  构建器                                │
│  LayerWarehouseBuilder   → 建层+仓库+地面+边框    │
│  ShelfBuilder            → 建货架外框             │
│  LocationBuilder         → 建货位容器+货物块      │
├─────────────────────────────────────────────────┤
│  managers/  管理器                                │
│  LocationManager         → 货位数据(位置/状态/颜色) │
│  SelectionManager        → 选中状态               │
│  SceneObjectManager      → 交互对象列表            │
├─────────────────────────────────────────────────┤
│  interactions/  交互                              │
│  RaycastManager          → 射线检测(鼠标悬停/点击) │
├─────────────────────────────────────────────────┤
│  materials/  材质                                 │
│  LocationStatusMaterialManager → 货位状态颜色      │
├─────────────────────────────────────────────────┤
│  utils/  工具                                     │
│  LocationCodeGenerator    → 货位编码生成           │
│  CoordinateUtils         → 坐标转换               │
│  DisposeUtils            → 资源释放               │
└─────────────────────────────────────────────────┘
```

---

## 二、完整渲染流程

### 第 1 步：页面初始化

```ts
// Warehouse3D/index.vue 中的 onMounted
locationManager = new LocationManager()
const locationBuilder = new LocationBuilder(locationManager)
warehouseBuilder = new LayerWarehouseBuilder(locationBuilder, locationManager)
sceneManager = new WarehouseSceneManager(container)
```

`WarehouseSceneManager` 构造函数做的事：

1. 创建 `THREE.Scene`（场景），背景色 `0x0b1829`（深蓝黑）
2. 创建 `CameraManager`（透视相机，FOV=50°，远近裁剪面 0.5~200m）
3. 创建 `RendererManager`（WebGL 渲染器，抗锯齿，像素比最大 2x）
4. 创建 `LightManager`（灯光管理器）
5. 添加网格地面（`GridHelper`，200×200 格，40 格线）

### 第 2 步：初始化灯光

```ts
sceneManager.initialize()
  → lightManager.setup(scene)
```

添加 3 个光源：

- **环境光**（AmbientLight）：强度 0.8，全局均匀照明
- **主方向光**（DirectionalLight）：强度 0.6，位置 (15, 25, 15)，模拟阳光
- **补光**（DirectionalLight）：强度 0.25，位置 (-10, 10, -10)，减少暗面

### 第 3 步：加载配置数据

```ts
const config = await loadConfig() // 从 JSON 文件加载
```

配置数据结构：

```ts
{
  layers: [
    {
      layerId,
      layerName,
      zCoord, // 层信息
      offsetX,
      offsetY, // 层在画布上的偏移
      warehouses: [
        {
          warehouseId,
          warehouseName, // 仓库信息
          width,
          length,
          height, // 仓库尺寸(mm)
          offsetX,
          offsetY, // 仓库位置(mm)
          shelves: [
            {
              shelfId,
              shelfCode, // 货架信息
              position: { x, y, z }, // 货架位置(mm)
              rows,
              columns,
              layers, // 货架行列层数
              width,
              height,
              depth, // 货架尺寸(mm)
              slotWidth,
              slotHeight,
              slotDepth, // 货位尺寸(mm)
            },
          ],
        },
      ],
    },
  ]
}
```

### 第 4 步：构建 3D 场景

```ts
warehouseBuilder.build(config.layers, sceneManager)
```

调用链：

```
LayerWarehouseBuilder.build()
  │
  ├─→ buildLayer() × N    ← 每个层
  │     │
  │     ├─ 创建 layerGroup（THREE.Group）
  │     ├─ 位置 = (0, layer.zCoord * 0.001, 0)   ← mm→米
  │     │
  │     └─→ buildWarehouse() × N  ← 每个仓库
  │           │
  │           ├─ 创建 whGroup（THREE.Group）
  │           ├─ 位置 = (offsetX, 0, offsetZ) * 0.001
  │           │
  │           ├─→ buildWarehouseGround()
  │           │     ├─ 半透明白色地面（PlaneGeometry）
  │           │     └─→ buildWarehouseBorder()
  │           │           └─ 四条白色边框线（BoxGeometry）
  │           │
  │           └─→ ShelfBuilder.build() × N  ← 每个货架
  │                 │
  │                 ├─ 创建 shelfGroup（THREE.Group）
  │                 ├─ 位置 = (x + width/2, y, z + depth/2)
  │                 │
  │                 ├─→ buildFrame()
  │                 │     ├─ 4根立柱（0.15×高×0.15）
  │                 │     ├─ 4条横梁（顶+底，前+后）
  │                 │     ├─ 4条侧梁（顶+底，左+右）
  │                 │     └─ (layers+1)块层板（宽×0.04×深）
  │                 │
  │                 └─→ LocationBuilder.build()
  │                       │
  │                       └─ 三层循环 (row × col × layer)
  │                             ├─ 计算货位坐标
  │                             ├─ 创建 container（5面板容器，默认隐藏）
  │                             ├─ 创建 cargoGroup（货物组，初始空）
  │                             └─→ locationManager.register()  ← 注册到管理器
  │
  └─→ sceneManager.fitToBounds(box)  ← 自动适配相机视角
```

### 第 5 步：启动渲染循环

```ts
sceneManager.start()
  → requestAnimationFrame(animate)
    → cameraManager.updateControls()    // 更新 OrbitControls
    → rendererManager.render(scene, camera)  // 渲染一帧
```

这是一个 **60fps 的连续渲染循环**。每帧都会：

1. 更新相机控制器（处理用户的旋转/缩放/平移）
2. 用当前相机视角渲染场景

---

## 三、交互系统

### 射线检测（RaycastManager）

```
鼠标移动 / 点击
  │
  ├─ 屏幕坐标 → NDC 坐标（-1 到 1）
  ├─ 从相机发出射线
  ├─ 与所有货位容器的 Mesh 做碰撞检测
  ├─ 找到第一个命中的货位
  │
  ├─ Hover（悬停）：
  │     ├─ 清除上一个悬停的发光效果
  │     ├─ 给当前货位 cargoGroup 设置 emissive = 0x333333（微亮）
  │     └─ 通知 SelectionManager
  │
  └─ Click（点击）：
        ├─ 清除上一个选中的发光效果
        ├─ 给当前货位 cargoGroup 设置 emissive = 0x666666（高亮）
        └─ 通知 SelectionManager
```

### 相机控制（CameraManager）

使用 Three.js 的 **OrbitControls**（轨道控制器）：

- **左键拖拽**：旋转场景
- **滚轮**：缩放（3~60m 范围）
- **右键拖拽**：平移
- **俯仰角限制**：最大 81°（`maxPolarAngle = PI/2.2`），防止翻到底部

---

## 四、货位状态可视化

通过 `LocationManager.updateStatus()` 更新货位显示：

| 状态             | 颜色            | 显示效果                  |
| ---------------- | --------------- | ------------------------- |
| Empty（空）      | `0x1a3a5c` 深蓝 | 半透明容器，无货物        |
| Occupied（占用） | `0x3b82f6` 蓝色 | 方形货物块（88%容器大小） |
| Locked（锁定）   | `0xff7a00` 橙色 | 锁图标（Torus 环 + 矩形） |
| Disabled（禁用） | `0x8c8c8c` 灰色 | 禁止图标（圆环 + 斜杠）   |
| Fault（故障）    | `0x722ed1` 紫色 | 同 Disabled               |

---

## 五、坐标系统

```
    Y (高度)
    ↑
    │
    │
    └──────────→ X (宽度/左右)
   /
  /
 ↙
Z (深度/前后)

货架中心点 = 货架 position + (width/2, 0, depth/2)
             ↑ 因为货架 position 存的是左下角，需要偏移到中心
```

配置数据单位是 **mm**，Three.js 使用 **m**，转换系数 `MM_TO_M = 1/1000`。

---

## 六、两条渲染路径的区别

|        | WarehouseConfig（编辑器） | Warehouse3D（展示）   | Preview（预览）       |
| ------ | ------------------------- | --------------------- | --------------------- |
| 引擎   | Konva.js（2D Canvas）     | Three.js（WebGL）     | Three.js（WebGL）     |
| 交互   | 拖拽/框选/编辑            | 旋转/缩放/点击货位    | **无交互**（只渲染）  |
| 构建器 | 无                        | LayerWarehouseBuilder | LayerWarehouseBuilder |
| 数据源 | 内存 store                | 固定 JSON             | 最新版本化 JSON       |
