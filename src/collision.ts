import type { PixelCollision, Ship, ShipPixel, Vector2 } from "./types"

export const getPixelWorldCenter = (
  ship: Ship,
  pixel: ShipPixel,
  pixelSize: number,
): Vector2 => {
  const localX = pixel.gridX * pixelSize
  const localY = pixel.gridY * pixelSize
  const cos = Math.cos(ship.rotation)
  const sin = Math.sin(ship.rotation)

  return {
    x: ship.position.x + localX * cos - localY * sin,
    y: ship.position.y + localX * sin + localY * cos,
  }
}

export const detectPixelCollisions = (
  shipA: Ship,
  shipB: Ship,
  pixelSize: number,
): PixelCollision[] => {
  const collisions: PixelCollision[] = []

  for (const shipAPixel of shipA.pixels) {
    const shipACenter = getPixelWorldCenter(shipA, shipAPixel, pixelSize)

    for (const shipBPixel of shipB.pixels) {
      const shipBCenter = getPixelWorldCenter(shipB, shipBPixel, pixelSize)
      const distance = Math.hypot(
        shipACenter.x - shipBCenter.x,
        shipACenter.y - shipBCenter.y,
      )

      if (distance < pixelSize) {
        collisions.push({
          shipAPixel,
          shipBPixel,
          shipACenter,
          shipBCenter,
          distance,
        })
      }
    }
  }

  return collisions
}
