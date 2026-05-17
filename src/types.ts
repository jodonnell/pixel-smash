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

export type Ship = {
  position: Vector2
  velocity: Vector2
  rotation: number
  pixels: ShipPixel[]
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
}

export type InputState = {
  rotateLeft: boolean
  rotateRight: boolean
  thrust: boolean
  reverse: boolean
}
