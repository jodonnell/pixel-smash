import "../style.css"
import { Game } from "./game"
import { KeyboardInput } from "./input"
import { Renderer } from "./render"
import { SoundEffects } from "./sound"

const canvasWidth = 960
const canvasHeight = 540
const maxFrameDelta = 1 / 20

const canvas = document.createElement("canvas")
canvas.width = canvasWidth
canvas.height = canvasHeight
canvas.tabIndex = 0
canvas.setAttribute("aria-label", "Pixel Smash prototype")
document.body.appendChild(canvas)
canvas.focus()

const context = canvas.getContext("2d")

if (context === null) {
  throw new Error("Canvas 2D rendering is not supported.")
}

const soundEffects = new SoundEffects()
const game = new Game(canvasWidth, canvasHeight, (impact) =>
  soundEffects.playImpact(impact),
)
const input = new KeyboardInput(
  () => game.toggleMode(),
  (color) => game.setSelectedPixelColor(color),
  () => game.restart(),
  () => game.togglePause(),
)
const renderer = new Renderer(context)

const getCanvasPoint = (event: MouseEvent): { x: number; y: number } => {
  const bounds = canvas.getBoundingClientRect()

  return {
    x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
    y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
  }
}

type BuildPointerAction = "place" | "remove"

let lastBuildGridPoint: { x: number; y: number } | undefined

const getBuildPointerAction = (
  event: MouseEvent,
): BuildPointerAction | undefined => {
  const isLeftButtonDown = (event.buttons & 1) === 1
  const isRightButtonDown = (event.buttons & 2) === 2

  if (
    (event.type === "mousedown" && event.button === 2) ||
    isRightButtonDown ||
    (event.shiftKey && isLeftButtonDown)
  ) {
    return "remove"
  }

  if ((event.type === "mousedown" && event.button === 0) || isLeftButtonDown) {
    return "place"
  }

  return undefined
}

const applyBuildPointerAction = (
  action: BuildPointerAction,
  gridX: number,
  gridY: number,
): void => {
  if (action === "remove") {
    game.tryRemovePixel(gridX, gridY)
    return
  }

  game.tryPlacePixel(gridX, gridY)
}

const applyBuildPointerPath = (
  action: BuildPointerAction,
  from: { x: number; y: number },
  to: { x: number; y: number },
): void => {
  let x = from.x
  let y = from.y
  const stepX = Math.sign(to.x - from.x)
  const stepY = Math.sign(to.y - from.y)

  while (x !== to.x) {
    x += stepX
    applyBuildPointerAction(action, x, y)
  }

  while (y !== to.y) {
    y += stepY
    applyBuildPointerAction(action, x, y)
  }
}

const handleBuildPointer = (event: MouseEvent): void => {
  if (game.state.mode !== "build") {
    return
  }

  const action = getBuildPointerAction(event)

  if (action === undefined) {
    return
  }

  event.preventDefault()

  const point = getCanvasPoint(event)
  const gridPoint = game.screenToBuildGrid(point.x, point.y)

  if (lastBuildGridPoint === undefined) {
    applyBuildPointerAction(action, gridPoint.x, gridPoint.y)
  } else if (
    lastBuildGridPoint.x !== gridPoint.x ||
    lastBuildGridPoint.y !== gridPoint.y
  ) {
    applyBuildPointerPath(action, lastBuildGridPoint, gridPoint)
  }

  lastBuildGridPoint = gridPoint
}

canvas.addEventListener("mousedown", handleBuildPointer)
canvas.addEventListener("mousemove", handleBuildPointer)
canvas.addEventListener("contextmenu", (event) => {
  if (game.state.mode === "build") {
    event.preventDefault()
  }
})
window.addEventListener("mouseup", () => {
  lastBuildGridPoint = undefined
})

let previousTimestamp = performance.now()

const frame = (timestamp: number): void => {
  const deltaSeconds = Math.min(
    (timestamp - previousTimestamp) / 1000,
    maxFrameDelta,
  )
  previousTimestamp = timestamp

  game.update(input.getState(), deltaSeconds)
  renderer.render(game.state)

  window.requestAnimationFrame(frame)
}

window.requestAnimationFrame(frame)

window.addEventListener("beforeunload", () => {
  input.destroy()
})
