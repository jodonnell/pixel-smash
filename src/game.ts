import type { GameState, InputState, PixelColor, ShipPixel } from "./types"

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

    const existingPixel = this.findPixel(gridX, gridY)

    if (existingPixel !== undefined) {
      existingPixel.color = this.state.selectedPixelColor
      return true
    }

    if (!this.hasOrthogonalNeighbor(gridX, gridY)) {
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
    if (this.state.mode !== "build" || this.state.ship.pixels.length === 1) {
      return false
    }

    const pixelIndex = this.state.ship.pixels.findIndex(
      (pixel) => pixel.gridX === gridX && pixel.gridY === gridY,
    )

    if (pixelIndex === -1) {
      return false
    }

    const remainingPixels = this.state.ship.pixels.filter(
      (_, index) => index !== pixelIndex,
    )

    if (!this.arePixelsConnected(remainingPixels)) {
      return false
    }

    this.state.ship.pixels = remainingPixels
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

  private findPixel(gridX: number, gridY: number): ShipPixel | undefined {
    return this.state.ship.pixels.find(
      (pixel) => pixel.gridX === gridX && pixel.gridY === gridY,
    )
  }

  private hasOrthogonalNeighbor(gridX: number, gridY: number): boolean {
    return this.state.ship.pixels.some(
      (pixel) =>
        Math.abs(pixel.gridX - gridX) + Math.abs(pixel.gridY - gridY) === 1,
    )
  }

  private arePixelsConnected(pixels: ShipPixel[]): boolean {
    if (pixels.length === 0) {
      return false
    }

    const remainingKeys = new Set(
      pixels.map((pixel) => this.getPixelKey(pixel.gridX, pixel.gridY)),
    )
    const queuedPixels = [pixels[0]]

    remainingKeys.delete(this.getPixelKey(pixels[0].gridX, pixels[0].gridY))

    while (queuedPixels.length > 0) {
      const pixel = queuedPixels.pop()

      if (pixel === undefined) {
        continue
      }

      const neighborCoordinates = [
        [pixel.gridX + 1, pixel.gridY],
        [pixel.gridX - 1, pixel.gridY],
        [pixel.gridX, pixel.gridY + 1],
        [pixel.gridX, pixel.gridY - 1],
      ] as const

      for (const [neighborX, neighborY] of neighborCoordinates) {
        const neighborKey = this.getPixelKey(neighborX, neighborY)

        if (!remainingKeys.has(neighborKey)) {
          continue
        }

        remainingKeys.delete(neighborKey)
        queuedPixels.push({ gridX: neighborX, gridY: neighborY, color: "red" })
      }
    }

    return remainingKeys.size === 0
  }

  private getPixelKey(gridX: number, gridY: number): string {
    return `${gridX},${gridY}`
  }
}
