import { bitsToPhases, messageToBits, phasesToAmp } from './utils';

import { buildBinaryPhaseShiftKeyingOscillator } from './psk';

const ENERGY_PER_BIT = 100;
const CARRIER_FREQUENCY = 1000;
const BPSK31_SAMPLE_RATE = 44100;
const BAUD_RATE = 31.25;
const BIT_DURATION = BPSK31_SAMPLE_RATE / BAUD_RATE;
const PAYLOAD = 'CQ CQ CQ de KD5TEN KD5TEN KD5TEN pse k';
const PAYLOAD_BITS = messageToBits(PAYLOAD);

// const PAYLOAD_BITS = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const PAYLOAD_PHASES = bitsToPhases(PAYLOAD_BITS);
const PAYLOAD_AMPLITUDE_MODE = phasesToAmp(PAYLOAD_PHASES);
console.log('bits', PAYLOAD_BITS, 'phases', PAYLOAD_PHASES, 'amp', PAYLOAD_AMPLITUDE_MODE);

const HALF_PI = Math.PI / 2;

const bpsk31 = buildBinaryPhaseShiftKeyingOscillator(
  ENERGY_PER_BIT, BIT_DURATION, CARRIER_FREQUENCY
);

(() => {
  let startTime;
  let previousBit = 0;

  const calculateBit = (time, mtime) => {
    const currentTime = time * 1000;
    const bit = PAYLOAD_BITS[Math.floor(currentTime / 31.25)] || 0;
    if (bit !== previousBit) {
      // console.log(`changing bits from ${previousBit} to ${bit}`, (time * 1000) / 31.25, mtime);
    }
    previousBit = bit;

    return bit;
  };

  const calculatePhase = (time, mtime, currentPhase) => {
    if (calculateBit(time, mtime) === 0 && mtime > 15.625) {
      return currentPhase === 0 ? 1 : 0;
    }

    return currentPhase;
  };

  let previousMode = 0;
  let previousModifier = 1;

  const calculateAmpModifier = (mode, mtime) => {
    switch (mode) {
      case 0:
        return 1;

      case 1:
        return Math.cos(HALF_PI * (mtime / 15.625));

      case 2:
        return Math.cos((3 * HALF_PI) + (HALF_PI * ((mtime - 15.625) / 15.625)));

      default:
        return 1;
    }
  };

  const ctx = new AudioContext(1, 0, BPSK31_SAMPLE_RATE);

  const spn = ctx.createScriptProcessor(16384, 1, 1);
  spn.onaudioprocess = (audioProcessingEvent) => {
    const outputData = audioProcessingEvent.outputBuffer.getChannelData(0);
    let currentPhase = 0;
    startTime = startTime || audioProcessingEvent.playbackTime;
    for (let sample = 0; sample < outputData.length; sample += 1) {
      const t = (audioProcessingEvent.playbackTime - startTime) + (sample / ctx.sampleRate);

      const mtime = (t * 1000) % 31.25;

      const idx = Math.floor((t * 1000) / 15.625);
      const i = PAYLOAD_BITS[idx];
      const ampMode = PAYLOAD_AMPLITUDE_MODE[idx];

      // const i = calculatePhase(t, mtime, currentPhase);
      // currentPhase = i;
      const ampModifier = calculateAmpModifier(ampMode, mtime);
      const result = bpsk31(t, i, ampModifier);
      outputData[sample] = result;
    }
  };

  spn.connect(ctx.destination);
})();
