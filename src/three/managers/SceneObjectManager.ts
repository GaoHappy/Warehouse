import * as THREE from 'three'

export class SceneObjectManager {
  private interactiveObjects: THREE.Object3D[] = []

  setInteractiveObjects(objects: THREE.Object3D[]): void {
    this.interactiveObjects = objects
  }

  addInteractiveObject(object: THREE.Object3D): void {
    this.interactiveObjects.push(object)
  }

  getInteractiveObjects(): THREE.Object3D[] {
    return this.interactiveObjects
  }

  clear(): void {
    this.interactiveObjects = []
  }
}
