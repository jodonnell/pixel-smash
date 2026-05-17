import type { GameState, Ship } from "./types"
import { buildGridCellSize } from "./game"

const pixelSize = buildGridCellSize
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

    if (state.mode === "build") {
      this.drawBuildGrid(state.width, state.height)
    }

    this.drawShip(state.ship)

    if (state.mode === "game") {
      for (const enemy of state.enemies) {
        this.drawShip(enemy)
      }
    }

    this.drawStatus(state)
  }

  private clear(width: number, height: number): void {
    this.context.fillStyle = "black"
    this.context.fillRect(0, 0, width, height)
  }

  private drawBuildGrid(width: number, height: number): void {
    const { context } = this
    const centerX = width / 2
    const centerY = height / 2

    context.save()
    context.strokeStyle = "#263041"
    context.lineWidth = 1

    for (
      let x = centerX % pixelSize;
      x <= width;
      x += pixelSize
    ) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, height)
      context.stroke()
    }

    for (
      let y = centerY % pixelSize;
      y <= height;
      y += pixelSize
    ) {
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(width, y)
      context.stroke()
    }

    context.strokeStyle = "#42516d"
    context.beginPath()
    context.moveTo(centerX, 0)
    context.lineTo(centerX, height)
    context.moveTo(0, centerY)
    context.lineTo(width, centerY)
    context.stroke()
    context.restore()
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

  private drawStatus(state: GameState): void {
    const { context } = this
    const colorLabel =
      state.selectedPixelColor[0].toUpperCase() + state.selectedPixelColor.slice(1)
    const modeLabel = state.mode === "build" ? "Build Mode" : "Game Mode"

    context.save()
    context.fillStyle = "#e5e7eb"
    context.font = "16px OpenSans, system-ui, sans-serif"
    context.textBaseline = "top"
    context.fillText(`${modeLabel} | Tab`, 18, 16)

    if (state.mode === "build") {
      context.fillText(`Color: ${colorLabel} | 1 Red  2 Green  3 Blue`, 18, 40)
      context.fillText("Click place/recolor | Right click or shift-click remove", 18, 64)
    }

    context.restore()
  }
}
