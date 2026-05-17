import "../style.css"
import { Game } from "./game"
import { KeyboardInput } from "./input"
import { Renderer } from "./render"

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

const input = new KeyboardInput()
const game = new Game(canvasWidth, canvasHeight)
const renderer = new Renderer(context)

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
