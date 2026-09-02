import * as THREE from 'three'
import { LocationStatus } from '@/models/location'
import { locationStatusMaterialManager } from '../materials/LocationStatusMaterialManager'

export interface LocationObject {
  cargoGroup: THREE.Group
  container: THREE.Group
  locationCode: string
  shelfCode: string
  row: number
  column: number
  layer: number
  status: LocationStatus
  quantity: number
}

export class LocationManager {
  private locationMap: Map<string, LocationObject> = new Map()
  private positionMap: Map<string, LocationObject> = new Map()
  private sharedBlockGeometry: THREE.BoxGeometry | null = null
  private containerW = 0
  private containerH = 0
  private containerD = 0
  private gapStart = 0
  private blockD = 0
  private blockGapRatio = 0.2

  setBlockConfig(
    geometry: THREE.BoxGeometry,
    containerW: number,
    containerH: number,
    containerD: number,
    gapStart: number,
    blockD: number,
    blockGapRatio: number,
  ): void {
    this.sharedBlockGeometry = geometry
    this.containerW = containerW
    this.containerH = containerH
    this.containerD = containerD
    this.gapStart = gapStart
    this.blockD = blockD
    this.blockGapRatio = blockGapRatio
  }

  register(locationObj: LocationObject): void {
    this.locationMap.set(locationObj.locationCode, locationObj)
    const posKey = `${locationObj.row}-${locationObj.column}-${locationObj.layer}`
    this.positionMap.set(posKey, locationObj)
  }

  get(locationCode: string): LocationObject | undefined {
    return this.locationMap.get(locationCode)
  }

  updateStatus(
    locationCode: string,
    status: LocationStatus,
    quantity?: number,
  ): void {
    const locationObj = this.locationMap.get(locationCode)
    if (!locationObj) return

    locationObj.status = status
    locationObj.quantity = quantity ?? 0

    this.clearCargoGroup(locationObj)

    switch (status) {
      case LocationStatus.Empty:
        locationObj.container.visible = false
        break

      case LocationStatus.Occupied:
        locationObj.container.visible = false
        if ((quantity ?? 0) > 0) {
          this.fillCargoBox(
            locationObj,
            locationStatusMaterialManager.getColor(LocationStatus.Occupied),
          )
        } else {
          this.fillCargoBox(locationObj, 0xffffff)
        }
        break

      case LocationStatus.Locked:
        locationObj.container.visible = false
        this.addLockIcon(locationObj)
        break

      case LocationStatus.Disabled:
      case LocationStatus.Fault:
        locationObj.container.visible = false
        this.addDisableIcon(locationObj)
        break
    }
  }

  updateStatuses(
    statusList: Array<{
      locationCode: string
      status: LocationStatus
      row?: number
      column?: number
      layer?: number
      quantity?: number
    }>,
  ): void {
    for (const item of statusList) {
      let obj = this.locationMap.get(item.locationCode)

      if (
        !obj &&
        item.row != null &&
        item.column != null &&
        item.layer != null
      ) {
        const posKey = `${item.row}-${item.column}-${item.layer}`
        obj = this.positionMap.get(posKey)
      }

      if (obj) {
        this.updateStatus(obj.locationCode, item.status, item.quantity)
      }
    }
  }

  getAll(): LocationObject[] {
    return Array.from(this.locationMap.values())
  }

  clear(): void {
    this.locationMap.clear()
    this.positionMap.clear()
  }

  get size(): number {
    return this.locationMap.size
  }

  private clearCargoGroup(locationObj: LocationObject): void {
    while (locationObj.cargoGroup.children.length > 0) {
      locationObj.cargoGroup.remove(locationObj.cargoGroup.children[0])
    }
  }

