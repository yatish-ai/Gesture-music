import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { VelocityEngine } from './velocityEngine';
import { recognizeChord } from './chordRecognition';
import { INSTRUMENTS, loadInstrument, getInstrumentForHand } from './instrumentEngine';

import TopBar from './components/TopBar';
import HeroSection from './components/HeroSection';
import ExperienceSection from './components/ExperienceSection';
import HowItWorksSection from './components/HowItWorksSection';
import InstrumentShowcase from './components/InstrumentShowcase';
import StudioSettingsDrawer from './components/StudioSettingsDrawer';
import StudioFooter from './components/StudioFooter';
import ActivePerformanceInterface from './components/ActivePerformanceInterface';

const NOTES = [
  { id: 'left-thumb', label: 'LEFT THUMB', detail: 'Left hand · Thumb', finger: 'THUMB', hand: 'LEFT', note: 'C4', midi: 60, color: '#a78bfa' },
  { id: 'left-index', label: 'LEFT INDEX', detail: 'Left hand · Index', finger: 'INDEX', hand: 'LEFT', note: 'D4', midi: 62, color: '#60a5fa' },
  { id: 'left-middle', label: 'LEFT MIDDLE', detail: 'Left hand · Middle', finger: 'MIDDLE', hand: 'LEFT', note: 'E4', midi: 64, color: '#34d399' },
  { id: 'left-ring', label: 'LEFT RING', detail: 'Left hand · Ring', finger: 'RING', hand: 'LEFT', note: 'F4', midi: 65, color: '#fbbf24' },
  { id: 'left-pinky', label: 'LEFT PINKY', detail: 'Left hand · Pinky', finger: 'PINKY', hand: 'LEFT', note: 'G4', midi: 67, color: '#fb7185' },
  { id: 'right-thumb', label: 'RIGHT THUMB', detail: 'Right hand · Thumb', finger: 'THUMB', hand: 'RIGHT', note: 'A4', midi: 69, color: '#c084fc' },
  { id: 'right-index', label: 'RIGHT INDEX', detail: 'Right hand · Index', finger: 'INDEX', hand: 'RIGHT', note: 'B4', midi: 71, color: '#38bdf8' },
  { id: 'right-middle', label: 'RIGHT MIDDLE', detail: 'Right hand · Middle', finger: 'MIDDLE', hand: 'RIGHT', note: 'C5', midi: 72, color: '#2dd4bf' },
  { id: 'right-ring', label: 'RIGHT RING', detail: 'Right hand · Ring', finger: 'RING', hand: 'RIGHT', note: 'D5', midi: 74, color: '#f59e0b' },
  { id: 'right-pinky', label: 'RIGHT PINKY', detail: 'Right hand · Pinky', finger: 'PINKY', hand: 'RIGHT', note: 'E5', midi: 76, color: '#f472b6' },
];
const FINGER_KEYS = ['thumb', 'index', 'middle', 'ring', 'pinky'];
const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

function detectExtendedFingers(lm) {
  if (!lm || lm.length < 21) return [false, false, false, false, false];
  const dist = (a, b) => Math.hypot(lm[a].x - lm[b].x, lm[a].y - lm[b].y);
  const angle = (a, b, c) => {
    const v1 = [lm[a].x - lm[b].x, lm[a].y - lm[b].y];
    const v2 = [lm[c].x - lm[b].x, lm[c].y - lm[b].y];
    const dot = v1[0] * v2[0] + v1[1] * v2[1];
    const den = Math.hypot(...v1) * Math.hypot(...v2) || 1;
    return (Math.acos(Math.max(-1, Math.min(1, dot / den))) * 180) / Math.PI;
  };
  const thumb = angle(2, 3, 4) > 125 && dist(4, 0) > dist(3, 0) * 1.08;
  const specs = [[5, 6, 8], [9, 10, 12], [13, 14, 16], [17, 18, 20]];
  const others = specs.map(([mcp, pip, tip]) => angle(mcp, pip, tip) > 145 && dist(tip, 0) > dist(pip, 0) * 1.035);
  return [thumb, ...others];
}

