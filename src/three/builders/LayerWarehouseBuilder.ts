import * as THREE from 'three'
import type {
  LayerConfig,
  WarehouseConfig,
  ShelfConfig,
} from '@/models/warehouse'
import type { WarehouseSceneManager } from '../core/WarehouseSceneManager'
import { ShelfBuilder } from './ShelfBuilder'
import type { LocationBuilder } from './LocationBuilder'
import type { LocationManager } from '../managers/LocationManager'

const MM_TO_M = 1 / 1000
const WAREHOUSE_GAP_MM = 2000
const BORDER_THICKNESS = 0.03

export class LayerWarehouseBuilder {
  private shelfBuilder: ShelfBuilder
  private locationManager: LocationManager

  constructor(
    locationBuilder: LocationBuilder,
    locationManager: LocationManager,
  ) {
    this.shelfBuilder = new ShelfBuilder(locationBuilder)
    this.locationManager = locationManager
  }

  build(layers: LayerConfig[], sceneManager: WarehouseSceneManager): void {
    const box = new THREE.Box3()

    for (const layer of layers) {
      this.buildLayer(layer, sceneManager, box)
    }

    if (!box.isEmpty()) {
      sceneManager.fitToBounds(box)
    }
  }

  private buildLayer(
    layer: LayerConfig,
    sceneManager: WarehouseSceneManager,
    box: THREE.Box3,
  ): void {
    const layerGroup = new THREE.Group()
    layerGroup.name = layer.layerName
    layerGroup.position.set(0, (layer.zCoord ?? 0) * MM_TO_M, 0)
    layerGroup.userData = {
      type: 'Layer',
      layerId: layer.layerId,
      layerName: layer.layerName,
    }

    let autoOffsetX = 0
    for (const warehouse of layer.warehouses) {
      const hasCustomPos =
        warehouse.offsetX !== undefined || warehouse.offsetY !== undefined
      const wx =
        (hasCustomPos ? (warehouse.offsetX ?? 0) : autoOffsetX) * MM_TO_M
      const wz = (hasCustomPos ? (warehouse.offsetY ?? 0) : 0) * MM_TO_M

      this.buildWarehouse(warehouse, layerGroup, wx, wz)

      const ww = warehouse.width * MM_TO_M
      const wh = warehouse.height * MM_TO_M
      const wl = warehouse.length * MM_TO_M
      const ly = (layer.zCoord ?? 0) * MM_TO_M

      box.expandByPoint(
        new THREE.Vector3(wx - BORDER_THICKNESS, ly, wz - BORDER_THICKNESS),
      )
      box.expandByPoint(
        new THREE.Vector3(
          wx + ww + BORDER_THICKNESS,
          ly + wh,
          wz + wl + BORDER_THICKNESS,
        ),
      )

      if (!hasCustomPos) {
        autoOffsetX += warehouse.width + WAREHOUSE_GAP_MM
      }
    }

    sceneManager.addToScene(layerGroup)
  }

  private buildWarehouse(
    warehouse: WarehouseConfig,
    layerGroup: THREE.Group,
    wx: number,
    wz: number,
  ): void {
    const whGroup = new THREE.Group()
    whGroup.name = warehouse.warehouseName
    whGroup.position.set(wx, 0, wz)
    whGroup.userData = {
      type: 'Warehouse',
      warehouseId: warehouse.warehouseId,
      warehouseName: warehouse.warehouseName,
    }

    this.buildWarehouseGround(warehouse, whGroup)

    for (const shelf of warehouse.shelves) {
      const scaledShelf = this.scaleShelfConfig(shelf)
      const shelfGroup = this.shelfBuilder.build(scaledShelf)
      whGroup.add(shelfGroup)
    }

    layerGroup.add(whGroup)
  }

  private scaleShelfConfig(shelf: ShelfConfig): ShelfConfig {
    return {
      ...shelf,
      position: {
        x: shelf.position.x * MM_TO_M,
        y: shelf.position.y * MM_TO_M,
        z: shelf.position.z * MM_TO_M,
      },
      width: shelf.width * MM_TO_M,
      height: shelf.height * MM_TO_M,
      depth: shelf.depth * MM_TO_M,
      slotWidth: shelf.slotWidth * MM_TO_M,
      slotHeight: shelf.slotHeight * MM_TO_M,
      slotDepth: shelf.slotDepth * MM_TO_M,
    }
  }

  private buildWarehouseGround(
    warehouse: WarehouseConfig,
    group: THREE.Group,
  ): void {
    const w = warehouse.width * MM_TO_M
    const l = warehouse.length * MM_TO_M
    const groundGeo = new THREE.PlaneGeometry(w, l)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.set(w / 2, -0.05, l / 2)
    ground.receiveShadow = true
    ground.userData = { type: 'WarehouseGround' }
    group.add(ground)

    this.buildWarehouseBorder(warehouse, group)
  }

  private buildWarehouseBorder(
    warehouse: WarehouseConfig,
    group: THREE.Group,
  ): void {
    const w = warehouse.width * MM_TO_M
    const l = warehouse.length * MM_TO_M

    const borderMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.2,
    })

    const t = BORDER_THICKNESS
    const h = 0.15
    const y = h / 2 - 0.05

    const longGeo = new THREE.BoxGeometry(w + 2 * t, h, t)
    const shortGeo = new THREE.BoxGeometry(t, h, l + 2 * t)

    const front = new THREE.Mesh(longGeo, borderMaterial)
    front.position.set(w / 2, y, -t / 2)
    group.add(front)

    const back = new THREE.Mesh(longGeo, borderMaterial)
    back.position.set(w / 2, y, l + t / 2)
    group.add(back)

    const left = new THREE.Mesh(shortGeo, borderMaterial)
    left.position.set(-t / 2, y, l / 2)
    group.add(left)

    const right = new THREE.Mesh(shortGeo, borderMaterial)
    right.position.set(w + t / 2, y, l / 2)
    group.add(right)
  }

  getLocationManager(): LocationManager {
    return this.locationManager
  }
}
