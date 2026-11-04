import React from 'react';
import { X, CircleHelp, Sliders, Volume2, Music } from 'lucide-react';
import { INSTRUMENTS } from '../instrumentEngine';

export default function StudioSettingsDrawer({
  isOpen,
  onClose,
  sensitivity,
  setSensitivity,
  leftInstrument,
  setLeftInstrument,
  rightInstrument,
  setRightInstrument,
  velocitySensitivity,
  setVelocitySensitivity,
  velocitySmoothing,
  setVelocitySmoothing,
  chordWindow,
  setChordWindow,
  volume,
  setVolume
}) {
  if (!isOpen) return null;

  return (
    <div className="settings-backdrop" onClick={onClose}>
      <aside className="settings-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <span className="section-kicker">STUDIO PREFERENCES</span>
            <h2>Audio & Vision Engine</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        {/* Master Volume */}
        <div className="setting-group">
          <label className="setting-label">
            <span>MASTER GAIN</span>
            <strong>{volume}%</strong>
          </label>
          <input
            className="wide-range"
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(+e.target.value)}
          />
        </div>

        {/* Hand Tracking Sensitivity */}
        <div className="setting-group">
          <label className="setting-label">
            <span>HAND DETECTION CONFIDENCE</span>
            <strong>{sensitivity}%</strong>
          </label>
          <input
            className="wide-range"
            type="range"
            min="40"
            max="95"
            value={sensitivity}
            onChange={(e) => setSensitivity(+e.target.value)}
          />
          <p className="setting-help">
            Higher values require cleaner camera lighting and prevent spurious fingertip detections.
          </p>
        </div>

        {/* Dual Instrument Selection */}
        <div className="setting-group">
          <label className="setting-label">
            <span>LEFT-HAND INSTRUMENT</span>
          </label>
          <select
            value={leftInstrument}
            onChange={(e) => setLeftInstrument(e.target.value)}
            className="drawer-select"
          >
            {INSTRUMENTS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} ({item.family})
              </option>
            ))}
          </select>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>RIGHT-HAND INSTRUMENT</span>
          </label>
          <select
            value={rightInstrument}
            onChange={(e) => setRightInstrument(e.target.value)}
            className="drawer-select"
          >
            {INSTRUMENTS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} ({item.family})
              </option>
            ))}
          </select>
        </div>

        {/* Velocity Parameters */}
        <div className="setting-group">
          <label className="setting-label">
            <span>VELOCITY KINETIC MULTIPLIER</span>
            <strong>{velocitySensitivity.toFixed(1)}×</strong>
          </label>
          <input
            className="wide-range"
            type="range"
            min="0.4"
            max="2.5"
            step="0.1"
            value={velocitySensitivity}
            onChange={(e) => setVelocitySensitivity(+e.target.value)}
          />
          <p className="setting-help">
            Scales the estimated striking speed of your fingers into standard MIDI 1-127 dynamics.
          </p>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>VELOCITY SMOOTHING FILTER</span>
            <strong>{Math.round(velocitySmoothing * 100)}%</strong>
          </label>
          <input
            className="wide-range"
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={velocitySmoothing}
            onChange={(e) => setVelocitySmoothing(+e.target.value)}
          />
        </div>

        {/* Chord Grouping Window */}
        <div className="setting-group">
          <label className="setting-label">
            <span>CHORD RECOGNITION WINDOW</span>
            <strong>{chordWindow} MS</strong>
          </label>
          <input
            className="wide-range"
            type="range"
            min="60"
            max="350"
            step="10"
            value={chordWindow}
            onChange={(e) => setChordWindow(+e.target.value)}
          />
          <p className="setting-help">
            Interval to aggregate simultaneous finger presses before reporting triad and seventh chord names.
          </p>
        </div>

        <div className="drawer-note">
          <CircleHelp size={18} />
          <span>Camera stream is processed 100% locally on your device GPU via WebAssembly. No video frames leave your browser.</span>
        </div>
      </aside>
    </div>
  );
}
