import type { GameState, Ship } from "./types"

const pixelSize = 18
const pixelGap = 2

const pixelColors = {
  red: "#f05252",
  green: "#44c76b",
  blue: "#4b8dff",
} as const

export class Renderer {
  constructor(private readonly context: CanvasRenderingContext2D) {}

  render(state: GameState): void {
    this.clear(state.width, state.height)
    this.drawShip(state.ship)
  }

  private clear(width: number, height: number): void {
    this.context.fillStyle = "black"
    this.context.fillRect(0, 0, width, height)
  }

  private drawShip(ship: Ship): void {
    const { context } = this

    context.save()
    context.translate(ship.position.x, ship.position.y)
    context.rotate(ship.rotation)

    for (const pixel of ship.pixels) {
      const x = pixel.gridX * pixelSize - pixelSize / 2
      const y = pixel.gridY * pixelSize - pixelSize / 2

      context.fillStyle = pixelColors[pixel.color]
      context.fillRect(
        x + pixelGap / 2,
        y + pixelGap / 2,
        pixelSize - pixelGap,
        pixelSize - pixelGap,
      )
    }

    context.restore()
  }
}
