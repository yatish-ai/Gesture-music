import React from 'react';

export default function StudioFooter({ onStartPlaying }) {
  return (
    <footer className="studio-footer">
      <div className="footer-container">
        {/* Brand */}
        <div className="footer-brand">
          <span>Gesture<strong>Music</strong></span>
        </div>

        {/* Center links row matching reference screenshot */}
        <div className="footer-links-row">
          <a href="#home">Home</a>
          <a href="#experience">Experience</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#instruments">Instruments</a>
          <button type="button" onClick={onStartPlaying} className="footer-action-link">
            Launch Studio
          </button>
        </div>

        {/* Right copyright notice */}
        <div className="copyright-text">
          <span>© {new Date().getFullYear()} Gesture Music Platform. Built with intention.</span>
        </div>
      </div>
    </footer>
  );
}
