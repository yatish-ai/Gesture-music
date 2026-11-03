// General MIDI program names supported by soundfont-player / FluidR3_GM.
export const INSTRUMENTS = [
  { id: 'acoustic_grand_piano', label: 'GRAND PIANO', family: 'PIANO', program: 0 },
  { id: 'electric_piano_1', label: 'ELECTRIC PIANO', family: 'KEYS', program: 4 },
  { id: 'acoustic_guitar_nylon', label: 'ACOUSTIC GUITAR', family: 'STRINGS', program: 24 },
  { id: 'violin', label: 'VIOLIN', family: 'STRINGS', program: 40 },
  { id: 'flute', label: 'FLUTE', family: 'WINDS', program: 73 },
  { id: 'lead_2_sawtooth', label: 'SYNTHESIZER', family: 'SYNTH', program: 81 },
];

export async function loadInstrument(context, destination, id, cache) {
  if (cache.has(id)) return cache.get(id);
  const Soundfont = (await import('soundfont-player')).default;
  const promise = Soundfont.instrument(context, id, {
    destination,
    soundfont: 'FluidR3_GM',
    format: 'mp3',
  });
  cache.set(id, promise);
  try { return await promise; }
  catch (error) { cache.delete(id); throw error; }
}

// Route notes to the instrument selected for the hand that triggered them.
export function getInstrumentForHand(hand, leftInstrument, rightInstrument) {
  return hand === 'LEFT' ? leftInstrument : rightInstrument;
}
