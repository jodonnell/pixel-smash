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

const handleBuildPointer = (event: MouseEvent): void => {
  if (game.state.mode !== "build") {
    return
  }

  event.preventDefault()

  const point = getCanvasPoint(event)
  const gridPoint = game.screenToBuildGrid(point.x, point.y)

  if (event.button === 2 || event.shiftKey) {
    game.tryRemovePixel(gridPoint.x, gridPoint.y)
  } else if (event.button === 0) {
    game.tryPlacePixel(gridPoint.x, gridPoint.y)
  }
}

canvas.addEventListener("mousedown", handleBuildPointer)
canvas.addEventListener("contextmenu", (event) => {
  if (game.state.mode === "build") {
    event.preventDefault()
  }
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
