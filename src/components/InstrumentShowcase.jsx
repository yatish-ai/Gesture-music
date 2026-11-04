import React, { useState } from 'react';
import { Volume2, Check, Music2 } from 'lucide-react';
import { INSTRUMENTS } from '../instrumentEngine';

const INSTRUMENT_METAS = {
  acoustic_grand_piano: {
    description: 'Concert acoustic grand with rich harmonic resonance and dynamic timbral depth.',
    tags: ['Acoustic', 'Percussive', 'Universal'],
    image: '/src/assets/images/instrument_grand_piano_1793778105728.jpg',
    color: '#111116'
  },
  electric_piano_1: {
    description: 'Classic vintage tines with warm chorus character, smooth release, and mellow overtones.',
    tags: ['Vintage Keys', 'Neo-Soul', 'Ambient'],
    image: '/src/assets/images/instrument_electric_piano_1793778106332.jpg',
    color: '#111116'
  },
  acoustic_guitar_nylon: {
    description: 'Crisp plucked classical strings with authentic woody attack and intimate decay.',
    tags: ['Fingerstyle', 'Nylon Strings', 'Warm'],
    image: '/src/assets/images/instrument_nylon_guitar_1793778108326.jpg',
    color: '#111116'
  },
  violin: {
    description: 'Expressive bowed orchestral strings capable of lyrical legato and soaring high leads.',
    tags: ['Bowed Strings', 'Orchestral', 'Sustained'],
    image: '/src/assets/images/instrument_violin_1793778106638.jpg',
    color: '#111116'
  },
  flute: {
    description: 'Pure acoustic woodwind flute with delicate breath transients and clear upper harmonics.',
    tags: ['Woodwind', 'Airy', 'Melodic'],
    image: '/src/assets/images/instrument_flute_1793778108563.jpg',
    color: '#111116'
  },
  lead_2_sawtooth: {
    description: 'Punchy analog sawtooth synthesizer with aggressive harmonics, cutting through any mix.',
    tags: ['Analog Synth', 'Electronic', 'Lead'],
    image: '/src/assets/images/instrument_synth_lead_1793778108288.jpg',
    color: '#111116'
  }
};

export default function InstrumentShowcase({
  leftInstrument,
  setLeftInstrument,
  rightInstrument,
  setRightInstrument,
  onPreviewInstrument
}) {
  const [playingId, setPlayingId] = useState(null);

  const handlePreview = async (id) => {
    setPlayingId(id);
    if (onPreviewInstrument) {
      await onPreviewInstrument(id);
    }
    setTimeout(() => {
      setPlayingId((curr) => (curr === id ? null : curr));
    }, 1200);
  };

  return (
    <section id="instruments" className="instruments-section">
      <div className="section-head">
        <div className="section-kicker">
          <span>GENERAL MIDI SOUNDBANK</span>
          <span className="kicker-sep">/</span>
          <span>MULTI-TIMBRAL ROUTING</span>
        </div>
        <h2 className="section-title">Six acoustic & synthesized instruments.</h2>
        <p className="section-desc">
          Assign independent instruments to your left and right hands. Lay down bass and chords with one hand while soaring into lead melodies with the other.
        </p>
      </div>

      <div className="instruments-grid">
        {INSTRUMENTS.map((inst) => {
          const meta = INSTRUMENT_METAS[inst.id] || {};
          const isLeft = leftInstrument === inst.id;
          const isRight = rightInstrument === inst.id;
          const isPlaying = playingId === inst.id;

          return (
            <div
              key={inst.id}
              className={`instrument-card ${(isLeft || isRight) ? 'is-active-route' : ''}`}
            >
              <div className="inst-card-top">
                <div className="inst-family-tag">{inst.family}</div>
                <button
                  type="button"
                  className={`inst-preview-btn ${isPlaying ? 'is-playing' : ''}`}
                  title={`Preview ${inst.label}`}
                  onClick={() => handlePreview(inst.id)}
                >
                  <Volume2 size={15} />
                  <span>{isPlaying ? 'Auditioning…' : 'Preview Note'}</span>
                </button>
              </div>

              {/* Real Instrument Photo (Replaced random lines) */}
              <div className="inst-image-frame">
                <img
                  src={meta.image}
                  alt={inst.label}
                  className="inst-photo"
                  loading="lazy"
                />
                <div className="inst-midi-badge">PRG #{inst.program}</div>
              </div>

              <div className="inst-info">
                <h3 className="inst-name">{inst.label}</h3>
                <p className="inst-desc">{meta.description}</p>
              </div>

              {/* Hand Assignment Controls */}
              <div className="inst-hand-assign">
                <span className="assign-label">Assigned To:</span>
                <div className="assign-btn-group">
                  <button
                    type="button"
                    className={`assign-chip ${isLeft ? 'active-left' : ''}`}
                    onClick={() => setLeftInstrument(inst.id)}
                  >
                    {isLeft && <Check size={12} />}
                    <span>Left Hand</span>
                  </button>

                  <button
                    type="button"
                    className={`assign-chip ${isRight ? 'active-right' : ''}`}
                    onClick={() => setRightInstrument(inst.id)}
                  >
                    {isRight && <Check size={12} />}
                    <span>Right Hand</span>
                  </button>

                  <button
                    type="button"
                    className={`assign-chip ${isLeft && isRight ? 'active-both' : ''}`}
                    onClick={() => {
                      setLeftInstrument(inst.id);
                      setRightInstrument(inst.id);
                    }}
                  >
                    <span>Both</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="routing-tip-banner">
        <div className="routing-tip-content">
          <Music2 size={20} className="tip-music-icon" />
          <div className="tip-text">
            <strong>Pro Tip: Independent Hand Synthesis</strong>
            <span>Set your Left Hand to Acoustic Grand Piano for chords and basslines, and your Right Hand to Synthesizer or Violin for expressive solos.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
