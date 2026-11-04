import React from 'react';
import { Sliders, Activity, Radio, Volume2, Sparkles, Cpu } from 'lucide-react';

const HIGHLIGHTS = [
  {
    icon: Activity,
    title: '10-Finger Polyphony',
    detail: 'Full independent pitch mapping for each finger across both hands—from C4 up to E5.'
  },
  {
    icon: Sliders,
    title: 'Kinetic Velocity',
    detail: 'Physical speed estimation calculates striking velocity to modulate loudness and timbre dynamically.'
  },
  {
    icon: Radio,
    title: 'Instant Chord Engine',
    detail: 'Harmonic grouping engine identifies triads, 7ths, and inversions within a configurable 130ms window.'
  },
  {
    icon: Cpu,
    title: 'Independent Hand Routing',
    detail: 'Route separate instruments to each hand—play piano accompaniment with your left and violin with your right.'
  }
];

export default function ExperienceSection() {
  return (
    <section id="experience" className="experience-section">
      <div className="section-head">
        <div className="section-kicker">
          <span>DYNAMIC EXPRESSION</span>
          <span className="kicker-sep">/</span>
          <span>STUDIO CAPABILITIES</span>
        </div>
        <h2 className="section-title">Designed for expressive musical improvisation.</h2>
        <p className="section-desc">
          No hardware controllers, MIDI cables, or wear-and-tear. Just step into frame, raise your hands, and shape sound in the air.
        </p>
      </div>

      <div className="experience-grid">
        {HIGHLIGHTS.map((h, i) => {
          const Icon = h.icon;
          return (
            <div key={i} className="experience-card">
              <div className="exp-icon-wrap">
                <Icon size={22} />
              </div>
              <h3 className="exp-card-title">{h.title}</h3>
              <p className="exp-card-detail">{h.detail}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
