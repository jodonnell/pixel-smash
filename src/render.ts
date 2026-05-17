import type { GameState, PixelHighlight, Ship, ShipPixel } from "./types"
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

    this.context.save()
    this.applyScreenShake(state)

    if (state.mode === "build") {
      this.drawBuildGrid(state.width, state.height)
    }

    this.drawShip(
      state.ship,
      state.pixelHighlights.filter((highlight) => highlight.ship === "player"),
    )

    if (state.mode === "game") {
      for (const [enemyIndex, enemy] of state.enemies.entries()) {
        this.drawShip(
          enemy,
          state.pixelHighlights.filter(
            (highlight) =>
              highlight.ship === "enemy" && highlight.enemyIndex === enemyIndex,
          ),
        )
      }
    }

    this.drawStatus(state)
    this.context.restore()
  }

  private clear(width: number, height: number): void {
    this.context.fillStyle = "black"
    this.context.fillRect(0, 0, width, height)
  }

  private applyScreenShake(state: GameState): void {
    if (
      state.screenShake.remainingSeconds <= 0 ||
      state.screenShake.magnitude <= 0
    ) {
      return
    }

    const progress =
      state.screenShake.remainingSeconds / state.screenShake.durationSeconds
    const magnitude = state.screenShake.magnitude * progress * progress
    const offsetX = (Math.random() * 2 - 1) * magnitude
    const offsetY = (Math.random() * 2 - 1) * magnitude

    this.context.translate(offsetX, offsetY)
  }

  private drawBuildGrid(width: number, height: number): void {
    const { context } = this
    const centerX = width / 2
    const centerY = height / 2

    context.save()
    context.strokeStyle = "#263041"
    context.lineWidth = 1

    for (let x = centerX % pixelSize; x <= width; x += pixelSize) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, height)
      context.stroke()
    }

    for (let y = centerY % pixelSize; y <= height; y += pixelSize) {
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

  private drawShip(ship: Ship, highlights: PixelHighlight[]): void {
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

      if (this.isPixelHighlighted(pixel, highlights)) {
        context.strokeStyle = "#fff7a8"
        context.lineWidth = 3
        context.strokeRect(
          x + pixelGap / 2,
          y + pixelGap / 2,
          pixelSize - pixelGap,
          pixelSize - pixelGap,
        )
      }
    }

    context.restore()
  }

  private isPixelHighlighted(
    pixel: ShipPixel,
    highlights: PixelHighlight[],
  ): boolean {
    return highlights.some(
      (highlight) =>
        highlight.gridX === pixel.gridX && highlight.gridY === pixel.gridY,
    )
  }

  private drawStatus(state: GameState): void {
    const { context } = this
    const colorLabel =
      state.selectedPixelColor[0].toUpperCase() +
      state.selectedPixelColor.slice(1)
    const modeLabel = state.mode === "build" ? "Build Mode" : "Game Mode"

    context.save()
    context.fillStyle = "#e5e7eb"
    context.font = "16px OpenSans, system-ui, sans-serif"
    context.textBaseline = "top"
    context.fillText(`${modeLabel} | Tab`, 18, 16)

    if (state.mode === "build") {
      context.fillText(`Color: ${colorLabel} | 1 Red  2 Green  3 Blue`, 18, 40)
      context.fillText(
        "Click place/recolor | Right click or shift-click remove",
        18,
        64,
      )
    }

    const statsX = state.width - 210
    context.textAlign = "left"
    context.fillText(
      `Thrust: ${Math.round(state.ship.stats.thrustPower)}`,
      statsX,
      16,
    )
    context.fillText(
      `Resistance: ${Math.round(state.ship.stats.damageResistance * 100)}%`,
      statsX,
      40,
    )
    context.fillText(
      `Ramming: ${state.ship.stats.rammingPower.toFixed(1)}x`,
      statsX,
      64,
    )

    context.restore()
  }
}
