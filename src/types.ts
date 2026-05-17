export type Vector2 = {
  x: number
  y: number
}

export type Ship = {
  position: Vector2
  velocity: Vector2
  angle: number
  radius: number
}

export type GameState = {
  width: number
  height: number
  ship: Ship
}

export type InputState = {
  rotateLeft: boolean
  rotateRight: boolean
  thrust: boolean
  reverse: boolean
}
