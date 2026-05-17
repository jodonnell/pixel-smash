import type { InputState, PixelColor } from "./types"

const trackedKeys = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Tab",
  "1",
  "2",
  "3",
])

export class KeyboardInput {
  private readonly pressedKeys = new Set<string>()

  constructor(
    private readonly onToggleMode: () => void,
    private readonly onSelectPixelColor: (color: PixelColor) => void,
  ) {
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

    if (event.key === "Tab") {
      if (!event.repeat) {
        this.onToggleMode()
      }

      return
    }

    if (event.key === "1") {
      this.onSelectPixelColor("red")
      return
    }

    if (event.key === "2") {
      this.onSelectPixelColor("green")
      return
    }

    if (event.key === "3") {
      this.onSelectPixelColor("blue")
      return
    }

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
