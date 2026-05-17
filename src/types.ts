export type Vector2 = {
  x: number
  y: number
}

export type PixelColor = "red" | "green" | "blue"

export type GameMode = "build" | "game"

export type ShipPixel = {
  gridX: number
  gridY: number
  color: PixelColor
}

export type ShipStats = {
  thrustPower: number
  damageResistance: number
  rammingPower: number
}

export type PixelCollision = {
  shipAPixel: ShipPixel
  shipBPixel: ShipPixel
  shipACenter: Vector2
  shipBCenter: Vector2
  distance: number
}

export type PixelHighlight = {
  ship: "player" | "enemy"
  enemyIndex?: number
  gridX: number
  gridY: number
  remainingSeconds: number
}

export type ScreenShake = {
  remainingSeconds: number
  durationSeconds: number
  magnitude: number
}

export type Ship = {
  position: Vector2
  velocity: Vector2
  rotation: number
  pixels: ShipPixel[]
  stats: ShipStats
}

export type EnemyShip = Ship & {
  angularVelocity: number
}

export type GameState = {
  width: number
  height: number
  mode: GameMode
  selectedPixelColor: PixelColor
  ship: Ship
  enemies: EnemyShip[]
  pixelHighlights: PixelHighlight[]
  screenShake: ScreenShake
}

export type InputState = {
  rotateLeft: boolean
  rotateRight: boolean
  thrust: boolean
  reverse: boolean
}
