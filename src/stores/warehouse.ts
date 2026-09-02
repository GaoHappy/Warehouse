import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  LayerConfig,
  WarehouseConfig,
  ShelfConfig,
} from '@/models/warehouse'
import type { LocationStatusDto, LocationDetail } from '@/models/location'
import { LocationStatus } from '@/models/location'

function createDefaultWarehouse(
  name: string,
  width = 10000,
  length = 8000,
): WarehouseConfig {
  return {
    warehouseId: `WH-${Date.now()}`,
    warehouseCode: name,
    warehouseName: name,
    width,
    length,
    height: 3000,
    areas: [],
    shelves: [],
  }
}

function createDefaultLayer(
  name: string,
  level = 1,
  height = 1000,
  offsetX = 0,
  offsetY = 0,
): LayerConfig {
  return {
    layerId: `LAYER-${Date.now()}`,
    layerCode: String(level),
    layerName: name,
    layerLevel: level,
    height,
    offsetX,
    offsetY,
    zCoord: 0,
    warehouses: [createDefaultWarehouse('仓库01')],
  }
}

export const useWarehouseStore = defineStore('warehouse', () => {
  const warehouseConfig = ref<WarehouseConfig | null>(null)
  const locationStatuses = ref<LocationStatusDto[]>([])
  const selectedLocationDetail = ref<LocationDetail | null>(null)
  const loading = ref(false)
  const screenTitle = ref<string>('智能仓储数字孪生平台')
  const apiUrl = ref<string>('http://127.0.0.1:8080')
  const projectName = ref<string>('默认项目')

  const ROOT_KEY = '__ROOT__'

  const editingLayers = ref<LayerConfig[]>([createDefaultLayer('1层')])
  const selectedLayerId = ref<string | null>(editingLayers.value[0].layerId)
  const selectedWarehouseId = ref<string | null>(
    editingLayers.value[0].warehouses[0].warehouseId,
  )
  const selectedShelfId = ref<string | null>(null)
  const selectedShelfIds = ref<Set<string>>(new Set())
  const selectedNodeKey = ref<string | null>(null)
  const stageScale = ref(1)

  const layerXAligned = ref(true)

  const isRootSelected = computed(() => selectedNodeKey.value === ROOT_KEY)

  const selectedLayer = computed(
    () =>
      editingLayers.value.find((l) => l.layerId === selectedLayerId.value) ??
      null,
  )

  const selectedWarehouse = computed(
    () =>
      selectedLayer.value?.warehouses.find(
        (w) => w.warehouseId === selectedWarehouseId.value,
      ) ?? null,
  )

  const selectedShelf = computed(
    () =>
      selectedWarehouse.value?.shelves.find(
        (s) => s.shelfId === selectedShelfId.value,
      ) ?? null,
  )

  const treeData = computed(() =>
    editingLayers.value.map((layer) => ({
      title: `${layer.layerName} (层高${layer.height}mm)`,
      key: layer.layerId,
      icon: '🏢',
      children: layer.warehouses.map((w) => ({
        title: `${w.warehouseName} (${w.width}×${w.length}mm)`,
        key: w.warehouseId,
        icon: '🏭',
        children: w.shelves.map((s) => ({
          title: `${s.shelfName} [${s.shelfCode}] (${s.rows}列×${s.layers}层)`,
          key: s.shelfId,
          icon: '📦',
          isLeaf: true,
        })),
      })),
    })),
  )

  function setWarehouseConfig(config: WarehouseConfig): void {
    warehouseConfig.value = config
  }

  function setLocationStatuses(statuses: LocationStatusDto[]): void {
    locationStatuses.value = statuses
  }

  function updateLocationStatus(
    locationCode: string,
    status: LocationStatus,
  ): void {
    const existing = locationStatuses.value.find(
      (s) => s.locationCode === locationCode,
    )
    if (existing) {
      existing.status = status
    }
  }

  function setSelectedLocationDetail(detail: LocationDetail | null): void {
    selectedLocationDetail.value = detail
  }

  function setLoading(value: boolean): void {
    loading.value = value
  }

  function initEditingLayers(layers?: LayerConfig[]): void {
    editingLayers.value = layers
      ? JSON.parse(JSON.stringify(layers))
      : [createDefaultLayer('1层')]
    selectedLayerId.value = editingLayers.value[0]?.layerId ?? null
    selectedWarehouseId.value =
      editingLayers.value[0]?.warehouses[0]?.warehouseId ?? null
    selectedShelfId.value = null
  }

  function addLayer(): void {
    const level = editingLayers.value.length + 1
    const prevLayer = editingLayers.value[editingLayers.value.length - 1]
    const prevOffsetY = prevLayer?.offsetY ?? 0
    const height = 1000
    const offsetY = prevOffsetY - height - 5000
    const layer = createDefaultLayer(`${level}层`, level, height, 0, offsetY)
    const prevZCoord = prevLayer?.zCoord ?? 0
    const prevHeight = prevLayer?.height ?? 0
    layer.zCoord = prevZCoord + prevHeight + 500
    editingLayers.value.push(layer)
    selectedLayerId.value = layer.layerId
    selectedWarehouseId.value = layer.warehouses[0]?.warehouseId ?? null
    selectedShelfId.value = null
  }

  function removeLayer(layerId: string): void {
    editingLayers.value = editingLayers.value.filter(
      (l) => l.layerId !== layerId,
    )
    if (selectedLayerId.value === layerId) {
      selectedLayerId.value = editingLayers.value[0]?.layerId ?? null
      selectedWarehouseId.value =
        editingLayers.value[0]?.warehouses[0]?.warehouseId ?? null
      selectedShelfId.value = null
    }
  }

  function selectLayer(layerId: string | null): void {
    selectedLayerId.value = layerId
    selectedWarehouseId.value =
      editingLayers.value.find((l) => l.layerId === layerId)?.warehouses[0]
        ?.warehouseId ?? null
    selectedShelfId.value = null
  }

  function setLayerHeight(height: number): void {
    if (selectedLayer.value) {
      selectedLayer.value.height = height
    }
  }

  function setLayerPosition(
    layerId: string,
    offsetX: number,
    offsetY?: number,
  ): void {
    const layer = editingLayers.value.find((l) => l.layerId === layerId)
    if (layer) {
      layer.offsetX = offsetX
      if (offsetY !== undefined) {
        layer.offsetY = offsetY
      }
    }
  }

  function setLayerZCoord(layerId: string, zCoord: number): void {
    const layer = editingLayers.value.find((l) => l.layerId === layerId)
    if (layer) {
      layer.zCoord = zCoord
    }
  }

  function addWarehouse(): void {
    if (!selectedLayer.value) return
    const idx = selectedLayer.value.warehouses.length + 1
    const wh = createDefaultWarehouse(`仓库${String(idx).padStart(2, '0')}`)
    selectedLayer.value.warehouses.push(wh)
    selectedWarehouseId.value = wh.warehouseId
    selectedShelfId.value = null
  }

  function removeWarehouse(warehouseId: string): void {
    if (!selectedLayer.value) return
    selectedLayer.value.warehouses = selectedLayer.value.warehouses.filter(
      (w) => w.warehouseId !== warehouseId,
    )
    if (selectedWarehouseId.value === warehouseId) {
      selectedWarehouseId.value =
        selectedLayer.value.warehouses[0]?.warehouseId ?? null
      selectedShelfId.value = null
    }
  }

  function selectWarehouse(warehouseId: string | null): void {
    selectedWarehouseId.value = warehouseId
    selectedShelfId.value = null
    if (warehouseId) {
      const layer = editingLayers.value.find((l) =>
        l.warehouses.some((w) => w.warehouseId === warehouseId),
      )
      if (layer) {
        selectedLayerId.value = layer.layerId
      }
    }
  }

  function setWarehouseSize(width: number, length: number): void {
    if (selectedWarehouse.value) {
      selectedWarehouse.value.width = width
      selectedWarehouse.value.length = length
    }
  }

  function setWarehousePosition(offsetX: number, offsetY: number): void {
    if (selectedWarehouse.value) {
      selectedWarehouse.value.offsetX = offsetX
      selectedWarehouse.value.offsetY = offsetY
    }
  }

  function addShelf(shelf: ShelfConfig): void {
    selectedWarehouse.value?.shelves.push(shelf)
  }

  function updateShelf(shelfId: string, updates: Partial<ShelfConfig>): void {
    const idx = selectedWarehouse.value?.shelves.findIndex(
      (s) => s.shelfId === shelfId,
    )
    if (idx !== undefined && idx >= 0 && selectedWarehouse.value) {
      selectedWarehouse.value.shelves[idx] = {
        ...selectedWarehouse.value.shelves[idx],
        ...updates,
      }
    }
  }

  function removeShelf(shelfId: string): void {
    if (selectedWarehouse.value) {
      selectedWarehouse.value.shelves = selectedWarehouse.value.shelves.filter(
        (s) => s.shelfId !== shelfId,
      )
    }
    if (selectedShelfId.value === shelfId) {
      selectedShelfId.value = null
    }
  }

  function deleteSelectedNode(): void {
    if (selectedShelfIds.value.size > 0) {
      if (selectedWarehouse.value) {
        selectedWarehouse.value.shelves =
          selectedWarehouse.value.shelves.filter(
            (s) => !selectedShelfIds.value.has(s.shelfId),
          )
        selectedShelfIds.value = new Set()
        selectedShelfId.value = null
      }
      return
    }

    if (selectedShelf.value) {
      removeShelf(selectedShelf.value.shelfId)
    } else if (selectedWarehouse.value) {
      removeWarehouse(selectedWarehouse.value.warehouseId)
    } else if (selectedLayer.value) {
      removeLayer(selectedLayer.value.layerId)
    }
  }

  function copyShelf(shelfId: string): ShelfConfig | null {
    const wh = selectedWarehouse.value
    if (!wh) return null

    const source = wh.shelves.find((s) => s.shelfId === shelfId)
    if (!source) return null

    const totalShelves =
      selectedLayer.value?.warehouses.reduce(
        (sum, w) => sum + w.shelves.length,
        0,
      ) ?? 0
    const newId = `SHELF-${String(totalShelves + 1).padStart(3, '0')}`
    const newCode = `${String(totalShelves + 1).padStart(2, '0')}`

    const copy: ShelfConfig = {
      ...JSON.parse(JSON.stringify(source)),
      shelfId: newId,
      shelfCode: newCode,
      shelfName: `${source.shelfName}-副本`,
      position: {
        x: source.position.x + source.width + 500,
        y: source.position.y,
        z: source.position.z,
      },
    }

    const maxX = wh.width - copy.width
    const maxZ = wh.length - copy.depth
    copy.position.x = Math.min(copy.position.x, maxX)
    copy.position.z = Math.min(copy.position.z, maxZ)
    copy.position.x = Math.max(0, copy.position.x)
    copy.position.z = Math.max(0, copy.position.z)

    wh.shelves.push(copy)
    selectedShelfId.value = copy.shelfId
    return copy
  }

  function selectShelf(shelfId: string | null): void {
    selectedShelfId.value = shelfId
    selectedShelfIds.value = new Set(shelfId ? [shelfId] : [])
  }

  function selectShelves(shelfIds: string[]): void {
    selectedShelfIds.value = new Set(shelfIds)
    selectedShelfId.value = shelfIds.length > 0 ? shelfIds[0] : null
  }

  function clearShelfSelection(): void {
    selectedShelfId.value = null
    selectedShelfIds.value = new Set()
  }

  function moveSelectedShelves(deltaX: number, deltaZ: number): void {
    const wh = selectedWarehouse.value
    if (!wh) return
    selectedShelfIds.value.forEach((shelfId) => {
      const idx = wh.shelves.findIndex((s) => s.shelfId === shelfId)
      if (idx >= 0) {
        const s = wh.shelves[idx]
        wh.shelves[idx] = {
          ...s,
          position: {
            ...s.position,
            x: s.position.x + deltaX,
            z: s.position.z + deltaZ,
          },
        }
      }
    })
  }

  function selectTreeNode(key: string): void {
    selectedNodeKey.value = key

    if (key === ROOT_KEY) {
      selectedLayerId.value = null
      selectedWarehouseId.value = null
      selectedShelfId.value = null
      return
    }

    const isLayer = editingLayers.value.some((l) => l.layerId === key)
    if (isLayer) {
      selectedLayerId.value = key
      selectedWarehouseId.value = null
      selectedShelfId.value = null
      return
    }

    const isWarehouse = editingLayers.value.some((l) =>
      l.warehouses.some((w) => w.warehouseId === key),
    )
    if (isWarehouse) {
      selectedLayerId.value =
        editingLayers.value.find((l) =>
          l.warehouses.some((w) => w.warehouseId === key),
        )?.layerId ?? null
      selectWarehouse(key)
      return
    }

    const parentLayer = editingLayers.value.find((l) =>
      l.warehouses.some((w) => w.shelves.some((s) => s.shelfId === key)),
    )
    const parentWarehouse = parentLayer?.warehouses.find((w) =>
      w.shelves.some((s) => s.shelfId === key),
    )
    if (parentLayer && parentWarehouse) {
      selectedLayerId.value = parentLayer.layerId
      selectedWarehouseId.value = parentWarehouse.warehouseId
      selectShelf(key)
    }
  }

  function setStageScale(scale: number): void {
    stageScale.value = scale
  }

  return {
    warehouseConfig,
    locationStatuses,
    selectedLocationDetail,
    loading,
    editingLayers,
    selectedLayerId,
    selectedWarehouseId,
    selectedShelfId,
    selectedShelfIds,
    selectedNodeKey,
    isRootSelected,
    layerXAligned,
    selectedLayer,
    selectedWarehouse,
    selectedShelf,
    treeData,
    setWarehouseConfig,
    setLocationStatuses,
    updateLocationStatus,
    setSelectedLocationDetail,
    setLoading,
    initEditingLayers,
    addLayer,
    removeLayer,
    selectLayer,
    setLayerHeight,
    setLayerPosition,
    setLayerZCoord,
    addWarehouse,
    removeWarehouse,
    selectWarehouse,
    setWarehouseSize,
    setWarehousePosition,
    addShelf,
    updateShelf,
    removeShelf,
    deleteSelectedNode,
    copyShelf,
    selectShelf,
    selectShelves,
    clearShelfSelection,
    moveSelectedShelves,
    selectTreeNode,
    setStageScale,
    stageScale,
    screenTitle,
    apiUrl,
    projectName,
  }
})
