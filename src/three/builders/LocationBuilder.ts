import * as THREE from 'three'
import type { ShelfConfig } from '@/models/warehouse'
import { generateLocationCode } from '../utils/LocationCodeGenerator'
import { LocationStatus } from '@/models/location'
import type { LocationManager } from '../managers/LocationManager'

const WALL_THICKNESS = 0.006
const GAP = 0.01
const CARGO_BLOCK_COUNT = 3
const BLOCK_GAP_RATIO = 0.2

function buildSlotCode(
  shelf: ShelfConfig,
  row: number,
  col: number,
  layer: number,
): string | null {
  if (!shelf.slotCodePrefix) return null
  const area = shelf.slotCodeArea ?? ''
  const shelfNum = shelf.slotCodeShelfNum ?? ''
  const suffix = shelf.slotCodeSuffix ?? ''
  return `${shelf.slotCodePrefix}${area}${shelfNum}${String(layer).padStart(2, '0')}${String(col).padStart(2, '0')}${suffix}`
}

export class LocationBuilder {
  private sharedBottomGeo: THREE.BoxGeometry | null = null
  private sharedSideWallGeo: THREE.BoxGeometry | null = null
  private sharedFrontWallGeo: THREE.BoxGeometry | null = null
  private wallMaterial: THREE.MeshStandardMaterial | null = null
  private locationManager: LocationManager

  constructor(locationManager: LocationManager) {
    this.locationManager = locationManager
  }

  build(shelfConfig: ShelfConfig, shelfGroup: THREE.Group): void {
    const { shelfCode, slotWidth, slotDepth } = shelfConfig
    const halfWidth = shelfConfig.width / 2
    const halfDepth = shelfConfig.depth / 2

    const perLayerHeight = shelfConfig.height / shelfConfig.layers
    const actualSlotHeight = perLayerHeight * 0.75

    const gapX =
      (shelfConfig.width - shelfConfig.rows * slotWidth) /
      (shelfConfig.rows + 1)
    const gapZ =
      (shelfConfig.depth - shelfConfig.columns * slotDepth) /
      (shelfConfig.columns + 1)

    const containerW = slotWidth - 0.02
    const containerH = actualSlotHeight - 0.02
    const containerD = slotDepth - 0.02

    const blockW = containerW - 2 * WALL_THICKNESS - 2 * GAP
    const blockH = containerH - WALL_THICKNESS - 2 * GAP
    const innerD = containerD - 2 * WALL_THICKNESS - 2 * GAP
    const blockD =
      innerD / (CARGO_BLOCK_COUNT + (CARGO_BLOCK_COUNT - 1) * BLOCK_GAP_RATIO)

    const sharedBlockGeometry = new THREE.BoxGeometry(blockW, blockH, blockD)
    this.locationManager.setBlockConfig(
      sharedBlockGeometry,
      containerW,
      containerH,
      containerD,
      WALL_THICKNESS + GAP,
      blockD,
      BLOCK_GAP_RATIO,
    )

    this.sharedBottomGeo = new THREE.BoxGeometry(
      containerW,
      WALL_THICKNESS,
      containerD,
    )
    this.sharedSideWallGeo = new THREE.BoxGeometry(
      WALL_THICKNESS,
      containerH,
      containerD,
    )
    this.sharedFrontWallGeo = new THREE.BoxGeometry(
      containerW,
      containerH,
      WALL_THICKNESS,
    )
    this.wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    })

    for (let row = 1; row <= shelfConfig.rows; row++) {
      for (let col = 1; col <= shelfConfig.columns; col++) {
        for (let layer = 1; layer <= shelfConfig.layers; layer++) {
          const posKey = `${row}-${col}-${layer}`
          const customCode = shelfConfig.customSlotCodes?.[posKey]
          const locationCode =
            customCode ??
            buildSlotCode(shelfConfig, row, col, layer) ??
            generateLocationCode({
              shelfCode,
              row,
              column: col,
              layer,
            })

          const slotX = -halfWidth + gapX * row + slotWidth * (row - 0.5)
          const slotY = (layer - 0.625) * perLayerHeight
          const slotZ = halfDepth - gapZ * col - slotDepth * (col - 0.5)

          const container = this.buildContainer(
            containerW,
            containerH,
            containerD,
          )
          container.position.set(slotX, slotY, slotZ)
          container.visible = false
          container.userData.locationCode = locationCode

          const cargoBottom = slotY - containerH / 2 + WALL_THICKNESS + GAP
          const cargoY = cargoBottom + blockH / 2

          const cargoGroup = new THREE.Group()
          cargoGroup.position.set(slotX, cargoY, slotZ)

          shelfGroup.add(container)
          shelfGroup.add(cargoGroup)

          this.locationManager.register({
            cargoGroup,
            container,
            locationCode,
            shelfCode,
            row,
            column: col,
            layer,
            status: LocationStatus.Empty,
            quantity: 0,
          })
        }
      }
    }
  }

  private buildContainer(w: number, h: number, d: number): THREE.Group {
    const group = new THREE.Group()
    const hw = w / 2
    const hh = h / 2
    const hd = d / 2
    const t = WALL_THICKNESS
    const ht = t / 2

    const bottom = new THREE.Mesh(this.sharedBottomGeo!, this.wallMaterial!)
    bottom.position.set(0, -hh + ht, 0)

    const left = new THREE.Mesh(this.sharedSideWallGeo!, this.wallMaterial!)
    left.position.set(-hw + ht, 0, 0)

    const right = new THREE.Mesh(this.sharedSideWallGeo!, this.wallMaterial!)
    right.position.set(hw - ht, 0, 0)

    const front = new THREE.Mesh(this.sharedFrontWallGeo!, this.wallMaterial!)
    front.position.set(0, 0, hd - ht)

    const back = new THREE.Mesh(this.sharedFrontWallGeo!, this.wallMaterial!)
    back.position.set(0, 0, -hd + ht)

    group.add(bottom)
    group.add(left)
    group.add(right)
    group.add(front)
    group.add(back)

    return group
  }

  dispose(): void {
    this.sharedBottomGeo?.dispose()
    this.sharedBottomGeo = null
    this.sharedSideWallGeo?.dispose()
    this.sharedSideWallGeo = null
    this.sharedFrontWallGeo?.dispose()
    this.sharedFrontWallGeo = null
    this.wallMaterial?.dispose()
    this.wallMaterial = null
  }
}
