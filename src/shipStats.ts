import type { PixelColor, Ship, ShipPixel, ShipStats } from "./types"

const baseThrustPower = 240
const thrustPowerPerBluePixel = 60
const damageResistancePerGreenPixel = 0.1
const maxDamageResistance = 0.75
const baseRammingPower = 1
const rammingPowerPerRedPixel = 0.2

const countPixelsByColor = (
  pixels: readonly ShipPixel[],
  color: PixelColor,
): number => pixels.filter((pixel) => pixel.color === color).length

export const calculateShipStats = (pixels: readonly ShipPixel[]): ShipStats => {
  const bluePixels = countPixelsByColor(pixels, "blue")
  const greenPixels = countPixelsByColor(pixels, "green")
  const redPixels = countPixelsByColor(pixels, "red")

  return {
    thrustPower: baseThrustPower + bluePixels * thrustPowerPerBluePixel,
    damageResistance: Math.min(
      maxDamageResistance,
      greenPixels * damageResistancePerGreenPixel,
    ),
    rammingPower: baseRammingPower + redPixels * rammingPowerPerRedPixel,
  }
}

export const recalculateShipStats = (ship: Ship): void => {
  ship.stats = calculateShipStats(ship.pixels)
}
