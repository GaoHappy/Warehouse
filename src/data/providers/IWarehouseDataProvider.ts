import type { WarehouseConfig } from '@/models/warehouse'
import type { LocationStatusDto, LocationDetail } from '@/models/location'

export interface IWarehouseDataProvider {
  getWarehouseConfig(warehouseId: string): Promise<WarehouseConfig>
  getLocationStatuses(warehouseId: string): Promise<LocationStatusDto[]>
  getLocationDetail(locationCode: string): Promise<LocationDetail>
}
