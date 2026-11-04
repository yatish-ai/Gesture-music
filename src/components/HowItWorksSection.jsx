import React from 'react';
import { Camera, Eye, Music, Activity, Sparkles, Layers } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Capture',
    subtitle: 'Zero latency video input',
    description: 'The webcam detects your hands using computer vision, streaming high-frame-rate frames into our processing pipeline.',
    icon: Camera,
    accent: '#ff6b2b',
    detailBadge: '1280x720 60 FPS'
  },
  {
    step: '02',
    title: 'Recognize',
    subtitle: 'Joint angle & velocity estimation',
    description: 'The system identifies finger movements and gestures using MediaPipe hand landmarks with 21 coordinates per hand.',
    icon: Eye,
    accent: '#ffa439',
    detailBadge: '21 Joint Vectors'
  },
  {
    step: '03',
    title: 'Play',
    subtitle: 'Expressive polyphonic audio',
    description: 'Hand gestures are converted into musical notes in real time with dynamic velocity and multi-finger chord detection.',
    icon: Music,
    accent: '#e85d04',
    detailBadge: 'FluidR3 GM Engine'
  }
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="how-it-works-section">
      <div className="section-head">
        <div className="section-kicker">
          <span>PIPELINE ARCHITECTURE</span>
          <span className="kicker-sep">/</span>
          <span>HOW IT WORKS</span>
        </div>
        <h2 className="section-title">From gesture in the air to sound in the room.</h2>
        <p className="section-desc">
          State-of-the-art browser machine learning translates subtle finger bends and rapid motions into expressive acoustic notes.
        </p>
      </div>

      <div className="steps-grid">
        {STEPS.map((item) => {
          const IconComponent = item.icon;
          return (
            <div key={item.step} className="step-card">
              <div className="step-card-header">
                <span className="step-number">{item.step}</span>
                <span className="step-badge">{item.detailBadge}</span>
              </div>

              <div className="step-icon-wrap" style={{ borderColor: `${item.accent}33`, backgroundColor: `${item.accent}14` }}>
                <IconComponent size={28} style={{ color: item.accent }} />
              </div>

              <h3 className="step-title">{item.title}</h3>
              <p className="step-subtitle">{item.subtitle}</p>
              <p className="step-body">{item.description}</p>

              <div className="step-indicator-bar" style={{ background: `linear-gradient(90deg, ${item.accent}, transparent)` }} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
