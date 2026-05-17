import {
  canPlacePixel,
  canRemovePixel,
  getPixelAt,
} from "./shipConnectivity"
import type { GameState, InputState, PixelColor } from "./types"

const rotationSpeed = Math.PI * 2.2
const thrustAcceleration = 360
const reverseAcceleration = 220
const drag = 0.995
const maxSpeed = 520
export const buildGridCellSize = 18

const createPlayerPixels = () => [
  { gridX: 0, gridY: 0, color: "green" },
  { gridX: 1, gridY: 0, color: "red" },
  { gridX: -1, gridY: 0, color: "blue" },
  { gridX: 0, gridY: -1, color: "blue" },
  { gridX: 0, gridY: 1, color: "red" },
  { gridX: -1, gridY: -1, color: "green" },
  { gridX: -1, gridY: 1, color: "green" },
] as const

export class Game {
  readonly state: GameState

  constructor(width: number, height: number) {
    this.state = {
      width,
      height,
      mode: "build",
      selectedPixelColor: "red",
      ship: {
        position: {
          x: width / 2,
          y: height / 2,
        },
        velocity: {
          x: 0,
          y: 0,
        },
        rotation: -Math.PI / 2,
        pixels: [...createPlayerPixels()],
      },
    }
  }

  update(input: InputState, deltaSeconds: number): void {
    const ship = this.state.ship

    if (this.state.mode === "build") {
      ship.position.x = this.state.width / 2
      ship.position.y = this.state.height / 2
      ship.velocity.x = 0
      ship.velocity.y = 0
      ship.rotation = 0
      return
    }

    if (input.rotateLeft) {
      ship.rotation -= rotationSpeed * deltaSeconds
    }

    if (input.rotateRight) {
      ship.rotation += rotationSpeed * deltaSeconds
    }

    const forwardX = Math.cos(ship.rotation)
    const forwardY = Math.sin(ship.rotation)

    if (input.thrust) {
      ship.velocity.x += forwardX * thrustAcceleration * deltaSeconds
      ship.velocity.y += forwardY * thrustAcceleration * deltaSeconds
    }

    if (input.reverse) {
      ship.velocity.x -= forwardX * reverseAcceleration * deltaSeconds
      ship.velocity.y -= forwardY * reverseAcceleration * deltaSeconds
    }

    ship.velocity.x *= drag
    ship.velocity.y *= drag
    this.limitSpeed()

    ship.position.x += ship.velocity.x * deltaSeconds
    ship.position.y += ship.velocity.y * deltaSeconds

    this.wrapShip()
  }

  toggleMode(): void {
    this.state.mode = this.state.mode === "build" ? "game" : "build"

    if (this.state.mode === "build") {
      const { ship } = this.state

      ship.position.x = this.state.width / 2
      ship.position.y = this.state.height / 2
      ship.velocity.x = 0
      ship.velocity.y = 0
      ship.rotation = 0
    }
  }

  setSelectedPixelColor(color: PixelColor): void {
    this.state.selectedPixelColor = color
  }

  tryPlacePixel(gridX: number, gridY: number): boolean {
    if (this.state.mode !== "build") {
      return false
    }

    const existingPixel = getPixelAt(this.state.ship, gridX, gridY)

    if (existingPixel !== undefined) {
      existingPixel.color = this.state.selectedPixelColor
      return true
    }

    if (!canPlacePixel(this.state.ship, gridX, gridY)) {
      return false
    }

    this.state.ship.pixels.push({
      gridX,
      gridY,
      color: this.state.selectedPixelColor,
    })

    return true
  }

  tryRemovePixel(gridX: number, gridY: number): boolean {
    if (this.state.mode !== "build") {
      return false
    }

    if (!canRemovePixel(this.state.ship, gridX, gridY)) {
      return false
    }

    this.state.ship.pixels = this.state.ship.pixels.filter(
      (pixel) => pixel.gridX !== gridX || pixel.gridY !== gridY,
    )
    return true
  }

  screenToBuildGrid(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: Math.round((screenX - this.state.width / 2) / buildGridCellSize),
      y: Math.round((screenY - this.state.height / 2) / buildGridCellSize),
    }
  }

  private limitSpeed(): void {
    const { velocity } = this.state.ship
    const speed = Math.hypot(velocity.x, velocity.y)

    if (speed <= maxSpeed) {
      return
    }

    const scale = maxSpeed / speed
    velocity.x *= scale
    velocity.y *= scale
  }

  private wrapShip(): void {
    const { width, height, ship } = this.state

    if (ship.position.x < 0) {
      ship.position.x += width
    } else if (ship.position.x >= width) {
      ship.position.x -= width
    }

    if (ship.position.y < 0) {
      ship.position.y += height
    } else if (ship.position.y >= height) {
      ship.position.y -= height
    }
  }
}
