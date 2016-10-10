import VARICODE from './varicode';

export const messageToBits = message =>
  message.split('').reduce(
    (bits, character) => bits.concat(VARICODE[character] || []).concat([0, 0]),
    []
  ).concat([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

export const bitsToPhases = (bits) => {
  const phases = [0, 1, 1, 0, 0, 1]; // 000
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

export const phasesToAmp = (phases) => {
  const amp = [];

  for (let i = 0; i < phases.length - 1; i += 2) {
    const first = phases[i];
    const second = phases[i + 1];

    if (first !== second) {
      amp.push(1);
      amp.push(2);
    } else {
      amp.push(0);
      amp.push(0);
    }
  }

  return amp;
};