function drawLandmarks(canvas, landmarks) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!landmarks?.length) return;
  landmarks.forEach((hand) => {
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 107, 43, 0.85)';
    CONNECTIONS.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(hand[a].x * canvas.width, hand[a].y * canvas.height);
      ctx.lineTo(hand[b].x * canvas.width, hand[b].y * canvas.height);
      ctx.stroke();
    });
    hand.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, [4, 8, 12, 16, 20].includes(i) ? 6 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = [4, 8, 12, 16, 20].includes(i) ? '#ffa439' : '#fff3e3';
      ctx.fill();
    });
  });
}

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const audioRef = useRef(null);
  const velocityRef = useRef(new VelocityEngine());
  const chordTimerRef = useRef(null);
  const chordSignatureRef = useRef('');
  const activeRef = useRef({});
  const wantedRef = useRef(new Set());
  const pendingRef = useRef(new Set());
  const lastGestureRef = useRef('');

  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gesture, setGesture] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  const [activeFingerNotes, setActiveFingerNotes] = useState([]);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [volume, setVolume] = useState(75);
  const [leftInstrument, setLeftInstrument] = useState('acoustic_grand_piano');
  const [rightInstrument, setRightInstrument] = useState('lead_2_sawtooth');
  const [sensitivity, setSensitivity] = useState(65);
  const [notesPlayed, setNotesPlayed] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [mapping, setMapping] = useState(NOTES);
  const [velocity, setVelocity] = useState(64);
  const [velocitySensitivity, setVelocitySensitivity] = useState(1);
  const [velocitySmoothing, setVelocitySmoothing] = useState(0.35);
  const [chord, setChord] = useState(null);
  const [chordWindow, setChordWindow] = useState(130);

  const fpsRef = useRef({ last: performance.now(), frames: 0 });

  const initAudio = useCallback(async (instrumentId = rightInstrument) => {
    if (!audioRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      await ctx.resume();
      const gain = ctx.createGain();
      gain.gain.value = volume / 100;
      gain.connect(ctx.destination);
      audioRef.current = { ctx, gain, players: new Map() };
    }
    const audio = audioRef.current;
    if (audio.ctx.state === 'suspended') await audio.ctx.resume();
    const player = await loadInstrument(audio.ctx, audio.gain, instrumentId, audio.players);
    setAudioReady(true);
    return { ...audio, player };
  }, [rightInstrument, volume]);

  const stopNote = useCallback(() => {
    Object.values(activeRef.current || {}).forEach((node) => {
      try { node.stop(); } catch {}
    });
    activeRef.current = {};
    pendingRef.current.clear();
    setActiveNote(null);
    setActiveFingerNotes([]);
  }, []);

  const playNote = useCallback(async (entry, fingerKey, noteVelocity = 64) => {
    if (activeRef.current[fingerKey] || pendingRef.current.has(fingerKey)) return;
    pendingRef.current.add(fingerKey);
    try {
      const instrumentId = getInstrumentForHand(entry.hand, leftInstrument, rightInstrument);
      const audio = await initAudio(instrumentId);
      if (!wantedRef.current.has(fingerKey)) return;
      const normalizedVelocity = Math.max(0.08, Math.min(1, noteVelocity / 127));
      const node = audio.player.play(entry.note, audio.ctx.currentTime, {
        gain: 0.9 * Math.pow(normalizedVelocity, 1.55),
        duration: 30
      });
      activeRef.current[fingerKey] = node;
      setActiveNote(entry);
      setNotesPlayed((n) => n + 1);
    } catch (e) {
      setError('Audio could not start. Check your connection and try again.');
    } finally {
      pendingRef.current.delete(fingerKey);
    }
  }, [initAudio, leftInstrument, rightInstrument]);

  const handlePreviewInstrument = useCallback(async (instrumentId) => {
    try {
      const audio = await initAudio(instrumentId);
      audio.player.play('C4', audio.ctx.currentTime, { gain: 0.8, duration: 1.5 });
    } catch (err) {
      console.warn('Audio audition error:', err);
    }
  }, [initAudio]);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const detector = landmarkerRef.current;
    if (!video || !canvas || !detector || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }
    const start = performance.now();
    const result = detector.detectForVideo(video, start);
    const hands = result.landmarks || [];
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    drawLandmarks(canvas, hands);

    const wanted = new Map();
    hands.forEach((lm) => {
      const states = detectExtendedFingers(lm);
      const screenX = 1 - lm[0].x;
      const handSide = screenX < 0.5 ? 'LEFT' : 'RIGHT';
      const palmScale = Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y);
      states.forEach((isExtended, fingerIndex) => {
        const finger = FINGER_KEYS[fingerIndex];
        const entry = mapping.find((n) => n.id === `${handSide.toLowerCase()}-${finger}`);
        if (!entry) return;
        const tip = lm[[4, 8, 12, 16, 20][fingerIndex]];
        const estimated = velocityRef.current.update(entry.id, tip, start, palmScale);
        if (isExtended) wanted.set(entry.id, { ...entry, velocity: estimated });
      });
    });

    wantedRef.current = new Set(wanted.keys());
    Object.entries(activeRef.current).forEach(([key, node]) => {
      if (!wanted.has(key)) {
        try { node.stop(); } catch {}
        delete activeRef.current[key];
        pendingRef.current.delete(key);
      }
    });

    wanted.forEach((entry, key) => {
      if (!activeRef.current[key]) {
        setVelocity(entry.velocity || 64);
        playNote(entry, key, entry.velocity || 64);
      }
    });

    const activeEntries = [...wanted.values()];
    setActiveFingerNotes(activeEntries);
    setActiveNote(activeEntries[activeEntries.length - 1] || null);

    const signature = activeEntries.map((n) => n.midi).sort((a, b) => a - b).join(',');
    if (signature !== chordSignatureRef.current) {
      chordSignatureRef.current = signature;
      if (chordTimerRef.current) clearTimeout(chordTimerRef.current);
      if (!signature) setChord(null);
      else {
        chordTimerRef.current = setTimeout(
          () => setChord(recognizeChord(activeEntries.map((n) => n.midi))),
          chordWindow
        );
      }
    }

    const fingerCount = activeEntries.length;
    setGesture(
      hands.length
        ? {
            id: fingerCount ? 'fingers' : 'hand',
            count: fingerCount,
            hands: hands.length,
            confidence: null,
            label: fingerCount ? `${fingerCount} FINGER${fingerCount === 1 ? '' : 'S'} ACTIVE` : 'HAND DETECTED'
          }
        : null
    );

    setLatency(Math.round(performance.now() - start));
    fpsRef.current.frames++;
    const now = performance.now();
    if (now - fpsRef.current.last >= 1000) {
      setFps(Math.round((fpsRef.current.frames * 1000) / (now - fpsRef.current.last)));
      fpsRef.current = { last: now, frames: 0 };
    }
    rafRef.current = requestAnimationFrame(processFrame);
  }, [mapping, playNote, chordWindow]);

  const startCamera = async () => {
    setError('');
    setLoading(true);
    try {
      await initAudio();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.55,
        minHandPresenceConfidence: 0.55,
        minTrackingConfidence: 0.5
      });
      setCameraOn(true);
      rafRef.current = requestAnimationFrame(processFrame);
    } catch (e) {
      setError(e?.message || 'Could not access webcam. Check browser permissions and try again.');
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (landmarkerRef.current) {
      landmarkerRef.current.close();
      landmarkerRef.current = null;
    }
    if (canvasRef.current) {
      canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setCameraOn(false);
    setGesture(null);
    wantedRef.current.clear();
    lastGestureRef.current = '';
    stopNote();
    velocityRef.current.reset();
    if (chordTimerRef.current) clearTimeout(chordTimerRef.current);
    setChord(null);
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      stopNote();
      if (audioRef.current) audioRef.current.ctx.close();
    };
  }, [stopNote]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.gain.gain.setTargetAtTime(volume / 100, audioRef.current.ctx.currentTime, 0.04);
    }
  }, [volume]);

  useEffect(() => {
    velocityRef.current.configure({ sensitivity: velocitySensitivity, smoothing: velocitySmoothing });
  }, [velocitySensitivity, velocitySmoothing]);

  useEffect(() => {
    if (cameraOn) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(processFrame);
    }
  }, [processFrame, cameraOn]);

  return (
    <div className={`app-shell ${cameraOn ? 'full-screen-mode' : 'landing-mode'}`}>
      {/* ERROR BANNER */}
      {error && (
        <div className="landing-error-banner">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {/* VIEW A: LANDING DASHBOARD (When not in session) */}
      {!cameraOn && (
        <div className="landing-dashboard-flow">
          <TopBar
            onStartPlaying={startCamera}
            onOpenSettings={() => setSettingsOpen(true)}
            isStarting={loading}
          />

          <main className="landing-main-content">
            <HeroSection
              onStartPlaying={startCamera}
              isStarting={loading}
            />

            <ExperienceSection />

            <HowItWorksSection />

            <InstrumentShowcase
              leftInstrument={leftInstrument}
              setLeftInstrument={setLeftInstrument}
              rightInstrument={rightInstrument}
              setRightInstrument={setRightInstrument}
              onPreviewInstrument={handlePreviewInstrument}
            />
          </main>

          <StudioFooter onStartPlaying={startCamera} />
        </div>
      )}

      {/* VIEW B: RETRO-FUTURISTIC HARDWARE PERFORMANCE WORKSTATION */}
      <div
        className="performance-hardware-wrapper"
        style={{ display: cameraOn ? 'block' : 'none' }}
      >
        <ActivePerformanceInterface
          videoRef={videoRef}
          canvasRef={canvasRef}
          stopCamera={stopCamera}
          setSettingsOpen={setSettingsOpen}
          activeNote={activeNote}
          activeFingerNotes={activeFingerNotes}
          chord={chord}
          velocity={velocity}
          leftInstrument={leftInstrument}
          setLeftInstrument={setLeftInstrument}
          rightInstrument={rightInstrument}
          setRightInstrument={setRightInstrument}
          volume={volume}
          setVolume={setVolume}
          fps={fps}
          latency={latency}
          notesPlayed={notesPlayed}
          gesture={gesture}
          mapping={mapping}
        />
      </div>

      {/* STUDIO SETTINGS DRAWER (Accessible in both modes) */}
      <StudioSettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        sensitivity={sensitivity}
        setSensitivity={setSensitivity}
        leftInstrument={leftInstrument}
        setLeftInstrument={setLeftInstrument}
        rightInstrument={rightInstrument}
        setRightInstrument={setRightInstrument}
        velocitySensitivity={velocitySensitivity}
        setVelocitySensitivity={setVelocitySensitivity}
        velocitySmoothing={velocitySmoothing}
        setVelocitySmoothing={setVelocitySmoothing}
        chordWindow={chordWindow}
        setChordWindow={setChordWindow}
        volume={volume}
        setVolume={setVolume}
      />
    </div>
  );
}
