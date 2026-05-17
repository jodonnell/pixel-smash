import { canPlacePixel, canRemovePixel, getPixelAt } from "./shipConnectivity"
import { detectPixelCollisions } from "./collision"
import type {
  EnemyShip,
  GameState,
  InputState,
  PixelCollision,
  PixelColor,
  Ship,
  ShipPixel,
} from "./types"

const rotationSpeed = Math.PI * 2.2
const thrustAcceleration = 360
const reverseAcceleration = 220
const drag = 0.995
const maxSpeed = 520
export const buildGridCellSize = 18
const enemyCount = 3
const enemyMinSpeed = 25
const enemyMaxSpeed = 70
const enemyMinSpin = 0.25
const enemyMaxSpin = 0.7
const collisionHighlightDuration = 0.2
const minimumDamageImpactSpeed = 50

type RemovalCandidate = {
  pixel: ShipPixel
  distance: number
  connected: boolean
  componentCount: number
  largestComponentSize: number
}

const getPixelKey = (pixel: ShipPixel): string => `${pixel.gridX}:${pixel.gridY}`

const getRemainingPixels = (
  ship: Ship,
  pixelToRemove: ShipPixel,
): ShipPixel[] =>
  ship.pixels.filter((pixel) => getPixelKey(pixel) !== getPixelKey(pixelToRemove))

const getConnectivityScore = (
  ship: Ship,
  pixelToRemove: ShipPixel,
): {
  connected: boolean
  componentCount: number
  largestComponentSize: number
} => {
  const remainingPixels = getRemainingPixels(ship, pixelToRemove)

  if (remainingPixels.length === 0) {
    return {
      connected: false,
      componentCount: 0,
      largestComponentSize: 0,
    }
  }

  const remainingKeys = new Set(remainingPixels.map(getPixelKey))
  let componentCount = 0
  let largestComponentSize = 0

  while (remainingKeys.size > 0) {
    const firstKey = remainingKeys.values().next().value

    if (firstKey === undefined) {
      break
    }

    componentCount += 1
    let componentSize = 0
    const queuedKeys = [firstKey]
    remainingKeys.delete(firstKey)

    while (queuedKeys.length > 0) {
      const key = queuedKeys.pop()

      if (key === undefined) {
        continue
      }

      componentSize += 1
      const [gridX, gridY] = key.split(":").map(Number)
      const neighborKeys = [
        `${gridX + 1}:${gridY}`,
        `${gridX - 1}:${gridY}`,
        `${gridX}:${gridY + 1}`,
        `${gridX}:${gridY - 1}`,
      ]

      for (const neighborKey of neighborKeys) {
        if (!remainingKeys.has(neighborKey)) {
          continue
        }

        remainingKeys.delete(neighborKey)
        queuedKeys.push(neighborKey)
      }
    }

    largestComponentSize = Math.max(largestComponentSize, componentSize)
  }

  return {
    connected: componentCount === 1,
    componentCount,
    largestComponentSize,
  }
}

const getLocalGridPoint = (
  ship: Ship,
  worldX: number,
  worldY: number,
): { x: number; y: number } => {
  const worldOffsetX = worldX - ship.position.x
  const worldOffsetY = worldY - ship.position.y
  const cos = Math.cos(ship.rotation)
  const sin = Math.sin(ship.rotation)

  return {
    x: (worldOffsetX * cos + worldOffsetY * sin) / buildGridCellSize,
    y: (-worldOffsetX * sin + worldOffsetY * cos) / buildGridCellSize,
  }
}

const compareRemovalCandidates = (
  candidateA: RemovalCandidate,
  candidateB: RemovalCandidate,
): number => {
  if (candidateA.connected !== candidateB.connected) {
    return candidateA.connected ? -1 : 1
  }

  if (!candidateA.connected && candidateA.componentCount !== candidateB.componentCount) {
    return candidateA.componentCount - candidateB.componentCount
  }

  if (
    !candidateA.connected &&
    candidateA.largestComponentSize !== candidateB.largestComponentSize
  ) {
    return candidateB.largestComponentSize - candidateA.largestComponentSize
  }

  return candidateA.distance - candidateB.distance
}

