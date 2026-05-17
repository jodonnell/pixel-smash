import { describe, expect, it } from "vitest"
import { detectPixelCollisions, getPixelWorldCenter } from "../../src/collision"
import { Game, removePixelsNearImpact } from "../../src/game"
import { isShipConnected } from "../../src/shipConnectivity"
import { calculateShipStats } from "../../src/shipStats"
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
  stats: calculateShipStats(pixels),
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
    stats: calculateShipStats(pixels),
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

    expect(game.state.ship.pixels).toHaveLength(3)
    expect(isShipConnected(game.state.ship)).toBe(true)
    expect(game.state.enemies[0].pixels).toHaveLength(1)
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

  it("knocks ships apart, starts shake, and cools down repeated damage", () => {
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

    expect(game.state.ship.velocity.x).toBeLessThan(260)
    expect(game.state.enemies[0].velocity.x).toBeGreaterThan(0)
    expect(
      detectPixelCollisions(game.state.ship, game.state.enemies[0], 18),
    ).toHaveLength(0)
    expect(game.state.screenShake.remainingSeconds).toBeGreaterThan(0)

    const playerPixelCount = game.state.ship.pixels.length
    const enemyPixelCount = game.state.enemies[0].pixels.length

    game.state.ship.position = { x: 480, y: 270 }
    game.state.enemies[0].position = { x: 480, y: 270 }
    game.update(noInput, 0)

    expect(game.state.ship.pixels).toHaveLength(playerPixelCount)
    expect(game.state.enemies[0].pixels).toHaveLength(enemyPixelCount)
  })

  it("uses red pixels to increase outgoing ramming damage", () => {
    const weakRamGame = new Game(960, 540)
    weakRamGame.toggleMode()
    weakRamGame.state.ship.pixels = [{ gridX: 0, gridY: 0, color: "green" }]
    weakRamGame.state.ship.velocity = { x: 170, y: 0 }
    weakRamGame.state.enemies = [
      createEnemy([
        { gridX: 0, gridY: 0, color: "blue" },
        { gridX: 1, gridY: 0, color: "blue" },
        { gridX: 2, gridY: 0, color: "blue" },
        { gridX: 3, gridY: 0, color: "blue" },
        { gridX: 4, gridY: 0, color: "blue" },
      ]),
    ]

    const strongRamGame = new Game(960, 540)
    strongRamGame.toggleMode()
    strongRamGame.state.ship.pixels = [
      { gridX: 0, gridY: 0, color: "red" },
      { gridX: 1, gridY: 0, color: "red" },
      { gridX: 2, gridY: 0, color: "red" },
      { gridX: 3, gridY: 0, color: "red" },
      { gridX: 4, gridY: 0, color: "red" },
    ]
    strongRamGame.state.ship.velocity = { x: 170, y: 0 }
    strongRamGame.state.enemies = [
      createEnemy([
        { gridX: 0, gridY: 0, color: "blue" },
        { gridX: 1, gridY: 0, color: "blue" },
        { gridX: 2, gridY: 0, color: "blue" },
        { gridX: 3, gridY: 0, color: "blue" },
        { gridX: 4, gridY: 0, color: "blue" },
      ]),
    ]

    weakRamGame.update(noInput, 0)
    strongRamGame.update(noInput, 0)

    expect(strongRamGame.state.enemies[0].pixels.length).toBeLessThan(
      weakRamGame.state.enemies[0].pixels.length,
    )
  })

  it("uses green pixels to reduce incoming ramming damage", () => {
    const fragileGame = new Game(960, 540)
    fragileGame.toggleMode()
    fragileGame.state.ship.pixels = [
      { gridX: 0, gridY: 0, color: "blue" },
      { gridX: 1, gridY: 0, color: "blue" },
      { gridX: 2, gridY: 0, color: "blue" },
      { gridX: 3, gridY: 0, color: "blue" },
      { gridX: 4, gridY: 0, color: "blue" },
    ]
    fragileGame.state.ship.velocity = { x: 170, y: 0 }
    fragileGame.state.enemies = [
      createEnemy([{ gridX: 0, gridY: 0, color: "red" }]),
    ]

    const durableGame = new Game(960, 540)
    durableGame.toggleMode()
    durableGame.state.ship.pixels = [
      { gridX: 0, gridY: 0, color: "green" },
      { gridX: 1, gridY: 0, color: "green" },
      { gridX: 2, gridY: 0, color: "green" },
      { gridX: 3, gridY: 0, color: "green" },
      { gridX: 4, gridY: 0, color: "green" },
    ]
    durableGame.state.ship.velocity = { x: 170, y: 0 }
    durableGame.state.enemies = [
      createEnemy([{ gridX: 0, gridY: 0, color: "red" }]),
    ]

    fragileGame.update(noInput, 0)
    durableGame.update(noInput, 0)

    expect(durableGame.state.ship.pixels.length).toBeGreaterThan(
      fragileGame.state.ship.pixels.length,
    )
  })

  it("doubles outgoing damage when the colliding attacker pixel is red", () => {
    const blueImpactGame = new Game(960, 540)
    blueImpactGame.toggleMode()
    blueImpactGame.state.ship.pixels = [
      { gridX: 0, gridY: 0, color: "white" },
      { gridX: 1, gridY: 0, color: "blue" },
      { gridX: 0, gridY: 1, color: "red" },
    ]
    blueImpactGame.state.ship.stats = calculateShipStats(
      blueImpactGame.state.ship.pixels,
    )
    blueImpactGame.state.ship.rotation = 0
    blueImpactGame.state.ship.velocity = { x: 170, y: 0 }
    blueImpactGame.state.enemies = [
      {
        ...createEnemy([
          { gridX: 0, gridY: 0, color: "blue" },
          { gridX: 1, gridY: 0, color: "blue" },
          { gridX: 2, gridY: 0, color: "blue" },
          { gridX: 3, gridY: 0, color: "blue" },
          { gridX: 4, gridY: 0, color: "blue" },
        ]),
        position: { x: 498, y: 270 },
      },
    ]

    const redImpactGame = new Game(960, 540)
    redImpactGame.toggleMode()
    redImpactGame.state.ship.pixels = [
      { gridX: 0, gridY: 0, color: "white" },
      { gridX: 1, gridY: 0, color: "red" },
      { gridX: 0, gridY: 1, color: "blue" },
    ]
    redImpactGame.state.ship.stats = calculateShipStats(
      redImpactGame.state.ship.pixels,
    )
    redImpactGame.state.ship.rotation = 0
    redImpactGame.state.ship.velocity = { x: 170, y: 0 }
    redImpactGame.state.enemies = [
      {
        ...createEnemy([
          { gridX: 0, gridY: 0, color: "blue" },
          { gridX: 1, gridY: 0, color: "blue" },
          { gridX: 2, gridY: 0, color: "blue" },
          { gridX: 3, gridY: 0, color: "blue" },
          { gridX: 4, gridY: 0, color: "blue" },
        ]),
        position: { x: 498, y: 270 },
      },
    ]

    blueImpactGame.update(noInput, 0)
    redImpactGame.update(noInput, 0)

    expect(redImpactGame.state.enemies[0].pixels.length).toBeLessThan(
      blueImpactGame.state.enemies[0].pixels.length,
    )
  })

  it("halves incoming damage when the colliding defender pixel is green", () => {
    const blueImpactGame = new Game(960, 540)
    blueImpactGame.toggleMode()
    blueImpactGame.state.ship.pixels = [
      { gridX: 0, gridY: 0, color: "white" },
      { gridX: 1, gridY: 0, color: "blue" },
      { gridX: 0, gridY: 1, color: "green" },
      { gridX: -1, gridY: 0, color: "blue" },
    ]
    blueImpactGame.state.ship.stats = calculateShipStats(
      blueImpactGame.state.ship.pixels,
    )
    blueImpactGame.state.ship.rotation = 0
    blueImpactGame.state.ship.velocity = { x: 170, y: 0 }
    blueImpactGame.state.enemies = [
      {
        ...createEnemy([{ gridX: 0, gridY: 0, color: "red" }]),
        position: { x: 498, y: 270 },
      },
    ]

    const greenImpactGame = new Game(960, 540)
    greenImpactGame.toggleMode()
    greenImpactGame.state.ship.pixels = [
      { gridX: 0, gridY: 0, color: "white" },
      { gridX: 1, gridY: 0, color: "green" },
      { gridX: 0, gridY: 1, color: "blue" },
      { gridX: -1, gridY: 0, color: "blue" },
    ]
    greenImpactGame.state.ship.stats = calculateShipStats(
      greenImpactGame.state.ship.pixels,
    )
    greenImpactGame.state.ship.rotation = 0
    greenImpactGame.state.ship.velocity = { x: 170, y: 0 }
    greenImpactGame.state.enemies = [
      {
        ...createEnemy([{ gridX: 0, gridY: 0, color: "red" }]),
        position: { x: 498, y: 270 },
      },
    ]

    blueImpactGame.update(noInput, 0)
    greenImpactGame.update(noInput, 0)

    expect(greenImpactGame.state.ship.pixels.length).toBeGreaterThan(
      blueImpactGame.state.ship.pixels.length,
    )
  })
})

