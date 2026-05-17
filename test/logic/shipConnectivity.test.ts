import { describe, expect, it } from "vitest"
import {
  canPlacePixel,
  canRemovePixel,
  getNeighbors,
  getPixelAt,
  hasPixelAt,
  isShipConnected,
} from "../../src/shipConnectivity"
import type { Ship, ShipPixel } from "../../src/types"

const createShip = (pixels: ShipPixel[]): Ship => ({
  position: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
  rotation: 0,
  pixels,
})

describe("ship pixel connectivity utilities", () => {
  it("finds pixels by grid coordinate", () => {
    const ship = createShip([
      { gridX: 0, gridY: 0, color: "green" },
      { gridX: 1, gridY: 0, color: "red" },
    ])

    expect(getPixelAt(ship, 1, 0)).toEqual({
      gridX: 1,
      gridY: 0,
      color: "red",
    })
    expect(getPixelAt(ship, 9, 9)).toBeUndefined()
    expect(hasPixelAt(ship, 0, 0)).toBe(true)
    expect(hasPixelAt(ship, 0, 1)).toBe(false)
  })

  it("returns only orthogonal neighbors", () => {
    expect(getNeighbors(2, 3)).toEqual([
      { x: 3, y: 3 },
      { x: 1, y: 3 },
      { x: 2, y: 4 },
      { x: 2, y: 2 },
    ])
  })

  it("only allows placing empty pixels next to existing pixels", () => {
    const ship = createShip([{ gridX: 0, gridY: 0, color: "green" }])

    expect(canPlacePixel(ship, 1, 0)).toBe(true)
    expect(canPlacePixel(ship, 1, 1)).toBe(false)
    expect(canPlacePixel(ship, 0, 0)).toBe(false)
  })

  it("checks whether all pixels are connected orthogonally", () => {
    expect(
      isShipConnected(
        createShip([
          { gridX: 0, gridY: 0, color: "green" },
          { gridX: 1, gridY: 0, color: "red" },
          { gridX: 1, gridY: 1, color: "blue" },
        ]),
      ),
    ).toBe(true)

    expect(
      isShipConnected(
        createShip([
          { gridX: 0, gridY: 0, color: "green" },
          { gridX: 1, gridY: 1, color: "red" },
        ]),
      ),
    ).toBe(false)
  })

  it("only allows removing pixels when the remaining ship stays connected", () => {
    const lineShip = createShip([
      { gridX: -1, gridY: 0, color: "blue" },
      { gridX: 0, gridY: 0, color: "green" },
      { gridX: 1, gridY: 0, color: "red" },
    ])

    expect(canRemovePixel(lineShip, 0, 0)).toBe(false)
    expect(canRemovePixel(lineShip, -1, 0)).toBe(true)
    expect(canRemovePixel(lineShip, 9, 9)).toBe(false)
    expect(
      canRemovePixel(createShip([{ gridX: 0, gridY: 0, color: "green" }]), 0, 0),
    ).toBe(false)
  })
})
