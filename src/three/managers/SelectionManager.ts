import type { LocationObject } from './LocationManager'

export interface SelectionState {
  selectedLocation: LocationObject | null
  hoveredLocation: LocationObject | null
}

export class SelectionManager {
  private state: SelectionState = {
    selectedLocation: null,
    hoveredLocation: null,
  }

  private onSelectionChange:
    | ((location: LocationObject | null) => void)
    | null = null
  private onHoverChange: ((location: LocationObject | null) => void) | null =
    null

  select(location: LocationObject | null): void {
    if (this.state.selectedLocation === location) return
    this.state.selectedLocation = location
    this.onSelectionChange?.(location)
  }

  hover(location: LocationObject | null): void {
    if (this.state.hoveredLocation === location) return
    this.state.hoveredLocation = location
    this.onHoverChange?.(location)
  }

  getSelected(): LocationObject | null {
    return this.state.selectedLocation
  }

  getHovered(): LocationObject | null {
    return this.state.hoveredLocation
  }

  clearSelection(): void {
    this.state.selectedLocation = null
    this.onSelectionChange?.(null)
  }

  onSelectionChangeListener(
    callback: (location: LocationObject | null) => void,
  ): void {
    this.onSelectionChange = callback
  }

  onHoverChangeListener(
    callback: (location: LocationObject | null) => void,
  ): void {
    this.onHoverChange = callback
  }

  clear(): void {
    this.state = { selectedLocation: null, hoveredLocation: null }
  }
}
