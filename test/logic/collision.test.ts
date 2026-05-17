import { describe, expect, it } from "vitest"
import {
  detectPixelCollisions,
  getPixelWorldCenter,
} from "../../src/collision"
import type { Ship } from "../../src/types"

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
