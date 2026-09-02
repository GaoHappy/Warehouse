import * as THREE from 'three'
import type { LocationManager } from '../managers/LocationManager'
import type { SelectionManager } from '../managers/SelectionManager'
import type { LocationObject } from '../managers/LocationManager'

const HIGHLIGHT_EMISSIVE = 0x333333
const SELECTED_EMISSIVE = 0x666666

export class RaycastManager {
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private locationManager: LocationManager
  private selectionManager: SelectionManager
  private camera: THREE.PerspectiveCamera
  private domElement: HTMLCanvasElement
  private previousHover: LocationObject | null = null

  private boundMouseMove: (event: MouseEvent) => void
  private boundClick: (event: MouseEvent) => void

  constructor(
    locationManager: LocationManager,
    selectionManager: SelectionManager,
    camera: THREE.PerspectiveCamera,
    domElement: HTMLCanvasElement,
  ) {
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.locationManager = locationManager
    this.selectionManager = selectionManager
    this.camera = camera
    this.domElement = domElement

    this.boundMouseMove = this.onMouseMove.bind(this)
    this.boundClick = this.onClick.bind(this)
  }

  enable(): void {
    this.domElement.addEventListener('mousemove', this.boundMouseMove)
    this.domElement.addEventListener('click', this.boundClick)
  }

  disable(): void {
    this.domElement.removeEventListener('mousemove', this.boundMouseMove)
    this.domElement.removeEventListener('click', this.boundClick)
    this.clearHover()
  }

  private getIntersections(event: MouseEvent): LocationObject[] {
    const rect = this.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)

    const meshes: THREE.Mesh[] = []
    for (const loc of this.locationManager.getAll()) {
      for (const child of loc.container.children) {
        if (child instanceof THREE.Mesh) {
          meshes.push(child)
        }
      }
      for (const child of loc.cargoGroup.children) {
        if (child instanceof THREE.Mesh) {
          meshes.push(child)
        }
      }
    }
    const intersects = this.raycaster.intersectObjects(meshes, false)

    const result: LocationObject[] = []
    const seen = new Set<string>()
    for (const intersect of intersects) {
      const mesh = intersect.object as THREE.Mesh
      let locationCode = mesh.userData.locationCode as string | undefined
      if (!locationCode && mesh.parent) {
        locationCode = mesh.parent.userData.locationCode as string | undefined
      }
      if (locationCode && !seen.has(locationCode)) {
        const locationObj = this.locationManager.get(locationCode)
        if (locationObj) {
          result.push(locationObj)
          seen.add(locationCode)
        }
      }
    }

    return result
  }

  private onMouseMove(event: MouseEvent): void {
    const intersections = this.getIntersections(event)

    if (intersections.length > 0) {
      const locationObj = intersections[0]
      if (this.previousHover !== locationObj) {
        this.clearHover()
        this.previousHover = locationObj
        this.applyHoverEffect(locationObj)
        this.selectionManager.hover(locationObj)
      }
    } else {
      if (this.previousHover) {
        this.clearHover()
        this.selectionManager.hover(null)
      }
    }
  }

  private onClick(event: MouseEvent): void {
    const intersections = this.getIntersections(event)

    if (intersections.length > 0) {
      const locationObj = intersections[0]
      this.clearSelection()
      this.applySelectEffect(locationObj)
      this.selectionManager.select(locationObj)
    } else {
      this.clearSelection()
      this.selectionManager.select(null)
    }
  }

  private applyHoverEffect(locationObj: LocationObject): void {
    for (const child of locationObj.cargoGroup.children) {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial
        material.emissive?.set(HIGHLIGHT_EMISSIVE)
      }
    }
  }

  private applySelectEffect(locationObj: LocationObject): void {
    for (const child of locationObj.cargoGroup.children) {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial
        material.emissive?.set(SELECTED_EMISSIVE)
      }
    }
  }

  private clearHover(): void {
    if (this.previousHover) {
      for (const child of this.previousHover.cargoGroup.children) {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial
          material.emissive?.set(0x000000)
        }
      }
      this.previousHover = null
    }
  }

  private clearSelection(): void {
    const selected = this.selectionManager.getSelected()
    if (selected) {
      for (const child of selected.cargoGroup.children) {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial
          material.emissive?.set(0x000000)
        }
      }
    }
  }

  selectLocation(locationObj: LocationObject | null): void {
    this.clearHover()
    this.clearSelection()
    if (locationObj) {
      this.applySelectEffect(locationObj)
    }
    this.selectionManager.select(locationObj)
  }

  dispose(): void {
    this.disable()
  }
}
