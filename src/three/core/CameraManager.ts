import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export class CameraManager {
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls | null = null
  private defaultPosition = new THREE.Vector3(0, 10, 24)
  private defaultTarget = new THREE.Vector3(0, 10, -10)

  constructor(container: HTMLElement) {
    const aspect = container.clientWidth / container.clientHeight
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.5, 200)
    this.camera.position.copy(this.defaultPosition)
    this.camera.lookAt(this.defaultTarget)
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  setupControls(renderer: THREE.WebGLRenderer): void {
    this.controls = new OrbitControls(this.camera, renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.1
    this.controls.minDistance = 3
    this.controls.maxDistance = 60
    this.controls.maxPolarAngle = Math.PI / 2.2
    this.controls.target.copy(this.defaultTarget)
    this.controls.update()
  }

  updateControls(): void {
    this.controls?.update()
  }

  resetCamera(): void {
    this.camera.position.copy(this.defaultPosition)
    if (this.controls) {
      this.controls.target.copy(this.defaultTarget)
      this.controls.update()
    }
  }

  focusTarget(target: THREE.Vector3): void {
    if (this.controls) {
      this.controls.target.copy(target)
      this.camera.position.set(target.x + 5, target.y + 8, target.z + 5)
      this.controls.update()
    }
  }

  setView(view: string): void {
    const target = this.defaultTarget.clone()
    const dist = this.defaultPosition.distanceTo(this.defaultTarget) || 15
    let pos: THREE.Vector3

    switch (view) {
      case 'front':
        pos = new THREE.Vector3(target.x, target.y, target.z + dist)
        break
      case 'back':
        pos = new THREE.Vector3(target.x, target.y, target.z - dist)
        break
      case 'left':
        pos = new THREE.Vector3(target.x - dist, target.y, target.z)
        break
      case 'right':
        pos = new THREE.Vector3(target.x + dist, target.y, target.z)
        break
      case 'top':
        pos = new THREE.Vector3(target.x, target.y + dist, target.z)
        break
      default:
        pos = this.defaultPosition.clone()
        target.copy(this.defaultTarget)
        break
    }

    this.camera.position.copy(pos)
    if (this.controls) {
      this.controls.target.copy(target)
      this.controls.update()
    }
  }

  fitToBounds(boundingBox: THREE.Box3): void {
    const center = new THREE.Vector3()
    boundingBox.getCenter(center)
    const size = new THREE.Vector3()
    boundingBox.getSize(size)

    const tanHalfFov = Math.tan((this.camera.fov * Math.PI) / 180 / 2)
    const distByHeight = size.y / (2 * tanHalfFov) + size.z / 2
    const distByWidth =
      size.x / (2 * tanHalfFov * this.camera.aspect) + size.z / 2
    const distance = Math.max(distByHeight, distByWidth) * 1.1

    const cameraPos = new THREE.Vector3(center.x, center.y, center.z + distance)

    this.camera.position.copy(cameraPos)
    this.defaultPosition.copy(cameraPos)

    if (this.controls) {
      this.controls.target.copy(center)
      this.defaultTarget.copy(center)
      this.controls.update()
    }
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
  }

  getControls(): OrbitControls | null {
    return this.controls
  }

  dispose(): void {
    this.controls?.dispose()
  }
}
