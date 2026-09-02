import type { WarehouseConfig } from '@/models/warehouse'

const shelfTemplate = {
  rows: 4,
  columns: 1,
  layers: 6,
  width: 1.8,
  height: 2.1,
  depth: 0.7,
  slotWidth: 0.365,
  slotHeight: 0.26,
  slotDepth: 0.55,
}

export const mockWarehouseConfig: WarehouseConfig = {
  warehouseId: 'WH-001',
  warehouseCode: 'WH-001',
  warehouseName: '一号仓库',
  width: 24,
  length: 12,
  height: 3,

  areas: [
    {
      areaId: 'AREA-A',
      areaCode: 'A',
      areaName: 'A区',
      position: { x: 0, y: 0, z: 0 },
      width: 7,
      length: 12,
    },
    {
      areaId: 'AREA-B',
      areaCode: 'B',
      areaName: 'B区',
      position: { x: 8, y: 0, z: 0 },
      width: 7,
      length: 12,
    },
    {
      areaId: 'AREA-C',
      areaCode: 'C',
      areaName: 'C区',
      position: { x: 16, y: 0, z: 0 },
      width: 7,
      length: 12,
    },
  ],

  shelves: [
    {
      shelfId: 'SHELF-A01',
      shelfCode: 'A01',
      shelfName: 'A区-01号货架',
      position: { x: 2, y: 0, z: 1.5 },
      rotationY: 0,
      ...shelfTemplate,
    },
    {
      shelfId: 'SHELF-A02',
      shelfCode: 'A02',
      shelfName: 'A区-02号货架',
      position: { x: 2, y: 0, z: 5.5 },
      rotationY: 0,
      ...shelfTemplate,
    },
    {
      shelfId: 'SHELF-A03',
      shelfCode: 'A03',
      shelfName: 'A区-03号货架',
      position: { x: 2, y: 0, z: 9.5 },
      rotationY: 0,
      ...shelfTemplate,
    },

    {
      shelfId: 'SHELF-B01',
      shelfCode: 'B01',
      shelfName: 'B区-01号货架',
      position: { x: 10, y: 0, z: 1.5 },
      rotationY: 0,
      ...shelfTemplate,
    },
    {
      shelfId: 'SHELF-B02',
      shelfCode: 'B02',
      shelfName: 'B区-02号货架',
      position: { x: 10, y: 0, z: 5.5 },
      rotationY: 0,
      ...shelfTemplate,
    },
    {
      shelfId: 'SHELF-B03',
      shelfCode: 'B03',
      shelfName: 'B区-03号货架',
      position: { x: 10, y: 0, z: 9.5 },
      rotationY: 0,
      ...shelfTemplate,
    },

    {
      shelfId: 'SHELF-C01',
      shelfCode: 'C01',
      shelfName: 'C区-01号货架',
      position: { x: 18, y: 0, z: 1.5 },
      rotationY: 0,
      ...shelfTemplate,
    },
    {
      shelfId: 'SHELF-C02',
      shelfCode: 'C02',
      shelfName: 'C区-02号货架',
      position: { x: 18, y: 0, z: 5.5 },
      rotationY: 0,
      ...shelfTemplate,
    },
    {
      shelfId: 'SHELF-C03',
      shelfCode: 'C03',
      shelfName: 'C区-03号货架',
      position: { x: 18, y: 0, z: 9.5 },
      rotationY: 0,
      ...shelfTemplate,
    },
  ],
}
