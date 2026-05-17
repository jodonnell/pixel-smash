import type { InputState } from "./types"

const trackedKeys = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
])

export class KeyboardInput {
  private readonly pressedKeys = new Set<string>()

  constructor() {
    window.addEventListener("keydown", this.handleKeyDown)
    window.addEventListener("keyup", this.handleKeyUp)
  }

  getState(): InputState {
    return {
      rotateLeft: this.pressedKeys.has("ArrowLeft"),
      rotateRight: this.pressedKeys.has("ArrowRight"),
      thrust: this.pressedKeys.has("ArrowUp"),
      reverse: this.pressedKeys.has("ArrowDown"),
    }
  }

  destroy(): void {
    window.removeEventListener("keydown", this.handleKeyDown)
    window.removeEventListener("keyup", this.handleKeyUp)
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!trackedKeys.has(event.key)) {
      return
    }

    event.preventDefault()
    this.pressedKeys.add(event.key)
  }

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (!trackedKeys.has(event.key)) {
      return
    }

    event.preventDefault()
    this.pressedKeys.delete(event.key)
  }
}
