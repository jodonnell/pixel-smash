import type { ImpactSound } from "./game"

export class SoundEffects {
  private audioContext?: AudioContext

  playImpact({ impactSpeed, destroyedPixels }: ImpactSound): void {
    const context = this.getAudioContext()

    if (context === undefined) {
      return
    }

    const now = context.currentTime
    const duration = 0.06 + Math.min(0.08, destroyedPixels * 0.012)
    const oscillator = context.createOscillator()
    const oscillatorGain = context.createGain()
    const noise = this.createNoise(context, duration)
    const noiseGain = context.createGain()

    oscillator.type = "square"
    oscillator.frequency.setValueAtTime(
      120 + Math.min(impactSpeed, 500) * 0.8,
      now,
    )
    oscillator.frequency.exponentialRampToValueAtTime(65, now + duration)
    oscillatorGain.gain.setValueAtTime(0.08, now)
    oscillatorGain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    noiseGain.gain.setValueAtTime(0.12, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    oscillator.connect(oscillatorGain)
    oscillatorGain.connect(context.destination)
    noise.connect(noiseGain)
    noiseGain.connect(context.destination)

    oscillator.start(now)
    noise.start(now)
    oscillator.stop(now + duration)
    noise.stop(now + duration)
  }

  private getAudioContext(): AudioContext | undefined {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext

    if (AudioContextClass === undefined) {
      return undefined
    }

    this.audioContext ??= new AudioContextClass()

    if (this.audioContext.state === "suspended") {
      void this.audioContext.resume()
    }

    return this.audioContext
  }

  private createNoise(
    context: AudioContext,
    durationSeconds: number,
  ): AudioBufferSourceNode {
    const bufferSize = Math.max(
      1,
      Math.floor(context.sampleRate * durationSeconds),
    )
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
    const data = buffer.getChannelData(0)

    for (let index = 0; index < bufferSize; index += 1) {
      data[index] = Math.random() * 2 - 1
    }

    const source = context.createBufferSource()
    source.buffer = buffer
    return source
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}
