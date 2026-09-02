import { LocationStatus } from '@/models/location'
import type { LocationStatusDto } from '@/models/location'
import type { ShelfConfig } from '@/models/warehouse'
import { mockWarehouseConfig } from './warehouse.mock'

function generateLocationCode(
  shelfCode: string,
  row: number,
  column: number,
  layer: number,
): string {
  const r = String(row).padStart(2, '0')
  const c = String(column).padStart(2, '0')
  const l = String(layer).padStart(2, '0')
  return `${shelfCode}-${r}-${c}-${l}`
}

function generateAllLocationStatuses(
  shelves: ShelfConfig[],
): LocationStatusDto[] {
  const result: LocationStatusDto[] = []

  for (const shelf of shelves) {
    for (let row = 1; row <= shelf.rows; row++) {
      for (let col = 1; col <= shelf.columns; col++) {
        for (let layer = 1; layer <= shelf.layers; layer++) {
          const locationCode = generateLocationCode(
            shelf.shelfCode,
            row,
            col,
            layer,
          )
          const status = assignStatus(row, col, layer)

          const dto: LocationStatusDto = {
            locationCode,
            status,
          }

          if (status === LocationStatus.Occupied) {
            dto.materialCode = `MAT${String(row).padStart(3, '0')}`
            dto.materialName = `测试物料_${shelf.shelfCode}_${row}`
            dto.quantity = Math.floor(Math.random() * 200) + 10
          }

          result.push(dto)
        }
      }
    }
  }

  return result
}

function assignStatus(
  row: number,
  _col: number,
  layer: number,
): LocationStatus {
  const hash = (row * 31 + layer * 17) % 20

  if (hash < 8) return LocationStatus.Empty
  if (hash < 14) return LocationStatus.Occupied
  if (hash < 16) return LocationStatus.Locked
  if (hash < 18) return LocationStatus.Disabled
  return LocationStatus.Fault
}

export const mockLocationStatuses: LocationStatusDto[] =
  generateAllLocationStatuses(mockWarehouseConfig.shelves)

export function simulateLocationStatusChange(): LocationStatusDto {
  const randomIndex = Math.floor(Math.random() * mockLocationStatuses.length)
  const target = mockLocationStatuses[randomIndex]

  const statuses = [
    LocationStatus.Empty,
    LocationStatus.Occupied,
    LocationStatus.Locked,
    LocationStatus.Disabled,
    LocationStatus.Fault,
  ]

  let newStatus: LocationStatus
  do {
    newStatus = statuses[Math.floor(Math.random() * statuses.length)]
  } while (newStatus === target.status)

  target.status = newStatus

  if (newStatus === LocationStatus.Occupied) {
    target.materialCode = `MAT${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`
    target.materialName = `模拟物料_${Date.now()}`
    target.quantity = Math.floor(Math.random() * 200) + 10
  } else {
    delete target.materialCode
    delete target.materialName
    delete target.quantity
  }

  return { ...target }
}