describe("enemy ai", () => {
  const noInput: InputState = {
    rotateLeft: false,
    rotateRight: false,
    thrust: false,
    reverse: false,
  }

  const createEnemy = (
    position: EnemyShip["position"],
    rotation: number,
  ): EnemyShip => {
    const pixels: EnemyShip["pixels"] = [
      { gridX: 0, gridY: 0, color: "red" },
      { gridX: 1, gridY: 0, color: "blue" },
    ]

    return {
      position,
      velocity: { x: 0, y: 0 },
      rotation,
      angularVelocity: 0,
      pixels,
      stats: calculateShipStats(pixels),
    }
  }

  it("turns and thrusts enemy ships toward the player", () => {
    const game = new Game(960, 540)
    game.toggleMode()
    game.state.ship.position = { x: 240, y: 120 }
    game.state.ship.velocity = { x: 0, y: 0 }
    game.state.enemies = [createEnemy({ x: 120, y: 120 }, 0)]

    game.update(noInput, 0.5)

    expect(game.state.enemies[0].velocity.x).toBeGreaterThan(90)
    expect(Math.abs(game.state.enemies[0].velocity.y)).toBeLessThan(1)
    expect(game.state.enemies[0].position.x).toBeGreaterThan(120)
  })

  it("uses the shortest wrapped path when pursuing across the screen edge", () => {
    const game = new Game(960, 540)
    game.toggleMode()
    game.state.ship.position = { x: 950, y: 120 }
    game.state.ship.velocity = { x: 0, y: 0 }
    game.state.enemies = [createEnemy({ x: 10, y: 120 }, Math.PI)]

    game.update(noInput, 0.5)

    expect(game.state.enemies[0].velocity.x).toBeLessThan(-90)
    expect(Math.abs(game.state.enemies[0].velocity.y)).toBeLessThan(1)
  })
})

