import React, { useEffect, useState, useMemo } from 'react';
import { Settings2, Volume2, Power, Eye, EyeOff, Radio, Activity, Music, Sparkles } from 'lucide-react';
import { INSTRUMENTS } from '../instrumentEngine';

export default function ActivePerformanceInterface({
  videoRef,
  canvasRef,
  stopCamera,
  setSettingsOpen,
  activeNote,
  activeFingerNotes = [],
  chord,
  velocity = 64,
  leftInstrument,
  setLeftInstrument,
  rightInstrument,
  setRightInstrument,
  volume,
  setVolume,
  fps,
  latency,
  notesPlayed,
  gesture,
  mapping
}) {
  // Session stopwatch
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // HUD visibility toggle (can be toggled by button or pressing 'H')
  const [hudVisible, setHudVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut: Press 'H' to toggle HUD visibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'h' || e.key === 'H') {
        setHudVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatTimer = (totalSeconds) => {
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  // Determine hand presence & activity
  const isLeftHandActive = activeFingerNotes.some((n) => n.hand === 'LEFT');
  const isRightHandActive = activeFingerNotes.some((n) => n.hand === 'RIGHT');
  const hasHandsInView = (gesture?.hands || 0) > 0 || activeFingerNotes.length > 0;

  // Split mapping by hand
  const leftHandKeys = useMemo(
    () => mapping.filter((n) => n.hand === 'LEFT'),
    [mapping]
  );
  const rightHandKeys = useMemo(
    () => mapping.filter((n) => n.hand === 'RIGHT'),
    [mapping]
  );

  const leftInstObj = INSTRUMENTS.find((i) => i.id === leftInstrument) || INSTRUMENTS[0];
  const rightInstObj = INSTRUMENTS.find((i) => i.id === rightInstrument) || INSTRUMENTS[5];

  // Radar scope animation
  const radarAngle = (elapsedSeconds * 45) % 360;

  return (
    <div className="ar-performance-root">
      {/* =========================================================
          1. FULL-SCREEN LIVE WEBCAM FEED (Mirrored 100vw x 100vh)
          ========================================================= */}
      <div className="ar-fullscreen-camera">
        <video
          ref={videoRef}
          className="ar-fullscreen-video"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="ar-fullscreen-canvas"
        />
        {/* Subtle cinematic edge vignette - keeps hands crisp while easing HUD text contrast */}
        <div className="ar-fullscreen-vignette" />
      </div>

      {/* Floating gesture status prompt in lower center when no hands or ready */}
      <div className="ar-gesture-floating-prompt">
        <div className="prompt-capsule">
          <span className={`status-blip ${hasHandsInView ? 'active' : 'searching'}`} />
          <span className="prompt-text">
            {gesture?.label || (hasHandsInView ? 'HANDS TRACKED · EXTEND FINGERS TO PLAY' : 'POSITION HANDS IN CAMERA VIEW')}
          </span>
        </div>
      </div>

      {/* =========================================================
          2. FLOATING TOP BAR (Translucent glass toolbar)
          ========================================================= */}
      <header className={`hud-floating-bar hud-top-bar ${!hudVisible ? 'hud-hidden' : ''}`}>
        <div className="hud-top-left">
          {/* Logo Brand Plate */}
          <div className="hud-logo-plate">
            <span className="hud-plate-screw tl" />
            <span className="hud-plate-screw tr" />
            <span className="hud-plate-screw bl" />
            <span className="hud-plate-screw br" />
            <div className="hud-logo-mark">
              <span className="pixel-icon">☺</span>
            </div>
            <div className="hud-logo-title-group">
              <span className="hud-brand-title">GESTURE MUSIC</span>
              <span className="hud-brand-sub">AR MULTI-VOICE HUD</span>
            </div>
          </div>

          {/* Session Live Pill */}
          <div className="hud-live-pill">
            <span className="hud-live-pulse-dot" />
            <span className="hud-live-text">SESSION LIVE</span>
          </div>
        </div>

        {/* Center Status Telemetry */}
        <div className="hud-top-center">
          <div className="hud-status-cluster">
            <div className="status-metric">
              <span className="metric-tag">CAM</span>
              <strong className="metric-val">{fps || 60} FPS</strong>
            </div>
            <span className="metric-sep">/</span>
            <div className="status-metric">
              <span className="metric-tag">LAT</span>
              <strong className="metric-val">{latency || 12} MS</strong>
            </div>
            <span className="metric-sep">/</span>
            <div className="status-metric">
              <span className="metric-tag">HANDS</span>
              <strong className="metric-val">{gesture?.hands || (hasHandsInView ? 2 : 0)}</strong>
            </div>
            <span className="metric-sep">/</span>
            <div className="status-metric">
              <span className="metric-tag">AUDIO</span>
              <strong className="metric-val audio-lit">44.1 kHz</strong>
            </div>
            <span className="metric-sep">/</span>
            <div className="status-metric timer-highlight">
              <span className="metric-tag">TIME</span>
              <strong className="metric-val">{formatTimer(elapsedSeconds)}</strong>
            </div>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="hud-top-right">
          {/* Toggle HUD visibility */}
          <button
            type="button"
            className="hud-action-btn hud-visibility-btn"
            onClick={() => setHudVisible(false)}
            title="Hide HUD overlays for full camera view (Press H)"
          >
            <EyeOff size={14} />
            <span>HIDE HUD (H)</span>
          </button>

          {/* Settings */}
          <button
            type="button"
            className="hud-action-btn"
            onClick={() => setSettingsOpen(true)}
            title="Configure gesture sensitivity and audio latency"
          >
            <Settings2 size={14} />
            <span>SETTINGS</span>
          </button>

          {/* End Session */}
          <button
            type="button"
            className="hud-action-btn hud-end-session-btn"
            onClick={stopCamera}
            title="Exit performance and return to dashboard"
          >
            <Power size={13} />
            <span>END SESSION</span>
          </button>
        </div>
      </header>

      {/* =========================================================
          3. FLOATING CENTER MUSIC DISPLAY (Vintage Ivory LCD Panel)
          ========================================================= */}
      <div className={`hud-floating-panel hud-center-lcd ${!hudVisible ? 'hud-hidden' : ''}`}>
        <div className="vintage-lcd-container">
          {/* Hardware frame screws */}
          <span className="lcd-screw tl" />
          <span className="lcd-screw tr" />
          <span className="lcd-screw bl" />
          <span className="lcd-screw br" />

          <div className="lcd-bezel-screen">
            {/* Top LCD Status Row */}
            <div className="lcd-header-row">
              {/* Radar Scope */}
              <div className="lcd-radar-widget">
                <svg viewBox="0 0 36 36" className="lcd-radar-svg">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#7e7264" strokeWidth="1.2" strokeDasharray="2 2" />
                  <circle cx="18" cy="18" r="10" fill="none" stroke="#7e7264" strokeWidth="0.8" strokeDasharray="1 1" />
                  <line x1="18" y1="2" x2="18" y2="34" stroke="#998d7f" strokeWidth="0.8" strokeDasharray="1 2" />
                  <line x1="2" y1="18" x2="34" y2="18" stroke="#998d7f" strokeWidth="0.8" strokeDasharray="1 2" />
                  <line
                    x1="18"
                    y1="18"
                    x2={18 + 14 * Math.cos((radarAngle * Math.PI) / 180)}
                    y2={18 + 14 * Math.sin((radarAngle * Math.PI) / 180)}
                    stroke="#1f1a16"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {activeFingerNotes.map((n, i) => (
                    <circle
                      key={i}
                      cx={18 + (n.hand === 'LEFT' ? -7 : 7)}
                      cy={18 + (i % 2 === 0 ? -5 : 5)}
                      r="2"
                      fill="#1f1a16"
                    />
                  ))}
                </svg>
                <span className="lcd-radar-label">RADAR</span>
              </div>

              {/* Hand Detection Badges */}
              <div className="lcd-hands-presence">
                <span className={`lcd-hand-tag ${isLeftHandActive ? 'detected' : ''}`}>
                  L-HAND: {isLeftHandActive ? 'ACTIVE' : 'IDLE'}
                </span>
                <span className={`lcd-hand-tag ${isRightHandActive ? 'detected' : ''}`}>
                  R-HAND: {isRightHandActive ? 'ACTIVE' : 'IDLE'}
                </span>
              </div>

              {/* Velocity & Polyphony Badges */}
              <div className="lcd-voice-meta">
                <span className="lcd-voice-tag">VEL: {velocity}</span>
                <span className="lcd-voice-tag">VOICES: {activeFingerNotes.length}/10</span>
              </div>

              {/* Stopwatch & Battery */}
              <div className="lcd-timer-display">
                <span className="lcd-stopwatch-digits">{formatTimer(elapsedSeconds)}</span>
                <div className="lcd-battery-pill">
                  <span className="bat-cell on" />
                  <span className="bat-cell on" />
                  <span className="bat-cell on" />
                </div>
              </div>
            </div>

            {/* LCD Center Data: Active Note, Chord, Instrument */}
            <div className="lcd-body-grid">
              {/* Note / Pitch */}
              <div className="lcd-data-cell note-cell">
                <span className="lcd-cell-kicker">NOTE / PITCH</span>
                <strong className="lcd-giant-note">{activeNote?.note || '--'}</strong>
                <span className="lcd-cell-sub">
                  {activeNote ? `${(440 * Math.pow(2, (activeNote.midi - 69) / 12)).toFixed(1)} HZ` : 'STANDBY'}
                </span>
              </div>

              {/* Chord Recognition */}
              <div className="lcd-data-cell chord-cell">
                <span className="lcd-cell-kicker">CHORD RECOGNITION</span>
                <strong className="lcd-giant-chord">
                  {chord ? chord.name : activeFingerNotes.length > 1 ? 'HARMONIC CLUSTER' : 'SINGLE TONE'}
                </strong>
                <span className="lcd-cell-sub">
                  {chord
                    ? `${chord.notes.join(' · ')} (${chord.inversion})`
                    : activeFingerNotes.length
                    ? `${activeFingerNotes.length} ACTIVE VOICES DETECTED`
                    : 'AWAITING GESTURE'}
                </span>
              </div>

              {/* Active Instruments Info */}
              <div className="lcd-data-cell routing-cell">
                <span className="lcd-cell-kicker">ROUTED ENGINES</span>
                <div className="lcd-routing-row">
                  <span className="lcd-route-chip">L: {leftInstObj.label}</span>
                  <span className="lcd-route-chip">R: {rightInstObj.label}</span>
                </div>
                <span className="lcd-cell-sub">TOTAL NOTES: {notesPlayed}</span>
              </div>
            </div>

            {/* LCD Waveform Spectrum */}
            <div className="lcd-waveform-strip">
              <div className="lcd-wave-kicker">
                <span>P-01 REAL-TIME HARMONIC WAVEFORM</span>
                <span>DSP 120 BPM</span>
              </div>
              <div className={`lcd-pixel-sine-wave ${activeNote ? 'active-oscillation' : ''}`}>
                {Array.from({ length: 42 }, (_, i) => {
                  const waveHeight = Math.sin((i / 42) * Math.PI * 4 + (activeNote ? elapsedSeconds * 8 : 0));
                  const normH = Math.max(3, Math.round(14 + waveHeight * 10));
                  return (
                    <span
                      key={i}
                      className="lcd-sine-bar"
                      style={{
                        height: `${normH}px`,
                        opacity: activeNote ? 0.95 : 0.4
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          4. FLOATING LEFT HAND PANEL (CH-A · C4 - G4)
          ========================================================= */}
      <aside className={`hud-floating-panel hud-hand-panel hud-left-hand ${!hudVisible ? 'hud-hidden' : ''}`}>
        <div className="hud-hand-card">
          <div className="hud-hand-header">
            <div className="hud-channel-badge">CH-A</div>
            <div className="hud-hand-name-group">
              <h3 className="hud-hand-title">LEFT HAND</h3>
              <span className="hud-hand-engine-name">{leftInstObj.label}</span>
            </div>
            <div className={`hud-hand-badge ${isLeftHandActive ? 'is-active' : 'is-tracking'}`}>
              <span className="badge-led" />
              <span>{isLeftHandActive ? 'ACTIVE' : 'TRACKING'}</span>
            </div>
          </div>

          <div className="hud-hand-divider" />

          {/* 5 Finger Pitch Indicators (Thumb, Index, Middle, Ring, Pinky -> C4 - G4) */}
          <div className="hud-finger-stack">
            <span className="hud-stack-label">FINGER PITCH MATRIX</span>
            <div className="hud-finger-rows">
              {leftHandKeys.map((item) => {
                const isActive = activeFingerNotes.some((a) => a.id === item.id);
                return (
                  <div
                    key={item.id}
                    className={`hud-finger-row ${isActive ? 'row-active' : 'row-idle'}`}
                  >
                    <div className="finger-label-wrap">
                      <span className="finger-tag">{item.finger}</span>
                      <span className="finger-led" />
                    </div>
                    <div className="finger-pitch-badge">
                      <strong className="pitch-note">{item.note}</strong>
                      <span className="pitch-midi">{item.midi}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================
          5. FLOATING RIGHT HAND PANEL (CH-B · A4 - E5)
          ========================================================= */}
      <aside className={`hud-floating-panel hud-hand-panel hud-right-hand ${!hudVisible ? 'hud-hidden' : ''}`}>
        <div className="hud-hand-card">
          <div className="hud-hand-header">
            <div className="hud-channel-badge orange">CH-B</div>
            <div className="hud-hand-name-group">
              <h3 className="hud-hand-title">RIGHT HAND</h3>
              <span className="hud-hand-engine-name">{rightInstObj.label}</span>
            </div>
            <div className={`hud-hand-badge ${isRightHandActive ? 'is-active' : 'is-tracking'}`}>
              <span className="badge-led" />
              <span>{isRightHandActive ? 'ACTIVE' : 'TRACKING'}</span>
            </div>
          </div>

          <div className="hud-hand-divider" />

          {/* 5 Finger Pitch Indicators (Thumb, Index, Middle, Ring, Pinky -> A4 - E5) */}
          <div className="hud-finger-stack">
            <span className="hud-stack-label">FINGER PITCH MATRIX</span>
            <div className="hud-finger-rows">
              {rightHandKeys.map((item) => {
                const isActive = activeFingerNotes.some((a) => a.id === item.id);
                return (
                  <div
                    key={item.id}
                    className={`hud-finger-row ${isActive ? 'row-active' : 'row-idle'}`}
                  >
                    <div className="finger-label-wrap">
                      <span className="finger-tag">{item.finger}</span>
                      <span className="finger-led" />
                    </div>
                    <div className="finger-pitch-badge">
                      <strong className="pitch-note">{item.note}</strong>
                      <span className="pitch-midi">{item.midi}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================
          6. FLOATING BOTTOM CONTROL BAR (Dock with knobs & routing)
          ========================================================= */}
      <footer className={`hud-floating-bar hud-bottom-bar ${!hudVisible ? 'hud-hidden' : ''}`}>
        {/* Left: Master Gain & Velocity Dial */}
        <div className="hud-dock-cluster hud-dock-audio">
          {/* Master Volume */}
          <div className="hud-dial-unit">
            <div className="hud-dial-disc">
              <div
                className="dial-rotator"
                style={{ transform: `rotate(${-135 + (volume / 100) * 270}deg)` }}
              >
                <span className="dial-pip" />
              </div>
            </div>
            <div className="hud-dial-meta">
              <span className="dial-title">MASTER GAIN</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(+e.target.value)}
                className="hud-dial-range"
                aria-label="Master volume"
              />
              <span className="dial-value">{volume}%</span>
            </div>
          </div>

          {/* Velocity Kinetic Sense */}
          <div className="hud-dial-unit">
            <div className="hud-dial-disc">
              <div
                className="dial-rotator"
                style={{ transform: `rotate(${-135 + (velocity / 127) * 270}deg)` }}
              >
                <span className="dial-pip" />
              </div>
            </div>
            <div className="hud-dial-meta">
              <span className="dial-title">VELOCITY SENSE</span>
              <span className="dial-value-fixed">{velocity} / 127</span>
            </div>
          </div>
        </div>

        {/* Center: Tactile Instrument Bank Pads with L / R routing */}
        <div className="hud-dock-cluster hud-dock-instruments">
          <div className="inst-dock-label-row">
            <span className="inst-dock-title">INSTRUMENT SOUNDBANK ASSIGNMENT</span>
            <span className="inst-dock-sub">ASSIGN INDEPENDENT VOICES TO LEFT (L) & RIGHT (R) HAND</span>
          </div>

          <div className="hud-instruments-grid">
            {INSTRUMENTS.map((inst) => {
              const isL = leftInstrument === inst.id;
              const isR = rightInstrument === inst.id;
              return (
                <div
                  key={inst.id}
                  className={`hud-inst-pad ${(isL || isR) ? 'is-routed' : ''}`}
                >
                  <div className="hud-pad-leds">
                    <span className={`pad-led left ${isL ? 'on' : ''}`} title="Left Hand" />
                    <span className={`pad-led right ${isR ? 'on' : ''}`} title="Right Hand" />
                  </div>
                  <span className="hud-pad-name">{inst.label}</span>
                  <div className="hud-pad-route-toggles">
                    <button
                      type="button"
                      className={`hud-route-chip ${isL ? 'routed-active' : ''}`}
                      onClick={() => setLeftInstrument(inst.id)}
                      title={`Assign ${inst.label} to Left Hand`}
                    >
                      L
                    </button>
                    <button
                      type="button"
                      className={`hud-route-chip ${isR ? 'routed-active' : ''}`}
                      onClick={() => setRightInstrument(inst.id)}
                      title={`Assign ${inst.label} to Right Hand`}
                    >
                      R
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Energy Signal Ladder & Exit */}
        <div className="hud-dock-cluster hud-dock-exit">
          <div className="hud-energy-ladder">
            <span className="ladder-title">ENERGY SIGNAL</span>
            <div className="ladder-bars-row">
              {Array.from({ length: 12 }, (_, i) => {
                const threshold = (i / 12) * 100;
                const isLit = activeNote && volume >= threshold;
                return (
                  <span
                    key={i}
                    className={`ladder-notch ${isLit ? (i > 9 ? 'red' : 'orange') : 'off'}`}
                  />
                );
              })}
            </div>
          </div>

          <button
            type="button"
            className="hud-exit-btn"
            onClick={stopCamera}
          >
            <span>EXIT TO DASHBOARD</span>
          </button>
        </div>
      </footer>

      {/* =========================================================
          7. FLOATING HUD RESTORE BUTTON (When HUD is hidden)
          ========================================================= */}
      {!hudVisible && (
        <button
          type="button"
          className="hud-restore-floating-pill"
          onClick={() => setHudVisible(true)}
          title="Restore HUD overlays (Press H)"
        >
          <Eye size={14} />
          <span>SHOW HUD (H)</span>
        </button>
      )}
    </div>
  );
}
