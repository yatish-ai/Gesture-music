// General MIDI program names supported by soundfont-player / FluidR3_GM.
export const INSTRUMENTS = [
  { id: 'acoustic_grand_piano', label: 'GRAND PIANO', family: 'PIANO', program: 0 },
  { id: 'electric_piano_1', label: 'ELECTRIC PIANO', family: 'KEYS', program: 4 },
  { id: 'acoustic_guitar_nylon', label: 'ACOUSTIC GUITAR', family: 'STRINGS', program: 24 },
  { id: 'violin', label: 'VIOLIN', family: 'STRINGS', program: 40 },
  { id: 'flute', label: 'FLUTE', family: 'WINDS', program: 73 },
  { id: 'lead_2_sawtooth', label: 'SYNTHESIZER', family: 'SYNTH', program: 81 },
];

function noteToFrequency(note) {
  const NOTES = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  const match = String(note).match(/^([A-G][b#]?)([-0-9]+)$/);
  if (!match) return 440;
  const [, name, octaveStr] = match;
  const semitone = NOTES[name] ?? 0;
  const octave = parseInt(octaveStr, 10);
  const midi = (octave + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function createFallbackPlayer(context, destination, instrumentId) {
  return {
    play(note, time = context.currentTime, options = {}) {
      const freq = noteToFrequency(note);
      const osc = context.createOscillator();
      const oscGain = context.createGain();

      const typeMap = {
        acoustic_grand_piano: 'triangle',
        electric_piano_1: 'sine',
        acoustic_guitar_nylon: 'triangle',
        violin: 'sawtooth',
        flute: 'sine',
        lead_2_sawtooth: 'sawtooth',
      };
      osc.type = typeMap[instrumentId] || 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      const gainValue = (options.gain ?? 0.5) * 0.4;
      const attack = 0.015;
      const decay = 0.3;
      const sustain = 0.25;

      oscGain.gain.setValueAtTime(0.0001, time);
      oscGain.gain.exponentialRampToValueAtTime(Math.max(0.001, gainValue), time + attack);
      oscGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainValue * sustain), time + attack + decay);

      osc.connect(oscGain);
      oscGain.connect(destination);
      osc.start(time);

      let stopped = false;
      return {
        stop(stopTime = context.currentTime) {
          if (stopped) return;
          stopped = true;
          try {
            oscGain.gain.cancelScheduledValues(stopTime);
            oscGain.gain.setValueAtTime(oscGain.gain.value, stopTime);
            oscGain.gain.exponentialRampToValueAtTime(0.0001, stopTime + 0.05);
            osc.stop(stopTime + 0.06);
            setTimeout(() => {
              try { osc.disconnect(); oscGain.disconnect(); } catch {}
            }, 100);
          } catch {}
        }
      };
    }
  };
}

export async function loadInstrument(context, destination, id, cache) {
  if (cache.has(id)) return cache.get(id);
  const loadPromise = (async () => {
    try {
      const mod = await import('soundfont-player');
      const Soundfont = mod.default?.instrument ? mod.default : (mod.instrument ? mod : (mod.default || mod));
      if (Soundfont && typeof Soundfont.instrument === 'function') {
        return await Soundfont.instrument(context, id, {
          destination,
          soundfont: 'FluidR3_GM',
          format: 'mp3',
        });
      }
    } catch (error) {
      console.warn(`[Gesture Music] Soundfont load failed for ${id}, using Web Audio fallback:`, error);
    }
    return createFallbackPlayer(context, destination, id);
  })();

  cache.set(id, loadPromise);
  return await loadPromise;
}

// Route notes to the instrument selected for the hand that triggered them.
export function getInstrumentForHand(hand, leftInstrument, rightInstrument) {
  return hand === 'LEFT' ? leftInstrument : rightInstrument;
}
