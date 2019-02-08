// Parameter names come from the equation for BPSK here:
// https://en.m.wikipedia.org/wiki/Phase-shift_keying#Binary_phase-shift_keying_.28BPSK.29

export const binaryPhaseShiftKeyingOscillator = (t, a, carrierFrequency, bit, ampModifier) =>
  ampModifier * a * Math.cos(2 * Math.PI * carrierFrequency * t + Math.PI * (1 - bit))

export const buildBinaryPhaseShiftKeyingOscillator = (
  energyPerBit,
  symbolDuration,
  carrierFrequency,
) => {
  const a = Math.sqrt(2 * (energyPerBit / symbolDuration))
  return (t, bit, ampModifier) =>
    binaryPhaseShiftKeyingOscillator(t, a, carrierFrequency, bit, ampModifier)
}
