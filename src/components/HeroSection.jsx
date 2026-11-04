import React from 'react';
import { Play } from 'lucide-react';

export default function HeroSection({ onStartPlaying, isStarting }) {
  return (
    <section id="home" className="hero-section">
      {/* Editorial Title */}
      <div className="hero-editorial-header">
        <h1 className="hero-main-title">
          The Future of Music Is in Your Hands.
        </h1>

        {/* Generous whitespace and purposeful editorial paragraph */}
        <div className="hero-desc-block">
          <p className="hero-editorial-desc">
            This comprehensive computer vision instrument strips away the unnecessary, focusing on core principles of spatial relationship, kinetic hand tracking, and purposeful sound. Discover how your hands can shape expressive acoustic and synthesized music in the air.
          </p>

          <div className="hero-cta-row" style={{ marginTop: '36px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              className="landing-cta-btn"
              onClick={onStartPlaying}
              disabled={isStarting}
            >
              <Play size={14} fill="currentColor" />
              <span>{isStarting ? 'Connecting…' : 'Start Playing'}</span>
            </button>
            <a
              href="#instruments"
              style={{
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              Explore Instruments →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