describe("impact-localized damage", () => {
  it("removes pixels closest to the impact point in the ship's local grid", () => {
    const ship = createShip(100, 50, Math.PI / 2, [
      { gridX: 0, gridY: 0, color: "green" },
      { gridX: 0, gridY: 1, color: "red" },
      { gridX: 0, gridY: 2, color: "blue" },
      { gridX: 0, gridY: 3, color: "green" },
    ])

    const destroyedPixels = removePixelsNearImpact(ship, 46, 50, 2)

    expect(destroyedPixels).toEqual([
      { gridX: 0, gridY: 3, color: "green" },
      { gridX: 0, gridY: 2, color: "blue" },
    ])
    expect(ship.pixels).toEqual([
      { gridX: 0, gridY: 0, color: "green" },
      { gridX: 0, gridY: 1, color: "red" },
    ])
  })

  it("prefers nearby removals that keep the ship connected", () => {
    const ship = createShip(0, 0, 0, [
      { gridX: 0, gridY: 0, color: "green" },
      { gridX: 1, gridY: 0, color: "red" },
      { gridX: -1, gridY: 0, color: "blue" },
      { gridX: 0, gridY: -1, color: "blue" },
      { gridX: 0, gridY: 1, color: "red" },
    ])

    const destroyedPixels = removePixelsNearImpact(ship, 0, 0, 1)

    expect(destroyedPixels).toEqual([{ gridX: 1, gridY: 0, color: "red" }])
    expect(ship.pixels).toContainEqual({ gridX: 0, gridY: 0, color: "green" })
    expect(isShipConnected(ship)).toBe(true)
  })

  it("allows the least fragmenting nearby removal when the ship is already split", () => {
    const ship = createShip(0, 0, 0, [
      { gridX: 0, gridY: 0, color: "green" },
      { gridX: 3, gridY: 0, color: "red" },
      { gridX: 4, gridY: 0, color: "blue" },
    ])

    const destroyedPixels = removePixelsNearImpact(ship, 0, 0, 1)

    expect(destroyedPixels).toEqual([{ gridX: 0, gridY: 0, color: "green" }])
    expect(ship.pixels).toEqual([
      { gridX: 3, gridY: 0, color: "red" },
      { gridX: 4, gridY: 0, color: "blue" },
    ])
  })
})
