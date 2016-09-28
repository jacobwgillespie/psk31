import VARICODE from './varicode';

export const messageToBits = message =>
  message.split('').reduce(
    (bits, character) => bits.concat(VARICODE[character] || []).concat([0, 0]),
    []
  );

export const bitsToPhases = (bits) => {
  const phases = [0, 1, 0, 1, 0, 1]; // 000
  bits.forEach((bit) => {
    const previousPhase = phases[phases.length - 1];
    const differentPhase = previousPhase === 0 ? 1 : 0;
    if (bit === 1) {
      phases.push(previousPhase);
      phases.push(previousPhase);
    } else {
      phases.push(previousPhase);
      phases.push(differentPhase);
    }
  });

  return phases;
};
