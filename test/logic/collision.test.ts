import { describe, expect, it } from "vitest"
import { detectPixelCollisions, getPixelWorldCenter } from "../../src/collision"
import { Game } from "../../src/game"
import type { EnemyShip, InputState, Ship } from "../../src/types"

const createShip = (
  x: number,
  y: number,
  rotation: number,
  pixels: Ship["pixels"],
): Ship => ({
  position: { x, y },
  velocity: { x: 0, y: 0 },
  rotation,
  pixels,
})

describe("pixel collision detection", () => {
  it("converts rotated local pixel positions to world centers", () => {
    const ship = createShip(100, 50, Math.PI / 2, [
      { gridX: 1, gridY: 0, color: "red" },
    ])

    const center = getPixelWorldCenter(ship, ship.pixels[0], 18)

    expect(center.x).toBeCloseTo(100)
    expect(center.y).toBeCloseTo(68)
  })

  it("detects pixel pairs whose centers are closer than one pixel size", () => {
    const shipA = createShip(0, 0, 0, [{ gridX: 0, gridY: 0, color: "red" }])
    const shipB = createShip(17, 0, 0, [{ gridX: 0, gridY: 0, color: "blue" }])
    const shipC = createShip(18, 0, 0, [{ gridX: 0, gridY: 0, color: "green" }])

    expect(detectPixelCollisions(shipA, shipB, 18)).toHaveLength(1)
    expect(detectPixelCollisions(shipA, shipC, 18)).toHaveLength(0)
  })
})

describe("ramming damage", () => {
  const noInput: InputState = {
    rotateLeft: false,
    rotateRight: false,
    thrust: false,
    reverse: false,
  }

  const createEnemy = (pixels: EnemyShip["pixels"]): EnemyShip => ({
    position: { x: 480, y: 270 },
    velocity: { x: 0, y: 0 },
    rotation: 0,
    angularVelocity: 0,
    pixels,
  })

  it("does not damage either ship below the minimum impact speed", () => {
    const game = new Game(960, 540)
    game.toggleMode()
    game.state.ship.velocity = { x: 40, y: 0 }
    game.state.enemies = [createEnemy([{ gridX: 0, gridY: 0, color: "red" }])]

    game.update(noInput, 0)

    expect(game.state.ship.pixels).toHaveLength(7)
    expect(game.state.enemies[0].pixels).toHaveLength(1)
  })

  it("removes more pixels at higher relative impact speed near the collision", () => {
    const game = new Game(960, 540)
    game.toggleMode()
    game.state.ship.velocity = { x: 260, y: 0 }
    game.state.enemies = [
      createEnemy([
        { gridX: 0, gridY: 0, color: "green" },
        { gridX: 1, gridY: 0, color: "red" },
        { gridX: -1, gridY: 0, color: "red" },
        { gridX: 0, gridY: -1, color: "blue" },
        { gridX: 0, gridY: 1, color: "blue" },
      ]),
    ]

    game.update(noInput, 0)

    expect(game.state.ship.pixels).toHaveLength(5)
    expect(game.state.ship.pixels).not.toContainEqual({
      gridX: 0,
      gridY: 0,
      color: "green",
    })
    expect(game.state.enemies[0].pixels).toHaveLength(1)
    expect(game.state.enemies[0].pixels).not.toContainEqual({
      gridX: 0,
      gridY: 0,
      color: "green",
    })
  })

  it("keeps at least one pixel on both ships after a severe impact", () => {
    const game = new Game(960, 540)
    game.toggleMode()
    game.state.ship.pixels = [{ gridX: 0, gridY: 0, color: "green" }]
    game.state.ship.velocity = { x: 520, y: 0 }
    game.state.enemies = [
      createEnemy([
        { gridX: 0, gridY: 0, color: "red" },
        { gridX: 1, gridY: 0, color: "blue" },
      ]),
    ]

    game.update(noInput, 0)

    expect(game.state.ship.pixels).toHaveLength(1)
    expect(game.state.enemies[0].pixels).toHaveLength(1)
  })
})
