import React, { useState } from 'react';
import { AudioWaveform, Settings2, Play, Menu, X } from 'lucide-react';

export default function TopBar({ onStartPlaying, onOpenSettings, isStarting }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="landing-topbar">
      {/* Zone 1: Brand Wordmark */}
      <a href="#home" onClick={(e) => { e.preventDefault(); handleNavClick('home'); }} className="landing-brand">
        <div className="landing-brand-icon">
          <AudioWaveform size={20} />
        </div>
        <span className="landing-brand-name">
          Gesture<strong>Music</strong>
        </span>
      </a>

      {/* Zone 2: Navigation Links */}
      <nav className="landing-nav-links">
        <button type="button" onClick={() => handleNavClick('home')} className="nav-link">
          Home
        </button>
        <button type="button" onClick={() => handleNavClick('experience')} className="nav-link">
          Experience
        </button>
        <button type="button" onClick={() => handleNavClick('how-it-works')} className="nav-link">
          How It Works
        </button>
        <button type="button" onClick={() => handleNavClick('instruments')} className="nav-link">
          Instruments
        </button>
      </nav>

      {/* Zone 3: Settings & Primary Action */}
      <div className="landing-top-actions">
        <button
          type="button"
          className="landing-settings-btn"
          title="Studio Settings"
          aria-label="Studio Settings"
          onClick={onOpenSettings}
        >
          <Settings2 size={18} />
        </button>

        <button
          type="button"
          className="landing-cta-btn"
          onClick={onStartPlaying}
          disabled={isStarting}
        >
          <Play size={15} fill="currentColor" />
          <span>{isStarting ? 'Connecting…' : 'Start Playing'}</span>
        </button>

        <button
          type="button"
          className="landing-mobile-toggle"
          aria-label="Toggle navigation menu"
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="landing-mobile-menu">
          <button type="button" onClick={() => handleNavClick('home')} className="mobile-link">
            Home
          </button>
          <button type="button" onClick={() => handleNavClick('experience')} className="mobile-link">
            Experience
          </button>
          <button type="button" onClick={() => handleNavClick('how-it-works')} className="mobile-link">
            How It Works
          </button>
          <button type="button" onClick={() => handleNavClick('instruments')} className="mobile-link">
            Instruments
          </button>
          <div className="mobile-menu-divider" />
          <button
            type="button"
            className="mobile-cta-btn"
            onClick={() => {
              setMobileMenuOpen(false);
              onStartPlaying();
            }}
          >
            <Play size={15} fill="currentColor" />
            <span>Start Playing Now</span>
          </button>
        </div>
      )}
    </header>
  );
}
