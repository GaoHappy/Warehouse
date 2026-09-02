import * as THREE from 'three'
import type { ShelfConfig } from '@/models/warehouse'
import type { LocationBuilder } from './LocationBuilder'

export class ShelfBuilder {
  private locationBuilder: LocationBuilder

  constructor(locationBuilder: LocationBuilder) {
    this.locationBuilder = locationBuilder
  }

  build(shelfConfig: ShelfConfig): THREE.Group {
    const group = new THREE.Group()
    group.name = shelfConfig.shelfCode
    group.userData = {
      type: 'Shelf',
      shelfId: shelfConfig.shelfId,
      shelfCode: shelfConfig.shelfCode,
    }

    this.buildFrame(shelfConfig, group)

    this.locationBuilder.build(shelfConfig, group)

    group.position.set(
      shelfConfig.position.x + shelfConfig.width / 2,
      shelfConfig.position.y,
      shelfConfig.position.z + shelfConfig.depth / 2,
    )
    group.rotation.y = shelfConfig.rotationY

    return group
  }

  private buildFrame(config: ShelfConfig, group: THREE.Group): void {
    const { width, height, depth, layers } = config
    const halfW = width / 2
    const halfH = height / 2
    const halfD = depth / 2

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8d8d8,
      roughness: 0.35,
      metalness: 0.4,
    })

    const pillarGeo = new THREE.BoxGeometry(0.06, height + 0.06, 0.06)

    const frontLeft = new THREE.Mesh(pillarGeo, frameMaterial)
    frontLeft.position.set(-halfW, halfH, halfD)
    group.add(frontLeft)

    const frontRight = new THREE.Mesh(pillarGeo, frameMaterial)
    frontRight.position.set(halfW, halfH, halfD)
    group.add(frontRight)

    const backLeft = new THREE.Mesh(pillarGeo, frameMaterial)
    backLeft.position.set(-halfW, halfH, -halfD)
    group.add(backLeft)

    const backRight = new THREE.Mesh(pillarGeo, frameMaterial)
    backRight.position.set(halfW, halfH, -halfD)
    group.add(backRight)

    const beamGeo = new THREE.BoxGeometry(width + 0.06, 0.06, 0.06)

    const topFront = new THREE.Mesh(beamGeo, frameMaterial)
    topFront.position.set(0, halfH * 2, halfD)
    group.add(topFront)

    const topBack = new THREE.Mesh(beamGeo, frameMaterial)
    topBack.position.set(0, halfH * 2, -halfD)
    group.add(topBack)

    const bottomFront = new THREE.Mesh(beamGeo, frameMaterial)
    bottomFront.position.set(0, 0, halfD)
    group.add(bottomFront)

    const bottomBack = new THREE.Mesh(beamGeo, frameMaterial)
    bottomBack.position.set(0, 0, -halfD)
    group.add(bottomBack)

    const sideBeamGeo = new THREE.BoxGeometry(0.08, 0.08, depth + 0.08)

    const topLeft = new THREE.Mesh(sideBeamGeo, frameMaterial)
    topLeft.position.set(-halfW, halfH * 2, 0)
    group.add(topLeft)

    const topRight = new THREE.Mesh(sideBeamGeo, frameMaterial)
    topRight.position.set(halfW, halfH * 2, 0)
    group.add(topRight)

    const bottomLeft = new THREE.Mesh(sideBeamGeo, frameMaterial)
    bottomLeft.position.set(-halfW, 0, 0)
    group.add(bottomLeft)

    const bottomRight = new THREE.Mesh(sideBeamGeo, frameMaterial)
    bottomRight.position.set(halfW, 0, 0)
    group.add(bottomRight)

    const perLayerHeight = height / layers
    const boardMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.4,
      metalness: 0.35,
    })

    for (let layer = 0; layer <= layers; layer++) {
      const boardY = layer * perLayerHeight
      const boardGeo = new THREE.BoxGeometry(width, 0.04, depth)
      const board = new THREE.Mesh(boardGeo, boardMaterial)
      board.position.set(0, boardY, 0)
      board.receiveShadow = true
      board.castShadow = true
      group.add(board)
    }
  }
}
