import type { GameState, PixelHighlight, Ship, ShipPixel } from "./types"
import { buildGridCellSize, maxPlayerShipPixels } from "./game"

const pixelSize = buildGridCellSize
const pixelGap = 2

const pixelColors = {
  red: "#ff4d5e",
  green: "#35e06f",
  blue: "#4f9bff",
  white: "#f8fafc",
} as const

export class Renderer {
  constructor(private readonly context: CanvasRenderingContext2D) {}

  render(state: GameState): void {
    this.clear(state.width, state.height)
    this.drawBackground(state.width, state.height)

    this.context.save()
    this.applyScreenShake(state)

    if (state.mode === "build") {
      this.drawBuildGrid(state.width, state.height)
    }

    this.drawShip(
      state.ship,
      state.pixelHighlights.filter((highlight) => highlight.ship === "player"),
      true,
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

    this.drawDebris(state)
    this.drawParticles(state)
    this.context.restore()

    this.drawStatus(state)

    if (state.paused) {
      this.drawPauseOverlay(state.width, state.height)
    }
  }

  private clear(width: number, height: number): void {
    this.context.fillStyle = "#05070d"
    this.context.fillRect(0, 0, width, height)
  }

  private drawBackground(width: number, height: number): void {
    const { context } = this
    const gradient = context.createLinearGradient(0, 0, width, height)

    gradient.addColorStop(0, "#101827")
    gradient.addColorStop(0.55, "#07111f")
    gradient.addColorStop(1, "#03050a")

    context.save()
    context.fillStyle = gradient
    context.fillRect(0, 0, width, height)

    context.fillStyle = "rgba(255, 255, 255, 0.18)"
    for (let y = 24; y < height; y += 73) {
      for (let x = 36; x < width; x += 89) {
        context.fillRect(x, y, 2, 2)
      }
    }
    context.restore()
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
    context.strokeStyle = "#22334a"
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

    context.strokeStyle = "#5b7196"
    context.beginPath()
    context.moveTo(centerX, 0)
    context.lineTo(centerX, height)
    context.moveTo(0, centerY)
    context.lineTo(width, centerY)
    context.stroke()
    context.restore()
  }

  private drawShip(
    ship: Ship,
    highlights: PixelHighlight[],
    showFacingMarker = false,
  ): void {
    const { context } = this

    context.save()
    context.translate(ship.position.x, ship.position.y)
    context.rotate(ship.rotation)

    for (const pixel of ship.pixels) {
      const x = pixel.gridX * pixelSize - pixelSize / 2
      const y = pixel.gridY * pixelSize - pixelSize / 2

      const drawX = x + pixelGap / 2
      const drawY = y + pixelGap / 2
      const drawSize = pixelSize - pixelGap

      context.fillStyle = "rgba(0, 0, 0, 0.45)"
      context.fillRect(drawX + 2, drawY + 2, drawSize, drawSize)
      context.fillStyle = pixelColors[pixel.color]
      context.fillRect(drawX, drawY, drawSize, drawSize)
      context.strokeStyle = "#020617"
      context.lineWidth = 2
      context.strokeRect(drawX, drawY, drawSize, drawSize)

      if (this.isPixelHighlighted(pixel, highlights)) {
        context.strokeStyle = "#fff7a8"
        context.lineWidth = 4
        context.strokeRect(drawX - 1, drawY - 1, drawSize + 2, drawSize + 2)
      }
    }

    if (showFacingMarker) {
      this.drawFacingMarker(ship)
    }

    context.restore()
  }

  private drawFacingMarker(ship: Ship): void {
    const { context } = this
    const frontEdge = ship.pixels.reduce(
      (edge, pixel) => Math.max(edge, pixel.gridX * pixelSize + pixelSize / 2),
      pixelSize / 2,
    )
    const markerX = frontEdge + 10

    context.save()
    context.fillStyle = "#fff7a8"
    context.strokeStyle = "#020617"
    context.lineWidth = 3
    context.beginPath()
    context.moveTo(markerX + 10, 0)
    context.lineTo(markerX - 4, -8)
    context.lineTo(markerX - 4, 8)
    context.closePath()
    context.stroke()
    context.fill()
    context.restore()
  }

  private drawDebris(state: GameState): void {
    const { context } = this

    context.save()
    for (const debris of state.debris) {
      const alpha = 1 - debris.ageSeconds / debris.lifetimeSeconds
      const halfSize = debris.size / 2

      context.save()
      context.globalAlpha = Math.max(0, alpha)
      context.translate(debris.position.x, debris.position.y)
      context.rotate(debris.rotation)
      context.fillStyle = pixelColors[debris.color]
      context.fillRect(-halfSize, -halfSize, debris.size, debris.size)
      context.strokeStyle = "#020617"
      context.lineWidth = 2
      context.strokeRect(-halfSize, -halfSize, debris.size, debris.size)
      context.restore()
    }
    context.restore()
  }

  private drawParticles(state: GameState): void {
    const { context } = this

    context.save()
    for (const particle of state.particles) {
      const alpha = 1 - particle.ageSeconds / particle.lifetimeSeconds

      context.globalAlpha = Math.max(0, alpha)
      context.fillStyle = particle.color
      context.beginPath()
      context.arc(
        particle.position.x,
        particle.position.y,
        particle.radius,
        0,
        Math.PI * 2,
      )
      context.fill()
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
    const undefeatedEnemyCount = state.enemies.filter(
      (enemy) => enemy.pixels.length > 1,
    ).length

    context.save()
    context.fillStyle = "#f8fafc"
    context.font = "16px OpenSans, system-ui, sans-serif"
    context.textBaseline = "top"
    context.shadowColor = "rgba(0, 0, 0, 0.9)"
    context.shadowBlur = 4
    context.fillText(`${modeLabel} | Tab mode | P pause | R restart`, 18, 16)

    if (state.mode === "build") {
      context.fillText(
        `Click place/recolor connected pixels | Right/shift-click remove | Color: ${colorLabel}`,
        18,
        40,
      )
      context.fillText("1 red  2 green  3 blue", 18, 64)
    } else {
      context.fillText(
        "Arrow keys rotate/thrust/reverse | Ram enemy ships to break pixels",
        18,
        40,
      )
      context.fillText(
        "Impacts spawn debris; faster rams do more damage",
        18,
        64,
      )
    }

    const statsX = state.width - 210
    context.textAlign = "left"
    context.fillText(
      `Ship pixels: ${state.ship.pixels.length}/${maxPlayerShipPixels}`,
      statsX,
      16,
    )
    context.fillText(`Enemies: ${undefeatedEnemyCount}`, statsX, 40)
    context.fillText(
      `Thrust: ${Math.round(state.ship.stats.thrustPower)}`,
      statsX,
      64,
    )
    context.fillText(
      `Resistance: ${Math.round(state.ship.stats.damageResistance * 100)}%`,
      statsX,
      88,
    )
    context.fillText(
      `Ramming: ${state.ship.stats.rammingPower.toFixed(1)}x`,
      statsX,
      112,
    )

    if (state.outcome !== "playing") {
      const message =
        state.outcome === "won"
          ? "You win! Press R to restart."
          : "Core destroyed. Press R to restart."

      context.textAlign = "center"
      context.font = "30px OpenSans, system-ui, sans-serif"
      context.fillStyle = state.outcome === "won" ? "#86efac" : "#fca5a5"
      context.fillText(message, state.width / 2, 82)
    }

    context.restore()
  }

  private drawPauseOverlay(width: number, height: number): void {
    const { context } = this

    context.save()
    context.fillStyle = "rgba(2, 6, 23, 0.55)"
    context.fillRect(0, 0, width, height)
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.font = "34px OpenSans, system-ui, sans-serif"
    context.fillStyle = "#f8fafc"
    context.fillText("PAUSED", width / 2, height / 2 - 18)
    context.font = "16px OpenSans, system-ui, sans-serif"
    context.fillStyle = "#cbd5e1"
    context.fillText("Press P to resume", width / 2, height / 2 + 18)
    context.restore()
  }
}
