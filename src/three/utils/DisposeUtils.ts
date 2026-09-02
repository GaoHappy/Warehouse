import * as THREE from 'three'

export function disposeMesh(mesh: THREE.Mesh): void {
  if (mesh.geometry) {
    mesh.geometry.dispose()
  }
  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((m) => disposeMaterial(m))
    } else {
      disposeMaterial(mesh.material)
    }
  }
}

export function disposeMaterial(material: THREE.Material): void {
  if (material instanceof THREE.Material) {
    if ('map' in material) {
      const map = (material as THREE.Material & { map: THREE.Texture | null })
        .map
      if (map) {
        map.dispose()
      }
    }
    material.dispose()
  }
}

export function disposeGroup(group: THREE.Group): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      disposeMesh(child)
    }
  })
  group.clear()
}

export function disposeScene(scene: THREE.Scene): void {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      disposeMesh(child)
    }
  })
  while (scene.children.length > 0) {
    scene.remove(scene.children[0])
  }
}

export function disposeRenderer(renderer: THREE.WebGLRenderer): void {
  renderer.dispose()
  renderer.forceContextLoss()
}
