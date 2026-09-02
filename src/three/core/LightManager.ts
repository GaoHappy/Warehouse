import * as THREE from 'three'

export class LightManager {
  private lights: THREE.Light[] = []

  setup(scene: THREE.Scene): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)
    this.lights.push(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
    directionalLight.position.set(15, 25, 15)
    scene.add(directionalLight)
    this.lights.push(directionalLight)

    const fillLight = new THREE.DirectionalLight(0x8899cc, 0.25)
    fillLight.position.set(-10, 10, -10)
    scene.add(fillLight)
    this.lights.push(fillLight)
  }

  clear(scene: THREE.Scene): void {
    for (const light of this.lights) {
      scene.remove(light)
    }
    this.lights = []
  }
}
