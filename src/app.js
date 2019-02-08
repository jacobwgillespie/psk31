import {bitsToPhases, messageToBits, phasesToAmp} from './utils'

import {buildBinaryPhaseShiftKeyingOscillator} from './psk'

const ENERGY_PER_BIT = 100
const CARRIER_FREQUENCY = 1000
const BPSK31_SAMPLE_RATE = 44100
const BAUD_RATE = 31.25
const HALF_BAUD_RATE = BAUD_RATE / 2
const BIT_DURATION = BPSK31_SAMPLE_RATE / BAUD_RATE
const PAYLOAD = 'CQ CQ CQ de KD5TEN KD5TEN KD5TEN pse k'
const PAYLOAD_BITS = messageToBits(PAYLOAD)
const PAYLOAD_PHASES = bitsToPhases(PAYLOAD_BITS)
const PAYLOAD_AMPLITUDE_MODE = phasesToAmp(PAYLOAD_PHASES)

const HALF_PI = Math.PI / 2

const bpsk31 = buildBinaryPhaseShiftKeyingOscillator(
  ENERGY_PER_BIT,
  BIT_DURATION,
  CARRIER_FREQUENCY,
)

const app = ctx => {
  let startTime

  // const ctx = new AudioContext(1, 0, BPSK31_SAMPLE_RATE);

  const spn = ctx.createScriptProcessor(16384, 1, 1)
  spn.onaudioprocess = audioProcessingEvent => {
    const outputData = audioProcessingEvent.outputBuffer.getChannelData(0)
    let currentPhase = 0
    startTime = startTime || audioProcessingEvent.playbackTime
    for (let sample = 0; sample < outputData.length; sample += 1) {
      const time = audioProcessingEvent.playbackTime - startTime + sample / ctx.sampleRate

      const frame = Math.floor((time * 1000) / HALF_BAUD_RATE)
      const progress = ((time * 1000) % HALF_BAUD_RATE) / HALF_BAUD_RATE

      const currentPhase = PAYLOAD_PHASES[frame]
      const ampMode = PAYLOAD_AMPLITUDE_MODE[frame]

      let ampModifier
      switch (ampMode) {
        case 1:
          ampModifier = Math.cos(2 * Math.PI + (Math.PI / 2) * progress)
          break

        case 2:
          ampModifier = Math.cos((3 / 2) * Math.PI + (Math.PI / 2) * progress)
          break

        default:
          ampModifier = 1
      }

      const result = bpsk31(time, currentPhase, ampModifier)
      outputData[sample] = result
    }
  }

  spn.connect(ctx.destination)
}

window.play = () => {
  const ctx = new AudioContext() //(1, 0, BPSK31_SAMPLE_RATE);
  app(ctx)
}
