import type { Vector3Config } from '@/models/common'

export function toThreeVector3(config: Vector3Config): {
  x: number
  y: number
  z: number
} {
  return {
    x: config.x,
    y: config.y,
    z: config.z,
  }
}

export function createVector3(config: Vector3Config): {
  x: number
  y: number
  z: number
} {
  return toThreeVector3(config)
}