export const removePixelsNearImpact = (
  ship: Ship,
  worldImpactX: number,
  worldImpactY: number,
  damageAmount: number,
): ShipPixel[] => {
  const destroyedPixels: ShipPixel[] = []

  while (destroyedPixels.length < damageAmount && ship.pixels.length > 1) {
    const localImpact = getLocalGridPoint(ship, worldImpactX, worldImpactY)
    const candidates = ship.pixels
      .map((pixel): RemovalCandidate => {
        const connectivityScore = getConnectivityScore(ship, pixel)

        return {
          pixel,
          distance: Math.hypot(
            pixel.gridX - localImpact.x,
            pixel.gridY - localImpact.y,
          ),
          ...connectivityScore,
        }
      })
      .sort(compareRemovalCandidates)

    const pixelToDestroy = candidates[0]?.pixel

    if (pixelToDestroy === undefined) {
      break
    }

    destroyedPixels.push(pixelToDestroy)
    ship.pixels = getRemainingPixels(ship, pixelToDestroy)
  }

  return destroyedPixels
}

const createPlayerPixels = () =>
  [
    { gridX: 0, gridY: 0, color: "green" },
    { gridX: 1, gridY: 0, color: "red" },
    { gridX: -1, gridY: 0, color: "blue" },
    { gridX: 0, gridY: -1, color: "blue" },
    { gridX: 0, gridY: 1, color: "red" },
    { gridX: -1, gridY: -1, color: "green" },
    { gridX: -1, gridY: 1, color: "green" },
  ] as const

const enemyPixelShapes: readonly (readonly ShipPixel[])[] = [
  [
    { gridX: 0, gridY: 0, color: "green" },
    { gridX: 1, gridY: 0, color: "red" },
    { gridX: -1, gridY: 0, color: "red" },
    { gridX: 0, gridY: -1, color: "blue" },
    { gridX: 0, gridY: 1, color: "blue" },
  ],
  [
    { gridX: 0, gridY: 0, color: "blue" },
    { gridX: 1, gridY: 0, color: "green" },
    { gridX: 0, gridY: 1, color: "green" },
    { gridX: -1, gridY: 1, color: "red" },
    { gridX: 1, gridY: -1, color: "red" },
  ],
  [
    { gridX: 0, gridY: 0, color: "red" },
    { gridX: -1, gridY: 0, color: "blue" },
    { gridX: -2, gridY: 0, color: "green" },
    { gridX: 0, gridY: -1, color: "green" },
    { gridX: 0, gridY: 1, color: "blue" },
    { gridX: 1, gridY: 0, color: "red" },
  ],
]

const randomBetween = (min: number, max: number): number =>
  min + Math.random() * (max - min)

const createEnemyShip = (
  width: number,
  height: number,
  index: number,
): EnemyShip => {
  const driftDirection = randomBetween(0, Math.PI * 2)
  const driftSpeed = randomBetween(enemyMinSpeed, enemyMaxSpeed)
  const spinDirection = Math.random() < 0.5 ? -1 : 1

  return {
    position: {
      x: randomBetween(buildGridCellSize * 3, width - buildGridCellSize * 3),
      y: randomBetween(buildGridCellSize * 3, height - buildGridCellSize * 3),
    },
    velocity: {
      x: Math.cos(driftDirection) * driftSpeed,
      y: Math.sin(driftDirection) * driftSpeed,
    },
    rotation: randomBetween(0, Math.PI * 2),
    angularVelocity: spinDirection * randomBetween(enemyMinSpin, enemyMaxSpin),
    pixels: enemyPixelShapes[index % enemyPixelShapes.length].map((pixel) => ({
      ...pixel,
    })),
  }
}

export class Game {
  readonly state: GameState
  private readonly activeCollisionKeys = new Set<string>()
  private readonly activeCollisionEnemies = new Set<number>()

  constructor(width: number, height: number) {
    this.state = {
      width,
      height,
      mode: "build",
      selectedPixelColor: "red",
      ship: {
        position: {
          x: width / 2,
          y: height / 2,
        },
        velocity: {
          x: 0,
          y: 0,
        },
        rotation: -Math.PI / 2,
        pixels: [...createPlayerPixels()],
      },
      enemies: Array.from({ length: enemyCount }, (_, index) =>
        createEnemyShip(width, height, index),
      ),
      pixelHighlights: [],
    }
  }

