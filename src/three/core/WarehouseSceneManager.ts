import * as THREE from 'three'
import { CameraManager } from './CameraManager'
import { RendererManager } from './RendererManager'
import { LightManager } from './LightManager'

export class WarehouseSceneManager {
  private scene: THREE.Scene
  private cameraManager: CameraManager
  private rendererManager: RendererManager
  private lightManager: LightManager
  private container: HTMLElement
  private animationId: number | null = null
  private isRunning: boolean = false

  constructor(container: HTMLElement) {
    this.container = container
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0b1829)

    this.cameraManager = new CameraManager(container)
    this.rendererManager = new RendererManager(container)
    this.lightManager = new LightManager()

    const gridHelper = new THREE.GridHelper(200, 40, 0x003a6b, 0x002244)
    gridHelper.position.y = -0.1
    this.scene.add(gridHelper)
  }

  initialize(): void {
    this.lightManager.setup(this.scene)
    this.cameraManager.setupControls(this.rendererManager.getRenderer())
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.animate()
  }

  stop(): void {
    this.isRunning = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private animate = (): void => {
    if (!this.isRunning) return
    this.animationId = requestAnimationFrame(this.animate)
    this.cameraManager.updateControls()
    this.rendererManager.render(this.scene, this.cameraManager.getCamera())
  }

  resize(): void {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    this.cameraManager.resize(width / height)
    this.rendererManager.resize(width, height)
  }

  resetCamera(): void {
    this.cameraManager.resetCamera()
  }

  focusObject(target: THREE.Vector3): void {
    this.cameraManager.focusTarget(target)
  }

  setView(view: string): void {
    this.cameraManager.setView(view)
  }

  fitToScene(): void {
    const box = new THREE.Box3()
    this.scene.children.forEach((child) => {
      if (child.userData.type !== 'Shelf' && child.userData.type !== 'Area') {
        return
      }
      box.expandByObject(child)
    })
    if (!box.isEmpty()) {
      this.cameraManager.fitToBounds(box)
    }
  }

  fitToBounds(box: THREE.Box3): void {
    this.cameraManager.fitToBounds(box)
  }

  getScene(): THREE.Scene {
    return this.scene
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.cameraManager.getCamera()
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.rendererManager.getRenderer()
  }

  getDomElement(): HTMLCanvasElement {
    return this.rendererManager.getDomElement()
  }

  addToScene(object: THREE.Object3D): void {
    this.scene.add(object)
  }

  removeFromScene(object: THREE.Object3D): void {
    this.scene.remove(object)
  }

  destroy(): void {
    this.stop()

    this.lightManager.clear(this.scene)
    this.cameraManager.dispose()

    while (this.scene.children.length > 0) {
      const child = this.scene.children[0]
      this.scene.remove(child)
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose())
        } else {
          child.material?.dispose()
        }
      }
    }

    this.rendererManager.dispose()
    this.scene.clear()
  }
}
