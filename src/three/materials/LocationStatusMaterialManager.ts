import * as THREE from 'three'
import { LocationStatus } from '@/models/location'

const STATUS_COLORS: Record<LocationStatus, number> = {
  [LocationStatus.Empty]: 0x1a3a5c,
  [LocationStatus.Occupied]: 0x3b82f6,
  [LocationStatus.Locked]: 0xff7a00,
  [LocationStatus.Disabled]: 0x8c8c8c,
  [LocationStatus.Fault]: 0x722ed1,
}

const STATUS_OPACITY: Record<LocationStatus, number> = {
  [LocationStatus.Empty]: 0.5,
  [LocationStatus.Occupied]: 0.9,
  [LocationStatus.Locked]: 0.8,
  [LocationStatus.Disabled]: 0.35,
  [LocationStatus.Fault]: 0.85,
}

export class LocationStatusMaterialManager {
  private materialCache: Map<number, THREE.MeshStandardMaterial> = new Map()

  getColor(status: LocationStatus): number {
    return STATUS_COLORS[status]
  }

  getOpacity(status: LocationStatus): number {
    return STATUS_OPACITY[status]
  }

  getMaterial(status: LocationStatus): THREE.MeshStandardMaterial {
    const cached = this.materialCache.get(status)
    if (cached) return cached

    const material = new THREE.MeshStandardMaterial({
      color: this.getColor(status),
      opacity: this.getOpacity(status),
      transparent: true,
      roughness: 0.6,
      metalness: 0.1,
    })
    this.materialCache.set(status, material)
    return material
  }

  getAllMaterials(): THREE.MeshStandardMaterial[] {
    return Array.from(this.materialCache.values())
  }

  dispose(): void {
    this.materialCache.forEach((m) => m.dispose())
    this.materialCache.clear()
  }
}

export const locationStatusMaterialManager = new LocationStatusMaterialManager()