  update(input: InputState, deltaSeconds: number): void {
    const ship = this.state.ship

    if (this.state.mode === "build") {
      ship.position.x = this.state.width / 2
      ship.position.y = this.state.height / 2
      ship.velocity.x = 0
      ship.velocity.y = 0
      ship.rotation = 0
      this.state.pixelHighlights = []
      this.activeCollisionKeys.clear()
      this.activeCollisionEnemies.clear()
      return
    }

    this.updateEnemies(deltaSeconds)

    if (input.rotateLeft) {
      ship.rotation -= rotationSpeed * deltaSeconds
    }

    if (input.rotateRight) {
      ship.rotation += rotationSpeed * deltaSeconds
    }

    const forwardX = Math.cos(ship.rotation)
    const forwardY = Math.sin(ship.rotation)

    if (input.thrust) {
      ship.velocity.x += forwardX * thrustAcceleration * deltaSeconds
      ship.velocity.y += forwardY * thrustAcceleration * deltaSeconds
    }

    if (input.reverse) {
      ship.velocity.x -= forwardX * reverseAcceleration * deltaSeconds
      ship.velocity.y -= forwardY * reverseAcceleration * deltaSeconds
    }

    ship.velocity.x *= drag
    ship.velocity.y *= drag
    this.limitSpeed()

    ship.position.x += ship.velocity.x * deltaSeconds
    ship.position.y += ship.velocity.y * deltaSeconds

    this.wrapShip(ship)
    this.updatePixelCollisions(deltaSeconds)
  }

  toggleMode(): void {
    this.state.mode = this.state.mode === "build" ? "game" : "build"

    if (this.state.mode === "build") {
      const { ship } = this.state

      ship.position.x = this.state.width / 2
      ship.position.y = this.state.height / 2
      ship.velocity.x = 0
      ship.velocity.y = 0
      ship.rotation = 0
      this.state.pixelHighlights = []
      this.activeCollisionKeys.clear()
      this.activeCollisionEnemies.clear()
    }
  }

  setSelectedPixelColor(color: PixelColor): void {
    this.state.selectedPixelColor = color
  }

  tryPlacePixel(gridX: number, gridY: number): boolean {
    if (this.state.mode !== "build") {
      return false
    }

    const existingPixel = getPixelAt(this.state.ship, gridX, gridY)

    if (existingPixel !== undefined) {
      existingPixel.color = this.state.selectedPixelColor
      return true
    }

    if (!canPlacePixel(this.state.ship, gridX, gridY)) {
      return false
    }

    this.state.ship.pixels.push({
      gridX,
      gridY,
      color: this.state.selectedPixelColor,
    })

    return true
  }

  tryRemovePixel(gridX: number, gridY: number): boolean {
    if (this.state.mode !== "build") {
      return false
    }

    if (!canRemovePixel(this.state.ship, gridX, gridY)) {
      return false
    }

    this.state.ship.pixels = this.state.ship.pixels.filter(
      (pixel) => pixel.gridX !== gridX || pixel.gridY !== gridY,
    )
    return true
  }

  screenToBuildGrid(
    screenX: number,
    screenY: number,
  ): { x: number; y: number } {
    return {
      x: Math.round((screenX - this.state.width / 2) / buildGridCellSize),
      y: Math.round((screenY - this.state.height / 2) / buildGridCellSize),
    }
  }

  private limitSpeed(): void {
    const { velocity } = this.state.ship
    const speed = Math.hypot(velocity.x, velocity.y)

    if (speed <= maxSpeed) {
      return
    }

    const scale = maxSpeed / speed
    velocity.x *= scale
    velocity.y *= scale
  }

  private updateEnemies(deltaSeconds: number): void {
    for (const enemy of this.state.enemies) {
      enemy.position.x += enemy.velocity.x * deltaSeconds
      enemy.position.y += enemy.velocity.y * deltaSeconds
      enemy.rotation += enemy.angularVelocity * deltaSeconds
      this.wrapShip(enemy)
    }
  }

  private updatePixelCollisions(deltaSeconds: number): void {
    this.state.pixelHighlights = this.state.pixelHighlights
      .map((highlight) => ({
        ...highlight,
        remainingSeconds: highlight.remainingSeconds - deltaSeconds,
      }))
      .filter((highlight) => highlight.remainingSeconds > 0)

    const nextCollisionKeys = new Set<string>()
    const nextCollisionEnemies = new Set<number>()

    this.state.enemies.forEach((enemy, enemyIndex) => {
      const collisions = detectPixelCollisions(
        this.state.ship,
        enemy,
        buildGridCellSize,
      )

      if (collisions.length > 0) {
        nextCollisionEnemies.add(enemyIndex)
      }

      for (const collision of collisions) {
        const key = this.getCollisionKey(enemyIndex, collision)
        nextCollisionKeys.add(key)
        this.highlightCollision(enemyIndex, collision)

        if (!this.activeCollisionKeys.has(key)) {
          this.logCollision(enemyIndex, collision)
        }
      }

      if (
        collisions.length > 0 &&
        !this.activeCollisionEnemies.has(enemyIndex)
      ) {
        this.applyRammingDamage(enemy, enemyIndex, collisions)
      }
    })

    this.activeCollisionKeys.clear()
    for (const key of nextCollisionKeys) {
      this.activeCollisionKeys.add(key)
    }

    this.activeCollisionEnemies.clear()
    for (const enemyIndex of nextCollisionEnemies) {
      this.activeCollisionEnemies.add(enemyIndex)
    }
  }

