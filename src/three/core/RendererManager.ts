import * as THREE from 'three'

export class RendererManager {
  private renderer: THREE.WebGLRenderer

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    const w = container.clientWidth || window.innerWidth
    const h = container.clientHeight || window.innerHeight
    this.renderer.setSize(w, h)
    this.renderer.shadowMap.enabled = false
    this.renderer.setClearColor(0x0b1829, 1)
    container.appendChild(this.renderer.domElement)
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer
  }

  getDomElement(): HTMLCanvasElement {
    return this.renderer.domElement
  }

  render(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.renderer.render(scene, camera)
  }

  resize(width: number, height: number): void {
    this.renderer.setSize(width, height)
  }

  dispose(): void {
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }
}
