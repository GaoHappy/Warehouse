import type { Vector3Config } from './common'

export interface LayerConfig {
  layerId: string
  layerCode: string
  layerName: string
  layerLevel: number
  height: number
  offsetX?: number
  offsetY?: number
  zCoord?: number
  warehouses: WarehouseConfig[]
}

export interface AreaConfig {
  areaId: string
  areaCode: string
  areaName: string
  position: Vector3Config
  width: number
  length: number
}

export interface WarehouseConfig {
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  width: number
  length: number
  height: number
  offsetX?: number
  offsetY?: number
  areas: AreaConfig[]
  shelves: ShelfConfig[]
}

export interface ShelfConfig {
  shelfId: string
  shelfCode: string
  shelfName: string
  position: Vector3Config
  rotationY: number
  rows: number
  columns: number
  layers: number
  width: number
  height: number
  depth: number
  slotWidth: number
  slotHeight: number
  slotDepth: number
  customSlotCodes?: Record<string, string>
  slotCodePrefix?: string
  slotCodeArea?: string
  slotCodeShelfNum?: string
  slotCodeSuffix?: string
}