  private applyRammingDamage(
    enemy: EnemyShip,
    enemyIndex: number,
    collisions: PixelCollision[],
  ): void {
    const relativeVelocity = {
      x: this.state.ship.velocity.x - enemy.velocity.x,
      y: this.state.ship.velocity.y - enemy.velocity.y,
    }
    const impactSpeed = Math.hypot(relativeVelocity.x, relativeVelocity.y)
    const enemyDamage = this.getImpactDamageCount(impactSpeed)

    if (enemyDamage === 0) {
      return
    }

    const playerDamage = Math.max(1, Math.ceil(enemyDamage * 0.5))
    const worldImpactPoint = this.getAverageCollisionCenter(
      collisions.map((collision) => ({
        x: (collision.shipACenter.x + collision.shipBCenter.x) / 2,
        y: (collision.shipACenter.y + collision.shipBCenter.y) / 2,
      })),
    )

    const destroyedPlayerPixels = removePixelsNearImpact(
      this.state.ship,
      worldImpactPoint.x,
      worldImpactPoint.y,
      playerDamage,
    )
    const destroyedEnemyPixels = removePixelsNearImpact(
      enemy,
      worldImpactPoint.x,
      worldImpactPoint.y,
      enemyDamage,
    )

    this.highlightDestroyedPixels("player", undefined, destroyedPlayerPixels)
    this.highlightDestroyedPixels("enemy", enemyIndex, destroyedEnemyPixels)
  }

  private getImpactDamageCount(impactSpeed: number): number {
    if (impactSpeed < minimumDamageImpactSpeed) {
      return 0
    }

    if (impactSpeed < 150) {
      return 1
    }

    if (impactSpeed < 300) {
      return 2 + Math.floor(((impactSpeed - 150) / 150) * 3)
    }

    return 5 + Math.floor((impactSpeed - 300) / 120)
  }

  private getAverageCollisionCenter(
    points: readonly { x: number; y: number }[],
  ): {
    x: number
    y: number
  } {
    const total = points.reduce(
      (sum, point) => ({
        x: sum.x + point.x,
        y: sum.y + point.y,
      }),
      { x: 0, y: 0 },
    )

    return {
      x: total.x / points.length,
      y: total.y / points.length,
    }
  }

  private highlightDestroyedPixels(
    ship: "player" | "enemy",
    enemyIndex: number | undefined,
    pixels: readonly ShipPixel[],
  ): void {
    for (const pixel of pixels) {
      this.state.pixelHighlights.push({
        ship,
        enemyIndex,
        gridX: pixel.gridX,
        gridY: pixel.gridY,
        remainingSeconds: collisionHighlightDuration,
      })
    }
  }

  private highlightCollision(
    enemyIndex: number,
    { shipAPixel, shipBPixel }: PixelCollision,
  ): void {
    this.state.pixelHighlights.push(
      {
        ship: "player",
        gridX: shipAPixel.gridX,
        gridY: shipAPixel.gridY,
        remainingSeconds: collisionHighlightDuration,
      },
      {
        ship: "enemy",
        enemyIndex,
        gridX: shipBPixel.gridX,
        gridY: shipBPixel.gridY,
        remainingSeconds: collisionHighlightDuration,
      },
    )
  }

  private logCollision(enemyIndex: number, collision: PixelCollision): void {
    console.log("Pixel collision", {
      enemyIndex,
      playerPixel: {
        gridX: collision.shipAPixel.gridX,
        gridY: collision.shipAPixel.gridY,
        color: collision.shipAPixel.color,
      },
      enemyPixel: {
        gridX: collision.shipBPixel.gridX,
        gridY: collision.shipBPixel.gridY,
        color: collision.shipBPixel.color,
      },
      distance: Number(collision.distance.toFixed(2)),
    })
  }

  private getCollisionKey(
    enemyIndex: number,
    { shipAPixel, shipBPixel }: PixelCollision,
  ): string {
    return [
      enemyIndex,
      shipAPixel.gridX,
      shipAPixel.gridY,
      shipBPixel.gridX,
      shipBPixel.gridY,
    ].join(":")
  }

  private wrapShip(ship: Ship): void {
    const { width, height } = this.state

    if (ship.position.x < 0) {
      ship.position.x += width
    } else if (ship.position.x >= width) {
      ship.position.x -= width
    }

    if (ship.position.y < 0) {
      ship.position.y += height
    } else if (ship.position.y >= height) {
      ship.position.y -= height
    }
  }
}
