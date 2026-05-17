import { Game } from "../../src/game"

describe("build mode ship editing", () => {
  it("recalculates ship stats when pixels are placed, recolored, and removed", () => {
    const game = new Game(960, 540)

    expect(game.state.ship.stats.thrustPower).toBe(360)
    expect(game.state.ship.stats.damageResistance).toBeCloseTo(0.3)
    expect(game.state.ship.stats.rammingPower).toBe(1.4)

    game.setSelectedPixelColor("blue")
    expect(game.tryPlacePixel(2, 0)).toBe(true)
    expect(game.state.ship.stats.thrustPower).toBe(420)

    game.setSelectedPixelColor("red")
    expect(game.tryPlacePixel(2, 0)).toBe(true)
    expect(game.state.ship.stats.thrustPower).toBe(360)
    expect(game.state.ship.stats.rammingPower).toBe(1.6)

    expect(game.tryRemovePixel(2, 0)).toBe(true)
    expect(game.state.ship.stats.rammingPower).toBe(1.4)
  })

  it("only places new pixels next to the ship", () => {
    const game = new Game(960, 540)

    expect(game.tryPlacePixel(6, 6)).toBe(false)
    expect(game.tryPlacePixel(2, 0)).toBe(true)
    expect(game.state.ship.pixels).toContainEqual({
      gridX: 2,
      gridY: 0,
      color: "red",
    })
  })

  it("keeps the ship connected when removing pixels", () => {
    const game = new Game(960, 540)

    expect(game.tryRemovePixel(0, 0)).toBe(false)
    expect(game.tryRemovePixel(1, 0)).toBe(true)
  })

  it("does not remove the final pixel", () => {
    const game = new Game(960, 540)

    game.state.ship.pixels = [{ gridX: 0, gridY: 0, color: "green" }]

    expect(game.tryRemovePixel(0, 0)).toBe(false)
    expect(game.state.ship.pixels).toHaveLength(1)
  })

  it("freezes the ship in build mode and moves in game mode", () => {
    const game = new Game(960, 540)

    game.state.ship.position.x = 100
    game.state.ship.velocity.x = 80
    game.state.enemies = []
    game.update(
      { rotateLeft: false, rotateRight: false, thrust: true, reverse: false },
      1,
    )

    expect(game.state.ship.position).toEqual({ x: 480, y: 270 })
    expect(game.state.ship.velocity).toEqual({ x: 0, y: 0 })

    game.toggleMode()
    game.update(
      { rotateLeft: false, rotateRight: false, thrust: true, reverse: false },
      0.1,
    )

    expect(game.state.ship.velocity.x).toBeGreaterThan(0)
  })

  it("uses blue pixels to increase thrust", () => {
    const lowEngineGame = new Game(960, 540)
    lowEngineGame.state.ship.pixels = [{ gridX: 0, gridY: 0, color: "green" }]
    lowEngineGame.state.enemies = []
    lowEngineGame.toggleMode()

    const highEngineGame = new Game(960, 540)
    highEngineGame.state.ship.pixels = [
      { gridX: 0, gridY: 0, color: "green" },
      { gridX: 1, gridY: 0, color: "blue" },
      { gridX: 2, gridY: 0, color: "blue" },
    ]
    highEngineGame.state.enemies = []
    highEngineGame.toggleMode()

    const thrustInput = {
      rotateLeft: false,
      rotateRight: false,
      thrust: true,
      reverse: false,
    }

    lowEngineGame.update(thrustInput, 0.1)
    highEngineGame.update(thrustInput, 0.1)

    expect(highEngineGame.state.ship.velocity.x).toBeGreaterThan(
      lowEngineGame.state.ship.velocity.x,
    )
  })
})
