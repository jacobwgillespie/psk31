import { messageToBits } from './utils';

import { buildBinaryPhaseShiftKeyingOscillator } from './psk';

const ENERGY_PER_BIT = 100;
const CARRIER_FREQUENCY = 1200;
const BPSK31_SAMPLE_RATE = 44100;
const BAUD_RATE = 31.25;
const BIT_DURATION = BPSK31_SAMPLE_RATE / BAUD_RATE;
const PAYLOAD = 'The variable-length coding used in the BPSK system was chosen by collecting a large volume of English language ASCII text files and analysing them to establish the occurrence-frequency of each of the 128 ASCII characters.';
const PAYLOAD_BITS = messageToBits(PAYLOAD);

const HALF_PI = Math.PI / 2;

const bpsk31 = buildBinaryPhaseShiftKeyingOscillator(
  ENERGY_PER_BIT, BIT_DURATION, CARRIER_FREQUENCY
);

(() => {
  let startTime;
  let currentPhase = 0;

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

  const calculatePhase = (time, mtime) => {
    if (calculateBit(time, mtime) === 0 && mtime > 15.625) {
      currentPhase = currentPhase === 0 ? 1 : 0;
    }

    return currentPhase;
  };

  let previousMode = 0;
  let previousModifier = 1;

  const calculateAmpModifier = (time, mtime) => {
    let modifier = 1;
    let mode = previousMode;
    const bit = calculateBit(time, mtime);

    if (bit === 1) {
      modifier = 1;
      mode = 0;
    } else if (mtime < 15.625) {
      modifier = Math.cos(HALF_PI * (mtime / 15.625));
      mode = 1;
    } else {
      modifier = Math.cos((3 * HALF_PI) + (HALF_PI * ((mtime - 15.625) / 15.625)));
      mode = 2;
    }

    if (mode !== previousMode) {
      // console.log(time, 'change', mode, modifier, previousModifier, bit, mtime);
    }

    previousMode = mode;
    previousModifier = modifier;

    return modifier;
  };

  const ctx = new AudioContext(1, 0, BPSK31_SAMPLE_RATE);

  const spn = ctx.createScriptProcessor(16384, 1, 1);
  spn.onaudioprocess = (audioProcessingEvent) => {
    const outputData = audioProcessingEvent.outputBuffer.getChannelData(0);
    startTime = startTime || audioProcessingEvent.playbackTime;
    for (let sample = 0; sample < outputData.length; sample += 1) {
      const t = (audioProcessingEvent.playbackTime - startTime) + (sample / ctx.sampleRate);

      const mtime = (t * 1000) % 31.25;

      const i = calculatePhase(t, mtime);
      const ampModifier = calculateAmpModifier(t, mtime);
      const result = bpsk31(t, i, ampModifier);
      outputData[sample] = result;
    }
  };

  spn.connect(ctx.destination);
})();
