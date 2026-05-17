import type { Ship, ShipPixel } from "./types"

type GridPoint = {
  x: number
  y: number
}

const getPixelKey = (gridX: number, gridY: number): string => `${gridX},${gridY}`

export const getPixelAt = (
  ship: Ship,
  gridX: number,
  gridY: number,
): ShipPixel | undefined =>
  ship.pixels.find((pixel) => pixel.gridX === gridX && pixel.gridY === gridY)

export const hasPixelAt = (
  ship: Ship,
  gridX: number,
  gridY: number,
): boolean => getPixelAt(ship, gridX, gridY) !== undefined

export const getNeighbors = (gridX: number, gridY: number): GridPoint[] => [
  { x: gridX + 1, y: gridY },
  { x: gridX - 1, y: gridY },
  { x: gridX, y: gridY + 1 },
  { x: gridX, y: gridY - 1 },
]

export const canPlacePixel = (
  ship: Ship,
  gridX: number,
  gridY: number,
): boolean => {
  if (hasPixelAt(ship, gridX, gridY)) {
    return false
  }

  return getNeighbors(gridX, gridY).some((neighbor) =>
    hasPixelAt(ship, neighbor.x, neighbor.y),
  )
}

export const canRemovePixel = (
  ship: Ship,
  gridX: number,
  gridY: number,
): boolean => {
  if (!hasPixelAt(ship, gridX, gridY)) {
    return false
  }

  return isShipConnected({
    ...ship,
    pixels: ship.pixels.filter(
      (pixel) => pixel.gridX !== gridX || pixel.gridY !== gridY,
    ),
  })
}

export const isShipConnected = (ship: Ship): boolean => {
  if (ship.pixels.length === 0) {
    return false
  }

  const remainingKeys = new Set(
    ship.pixels.map((pixel) => getPixelKey(pixel.gridX, pixel.gridY)),
  )
  const queuedPixels = [ship.pixels[0]]

  remainingKeys.delete(getPixelKey(ship.pixels[0].gridX, ship.pixels[0].gridY))

  while (queuedPixels.length > 0) {
    const pixel = queuedPixels.pop()

    if (pixel === undefined) {
      continue
    }

    for (const neighbor of getNeighbors(pixel.gridX, pixel.gridY)) {
      const neighborKey = getPixelKey(neighbor.x, neighbor.y)

      if (!remainingKeys.has(neighborKey)) {
        continue
      }

      remainingKeys.delete(neighborKey)
      queuedPixels.push({ gridX: neighbor.x, gridY: neighbor.y, color: "red" })
    }
  }

  return remainingKeys.size === 0
}
