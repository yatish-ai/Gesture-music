const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const TEMPLATES = [
  ['MAJOR',[0,4,7]], ['MINOR',[0,3,7]], ['DIMINISHED',[0,3,6]], ['AUGMENTED',[0,4,8]],
  ['SUS2',[0,2,7]], ['SUS4',[0,5,7]], ['MAJOR 7',[0,4,7,11]],
  ['MINOR 7',[0,3,7,10]], ['DOMINANT 7',[0,4,7,10]],
  ['DIMINISHED 7',[0,3,6,9]], ['MINOR 7♭5',[0,3,6,10]]
];

export function midiToName(midi) {
  return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

export function recognizeChord(midiNotes = []) {
  const notes = [...new Set(midiNotes)].sort((a,b)=>a-b);
  const pcs = [...new Set(notes.map(n => ((n % 12) + 12) % 12))].sort((a,b)=>a-b);
  if (pcs.length < 2) return null;

  let best = null;
  for (let root = 0; root < 12; root++) {
    const intervals = pcs.map(pc => (pc - root + 12) % 12).sort((a,b)=>a-b);
    for (const [quality, template] of TEMPLATES) {
      const exact = template.every(i => intervals.includes(i)) && intervals.every(i => template.includes(i));
      if (exact) {
        const rootMidi = notes.find(n => n % 12 === root);
        const bassPc = notes[0] % 12;
        const bassInterval = (bassPc - root + 12) % 12;
        const inversion = bassInterval === 0 ? 'ROOT POSITION'
          : bassInterval === template[1] ? '1ST INVERSION'
          : bassInterval === template[2] ? '2ND INVERSION'
          : bassInterval === template[3] ? '3RD INVERSION' : 'INVERSION';
        best = { name: `${NOTE_NAMES[root]} ${quality}`, root: NOTE_NAMES[root], quality,
          inversion, notes: notes.map(midiToName), midiNotes: notes, pitchClasses: pcs };
        break;
      }
    }
    if (best) break;
  }
  return best || { name: 'CUSTOM NOTE CLUSTER', root: null, quality: 'CUSTOM',
    inversion: '—', notes: notes.map(midiToName), midiNotes: notes, pitchClasses: pcs };
}
