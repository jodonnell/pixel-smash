import type { GameState, Ship } from "./types"

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
    const noseDistance = ship.radius
    const rearDistance = ship.radius * 0.72
    const halfWidth = ship.radius * 0.62

    context.save()
    context.translate(ship.position.x, ship.position.y)
    context.rotate(ship.angle)
    context.beginPath()
    context.moveTo(noseDistance, 0)
    context.lineTo(-rearDistance, -halfWidth)
    context.lineTo(-rearDistance * 0.62, 0)
    context.lineTo(-rearDistance, halfWidth)
    context.closePath()
    context.strokeStyle = "white"
    context.lineWidth = 2
    context.stroke()
    context.restore()
  }
}
