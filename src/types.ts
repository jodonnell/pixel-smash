export type Vector2 = {
  x: number
  y: number
}

export type BuildPixelColor = "red" | "green" | "blue"

export type PixelColor = BuildPixelColor | "white"

export type GameMode = "build" | "game"

export type GameOutcome = "playing" | "won" | "lost"

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

export type ImpactParticle = {
  position: Vector2
  velocity: Vector2
  color: string
  radius: number
  ageSeconds: number
  lifetimeSeconds: number
}

export type DebrisPixel = {
  position: Vector2
  velocity: Vector2
  rotation: number
  angularVelocity: number
  color: PixelColor
  size: number
  ageSeconds: number
  lifetimeSeconds: number
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
  outcome: GameOutcome
  paused: boolean
  selectedPixelColor: BuildPixelColor
  ship: Ship
  enemies: EnemyShip[]
  pixelHighlights: PixelHighlight[]
  screenShake: ScreenShake
  particles: ImpactParticle[]
  debris: DebrisPixel[]
}

export type InputState = {
  rotateLeft: boolean
  rotateRight: boolean
  thrust: boolean
  reverse: boolean
}