  private setContainerStyle(
    locationObj: LocationObject,
    opacity: number,
    color?: number,
  ): void {
    locationObj.container.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      if (Array.isArray(child.material as THREE.Material)) {
        for (const m of child.material as THREE.Material[]) {
          this.applyStyle(m, opacity, color)
        }
      } else if (child.material instanceof THREE.Material) {
        this.applyStyle(child.material, opacity, color)
      }
    })
  }

  private applyStyle(m: THREE.Material, opacity: number, color?: number): void {
    m.transparent = opacity < 1
    m.opacity = opacity
    m.depthWrite = opacity >= 1
    if (color != null && m instanceof THREE.MeshStandardMaterial) {
      m.color.setHex(color)
    }
    m.needsUpdate = true
  }

  private addDisableIcon(locationObj: LocationObject): void {
    const size = Math.min(this.containerW, this.containerH) * 0.55
    const radius = size / 2
    const tubeRadius = radius * 0.15
    const mat = new THREE.MeshStandardMaterial({
      color: locationStatusMaterialManager.getColor(LocationStatus.Disabled),
      roughness: 0.3,
      metalness: 0.1,
      emissive: 0x1a0033,
      emissiveIntensity: 0.3,
    })

    const ringGeo = new THREE.TorusGeometry(radius, tubeRadius, 8, 24)
    const ring = new THREE.Mesh(ringGeo, mat)
    ring.userData = {
      type: 'Location',
      locationCode: locationObj.locationCode,
      shelfCode: locationObj.shelfCode,
      row: locationObj.row,
      column: locationObj.column,
      layer: locationObj.layer,
      status: locationObj.status,
    }
    locationObj.cargoGroup.add(ring)

    const slashGeo = new THREE.BoxGeometry(
      tubeRadius * 2,
      radius * 2,
      tubeRadius * 2,
    )
    const slash = new THREE.Mesh(slashGeo, mat)
    slash.userData = {
      type: 'Location',
      locationCode: locationObj.locationCode,
      shelfCode: locationObj.shelfCode,
      row: locationObj.row,
      column: locationObj.column,
      layer: locationObj.layer,
      status: locationObj.status,
    }
    locationObj.cargoGroup.add(slash)
  }

  private fillCargoBox(locationObj: LocationObject, color: number): void {
    const boxGeo = new THREE.BoxGeometry(
      this.containerW * 0.88,
      this.containerH * 0.85,
      this.containerD * 0.88,
    )
    const boxMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.1,
    })
    const box = new THREE.Mesh(boxGeo, boxMat)
    box.userData = {
      type: 'Location',
      locationCode: locationObj.locationCode,
      shelfCode: locationObj.shelfCode,
      row: locationObj.row,
      column: locationObj.column,
      layer: locationObj.layer,
      status: locationObj.status,
    }
    locationObj.cargoGroup.add(box)
  }

  private addLockIcon(locationObj: LocationObject): void {
    const size = Math.min(this.containerW, this.containerH) * 0.5
    const bodyH = size * 0.6
    const bodyW = size * 0.7
    const shackleRadius = size * 0.22
    const mat = new THREE.MeshStandardMaterial({
      color: locationStatusMaterialManager.getColor(LocationStatus.Locked),
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x331100,
      emissiveIntensity: 0.3,
    })

    const bodyGeo = new THREE.BoxGeometry(bodyW, bodyH, bodyW * 0.4)
    const body = new THREE.Mesh(bodyGeo, mat)
    body.position.set(0, -bodyH * 0.2, 0)
    body.userData = {
      type: 'Location',
      locationCode: locationObj.locationCode,
      shelfCode: locationObj.shelfCode,
      row: locationObj.row,
      column: locationObj.column,
      layer: locationObj.layer,
      status: locationObj.status,
    }
    locationObj.cargoGroup.add(body)

    const ringGeo = new THREE.TorusGeometry(
      shackleRadius,
      shackleRadius * 0.3,
      8,
      8,
      Math.PI,
    )
    const ring = new THREE.Mesh(ringGeo, mat)
    ring.position.set(0, bodyH * 0.4, 0)
    ring.rotation.y = 0
    ring.userData = {
      type: 'Location',
      locationCode: locationObj.locationCode,
      shelfCode: locationObj.shelfCode,
      row: locationObj.row,
      column: locationObj.column,
      layer: locationObj.layer,
      status: locationObj.status,
    }
    locationObj.cargoGroup.add(ring)
  }
}
