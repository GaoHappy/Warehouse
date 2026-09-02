export interface LocationCodeParams {
  shelfCode: string
  row: number
  column: number
  layer: number
}

export function generateLocationCode(params: LocationCodeParams): string {
  const { shelfCode, row, column, layer } = params
  const r = String(row).padStart(2, '0')
  const c = String(column).padStart(2, '0')
  const l = String(layer).padStart(2, '0')
  return `${shelfCode}-${r}-${c}-${l}`
}

export function parseLocationCode(locationCode: string): LocationCodeParams {
  const parts = locationCode.split('-')
  if (parts.length !== 4) {
    throw new Error(`无效的货位编码: ${locationCode}`)
  }
  return {
    shelfCode: parts[0],
    row: parseInt(parts[1], 10),
    column: parseInt(parts[2], 10),
    layer: parseInt(parts[3], 10),
  }
}
