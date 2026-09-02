import type { IWarehouseDataProvider } from './IWarehouseDataProvider'
import type { WarehouseConfig } from '@/models/warehouse'
import type { LocationStatusDto, LocationDetail } from '@/models/location'
import { mockWarehouseConfig } from '../mock/warehouse.mock'
import { mockLocationStatuses } from '../mock/location.mock'

function delay<T>(data: T, ms: number = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

export class MockWarehouseDataProvider implements IWarehouseDataProvider {
  async getWarehouseConfig(_warehouseId: string): Promise<WarehouseConfig> {
    return delay(mockWarehouseConfig)
  }

  async getLocationStatuses(
    _warehouseId: string,
  ): Promise<LocationStatusDto[]> {
    return delay(mockLocationStatuses)
  }

  async getLocationDetail(locationCode: string): Promise<LocationDetail> {
    const status = mockLocationStatuses.find(
      (s) => s.locationCode === locationCode,
    )
    const parts = locationCode.split('-')
    const shelfCode = parts[0]
    const row = parseInt(parts[1], 10)
    const column = parseInt(parts[2], 10)
    const layer = parseInt(parts[3], 10)

    const shelf = mockWarehouseConfig.shelves.find(
      (s) => s.shelfCode === shelfCode,
    )
    const area = mockWarehouseConfig.areas.find(
      (a) => shelf && a.areaCode === shelfCode.charAt(0),
    )

    const detail: LocationDetail = {
      locationCode,
      shelfCode,
      row,
      column,
      layer,
      status: status?.status ?? 0,
      warehouseCode: mockWarehouseConfig.warehouseCode,
      areaCode: area?.areaCode,
    }

    if (status?.materialCode) {
      detail.materialCode = status.materialCode
      detail.materialName = status.materialName
      detail.quantity = status.quantity
    }

    return delay(detail)
  }
}
