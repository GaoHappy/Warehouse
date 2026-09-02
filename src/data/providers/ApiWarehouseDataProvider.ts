import type { IWarehouseDataProvider } from './IWarehouseDataProvider'
import type { WarehouseConfig } from '@/models/warehouse'
import type { LocationStatusDto, LocationDetail } from '@/models/location'
import { LocationStatus } from '@/models/location'

// ─── 后端 BigScreen 接口返回结构 ─────────────────────────
interface BackendLocationItem {
  LocationCode: string
  StatusView: string
  Column: number
  Level: number
  StockQty?: number
}

interface BackendLocationView {
  Row: string
  Locations: BackendLocationItem[]
}

interface BigScreenResponse {
  data: {
    LocationView?: BackendLocationView[]
  }
}

// ─── StatusView → LocationStatus 映射 ───────────────────
// 对应后端逻辑:
//   StatusView = l.LocOccupyStatus  ? "Occupy"
//              : l.LocLockStatus    ? "Lock"
//              : !l.LocEnableStatus ? "Enabled"
//              : "Avaliable"
function mapStatusView(statusView: string): LocationStatus {
  switch (statusView) {
    case 'Occupy':
      return LocationStatus.Occupied
    case 'Lock':
      return LocationStatus.Locked
    case 'Enabled':
      return LocationStatus.Disabled
    case 'Avaliable':
      return LocationStatus.Empty
    default:
      return LocationStatus.Empty
  }
}

export class ApiWarehouseDataProvider implements IWarehouseDataProvider {
  private baseUrl: string
  private cachedLocations: BackendLocationItem[] | null = null

  constructor(baseUrl: string = 'http://127.0.0.1:8080') {
    this.baseUrl = baseUrl
  }

  async getWarehouseConfig(warehouseId: string): Promise<WarehouseConfig> {
    const response = await fetch(
      `${this.baseUrl}/api/warehouse/${warehouseId}/config`,
    )
    if (!response.ok) {
      throw new Error(`获取仓库配置失败: ${response.statusText}`)
    }
    return response.json()
  }

  async getLocationStatuses(
    _warehouseId: string,
  ): Promise<LocationStatusDto[]> {
    const response = await fetch(
      `${this.baseUrl}/api/dashboard/BigScreen/getBigScreenData`,
    )
    if (!response.ok) {
      throw new Error(`获取货位状态失败: ${response.statusText}`)
    }

    const json: BigScreenResponse = await response.json()

    const allLocations: BackendLocationItem[] = []
    const rowMap: Record<string, string> = {}

    if (json.data?.LocationView) {
      for (const view of json.data.LocationView) {
        if (view.Locations) {
          for (const loc of view.Locations) {
            rowMap[loc.LocationCode] = view.Row
          }
          allLocations.push(...view.Locations)
        }
      }
    }

    this.cachedLocations = allLocations

    return allLocations.map((item) => ({
      locationCode: item.LocationCode,
      status: mapStatusView(item.StatusView),
      row: parseInt(rowMap[item.LocationCode], 10) || undefined,
      column: item.Column,
      layer: item.Level,
      quantity: item.StockQty ?? 0,
    }))
  }

  async getLocationDetail(locationCode: string): Promise<LocationDetail> {
    let item: BackendLocationItem | undefined

    if (this.cachedLocations) {
      item = this.cachedLocations.find(
        (loc) => loc.LocationCode === locationCode,
      )
    }

    if (!item) {
      const response = await fetch(
        `${this.baseUrl}/api/dashboard/BigScreen/getBigScreenData`,
      )
      if (!response.ok) {
        throw new Error(`获取货位详情失败: ${response.statusText}`)
      }
      const json: BigScreenResponse = await response.json()
      const allLocations: BackendLocationItem[] = []
      if (json.data?.LocationView) {
        for (const view of json.data.LocationView) {
          if (view.Locations) {
            allLocations.push(...view.Locations)
          }
        }
      }
      this.cachedLocations = allLocations
      item = allLocations.find((loc) => loc.LocationCode === locationCode)
    }

    if (!item) {
      throw new Error(`未找到货位: ${locationCode}`)
    }

    return {
      locationCode: item.LocationCode,
      shelfCode: '',
      row: 1,
      column: item.Column,
      layer: item.Level,
      status: mapStatusView(item.StatusView),
    }
  }
}
