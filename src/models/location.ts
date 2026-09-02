export enum LocationStatus {
  Empty = 0,
  Occupied = 1,
  Locked = 2,
  Disabled = 3,
  Fault = 4,
}

export const LocationStatusLabel: Record<LocationStatus, string> = {
  [LocationStatus.Empty]: '空闲',
  [LocationStatus.Occupied]: '已占用',
  [LocationStatus.Locked]: '锁定',
  [LocationStatus.Disabled]: '禁用',
  [LocationStatus.Fault]: '故障',
}

export interface LocationStatusDto {
  locationCode: string
  status: LocationStatus
  row?: number
  column?: number
  layer?: number
  materialCode?: string
  materialName?: string
  quantity?: number
}

export interface LocationDetail {
  locationCode: string
  shelfCode: string
  row: number
  column: number
  layer: number
  status: LocationStatus
  materialCode?: string
  materialName?: string
  quantity?: number
  warehouseCode?: string
  areaCode?: string
}
