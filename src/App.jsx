import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Hand, Camera, CameraOff, Music2, Volume2, Settings2, CircleHelp, Activity, AudioWaveform, Play, Square, SlidersHorizontal, Sparkles, Radio, CheckCircle2, AlertCircle } from 'lucide-react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { VelocityEngine } from './velocityEngine';
import { recognizeChord } from './chordRecognition';
import { INSTRUMENTS, loadInstrument, getInstrumentForHand } from './instrumentEngine';

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
const FINGER_KEYS = ['thumb','index','middle','ring','pinky'];
const LANDMARKS = [[0,1,2,3,4],[0,5,6,7,8],[5,9,10,11,12],[9,13,14,15,16],[13,17,18,19,20],[0,17]];
const CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];

function detectExtendedFingers(lm) {
  if (!lm || lm.length < 21) return [false,false,false,false,false];
  const dist = (a,b) => Math.hypot(lm[a].x-lm[b].x, lm[a].y-lm[b].y);
  const angle = (a,b,c) => {
    const v1 = [lm[a].x-lm[b].x, lm[a].y-lm[b].y];
    const v2 = [lm[c].x-lm[b].x, lm[c].y-lm[b].y];
    const dot = v1[0]*v2[0]+v1[1]*v2[1];
    const den = Math.hypot(...v1)*Math.hypot(...v2) || 1;
    return Math.acos(Math.max(-1,Math.min(1,dot/den))) * 180 / Math.PI;
  };
  // Thumb moves sideways: use joint straightness and wrist-relative distance.
  const thumb = angle(2,3,4) > 125 && dist(4,0) > dist(3,0)*1.08;
  // For the other fingers, combine a straight PIP joint with fingertip extension
  // relative to the wrist. This is more robust than relying on image Y alone.
  const specs = [[5,6,8],[9,10,12],[13,14,16],[17,18,20]];
  const others = specs.map(([mcp,pip,tip]) => angle(mcp,pip,tip) > 145 && dist(tip,0) > dist(pip,0)*1.035);
  return [thumb,...others];
}

function drawLandmarks(canvas, landmarks) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if (!landmarks?.length) return;
  landmarks.forEach(hand => {
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(167,139,250,.9)';
    CONNECTIONS.forEach(([a,b]) => {
      ctx.beginPath(); ctx.moveTo(hand[a].x*canvas.width, hand[a].y*canvas.height); ctx.lineTo(hand[b].x*canvas.width, hand[b].y*canvas.height); ctx.stroke();
    });
    hand.forEach((p,i) => {
      ctx.beginPath(); ctx.arc(p.x*canvas.width,p.y*canvas.height,[4,8,12,16,20].includes(i)?5:3,0,Math.PI*2);
      ctx.fillStyle = [4,8,12,16,20].includes(i) ? '#c4b5fd' : '#f5f3ff'; ctx.fill();
    });
  });
}

export default function App() {
  const videoRef = useRef(null), canvasRef = useRef(null), streamRef = useRef(null), landmarkerRef = useRef(null), rafRef = useRef(null), audioRef = useRef(null), velocityRef = useRef(new VelocityEngine()), chordTimerRef = useRef(null), chordSignatureRef = useRef(''), activeRef = useRef({}), wantedRef = useRef(new Set()), pendingRef = useRef(new Set()), lastGestureRef = useRef('');
  const [cameraOn,setCameraOn] = useState(false), [loading,setLoading] = useState(false), [error,setError] = useState('');
  const [gesture,setGesture] = useState(null), [activeNote,setActiveNote] = useState(null), [activeFingerNotes,setActiveFingerNotes] = useState([]), [fps,setFps] = useState(0), [latency,setLatency] = useState(0), [volume,setVolume] = useState(75), [leftInstrument,setLeftInstrument] = useState('acoustic_grand_piano'), [rightInstrument,setRightInstrument] = useState('acoustic_grand_piano'), [sensitivity,setSensitivity] = useState(65), [notesPlayed,setNotesPlayed] = useState(0), [settingsOpen,setSettingsOpen] = useState(false), [audioReady,setAudioReady] = useState(false), [mapping,setMapping] = useState(NOTES), [velocity,setVelocity] = useState(64), [velocitySensitivity,setVelocitySensitivity] = useState(1), [velocitySmoothing,setVelocitySmoothing] = useState(0.35), [chord,setChord] = useState(null), [chordWindow,setChordWindow] = useState(130);
  const fpsRef = useRef({last:performance.now(),frames:0});

  const initAudio = useCallback(async (instrumentId = rightInstrument) => {
    if (!audioRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext(); await ctx.resume();
      const gain = ctx.createGain(); gain.gain.value = volume/100; gain.connect(ctx.destination);
      audioRef.current = { ctx, gain, players: new Map() };
    }
    const audio = audioRef.current;
    if (audio.ctx.state === 'suspended') await audio.ctx.resume();
    const player = await loadInstrument(audio.ctx, audio.gain, instrumentId, audio.players);
    setAudioReady(true);
    return { ...audio, player };
  }, [rightInstrument, volume]);

  const stopNote = useCallback(() => {
    Object.values(activeRef.current || {}).forEach(node => { try { node.stop(); } catch {} });
    activeRef.current = {}; pendingRef.current.clear(); setActiveNote(null); setActiveFingerNotes([]);
  },[]);

  const playNote = useCallback(async (entry, fingerKey, noteVelocity = 64) => {
    if (activeRef.current[fingerKey] || pendingRef.current.has(fingerKey)) return;
    pendingRef.current.add(fingerKey);
    try {
      const instrumentId = getInstrumentForHand(entry.hand, leftInstrument, rightInstrument);
      const audio = await initAudio(instrumentId);
      if (!wantedRef.current.has(fingerKey)) return;
      const normalizedVelocity = Math.max(0.08, Math.min(1, noteVelocity / 127));
      const node = audio.player.play(entry.note, audio.ctx.currentTime, {
        gain: 0.9 * Math.pow(normalizedVelocity, 1.55), duration: 30
      });
      activeRef.current[fingerKey] = node;
      setActiveNote(entry);
      setNotesPlayed(n=>n+1);
    } catch (e) {
      setError('Audio could not start. Check your connection and try again.');
    } finally { pendingRef.current.delete(fingerKey); }
  }, [initAudio, leftInstrument, rightInstrument]);

  const processFrame = useCallback(() => {
    const video = videoRef.current, canvas = canvasRef.current, detector = landmarkerRef.current;
    if (!video || !canvas || !detector || video.readyState < 2) { rafRef.current=requestAnimationFrame(processFrame); return; }
    const start = performance.now();
    const result = detector.detectForVideo(video, start);
    const hands = result.landmarks || [];
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    drawLandmarks(canvas,hands);

    const wanted = new Map();
    hands.forEach((lm) => {
      const states = detectExtendedFingers(lm);
      const screenX = 1 - lm[0].x;
      const handSide = screenX < 0.5 ? 'LEFT' : 'RIGHT';
      const palmScale = Math.hypot(lm[0].x-lm[9].x, lm[0].y-lm[9].y);
      states.forEach((isExtended, fingerIndex) => {
        const finger = FINGER_KEYS[fingerIndex];
        const entry = mapping.find(n => n.id === `${handSide.toLowerCase()}-${finger}`);
        if (!entry) return;
        const tip = lm[[4,8,12,16,20][fingerIndex]];
        const estimated = velocityRef.current.update(entry.id, tip, start, palmScale);
        if (isExtended) wanted.set(entry.id, { ...entry, velocity: estimated });
      });
    });

    // Start notes only on a finger's rising edge; release notes when that finger folds.
    wantedRef.current = new Set(wanted.keys());
    Object.entries(activeRef.current).forEach(([key,node]) => {
      if (!wanted.has(key)) { try { node.stop(); } catch {} delete activeRef.current[key]; pendingRef.current.delete(key); }
    });
    wanted.forEach((entry,key) => { if (!activeRef.current[key]) { setVelocity(entry.velocity || 64); playNote(entry,key,entry.velocity || 64); } });
    const activeEntries = [...wanted.values()];
    setActiveFingerNotes(activeEntries);
    setActiveNote(activeEntries[activeEntries.length-1] || null);
    const signature = activeEntries.map(n=>n.midi).sort((a,b)=>a-b).join(',');
    if (signature !== chordSignatureRef.current) {
      chordSignatureRef.current = signature;
      if (chordTimerRef.current) clearTimeout(chordTimerRef.current);
      if (!signature) setChord(null);
      else chordTimerRef.current = setTimeout(() => setChord(recognizeChord(activeEntries.map(n=>n.midi))), chordWindow);
    }
    const fingerCount = activeEntries.length;
    setGesture(hands.length ? { id: fingerCount ? 'fingers' : 'hand', count: fingerCount, hands: hands.length, confidence: null, label: fingerCount ? `${fingerCount} FINGER${fingerCount===1?'':'S'} ACTIVE` : 'HAND DETECTED' } : null);

    setLatency(Math.round(performance.now()-start));
    fpsRef.current.frames++;
    const now=performance.now(); if(now-fpsRef.current.last>=1000){setFps(Math.round(fpsRef.current.frames*1000/(now-fpsRef.current.last)));fpsRef.current={last:now,frames:0};}
    rafRef.current=requestAnimationFrame(processFrame);
  },[mapping,playNote,chordWindow]);

  const startCamera = async () => {
    setError(''); setLoading(true);
    try {
      await initAudio();
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}},audio:false});
      streamRef.current=stream; videoRef.current.srcObject=stream; await videoRef.current.play();
      const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
      landmarkerRef.current = await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',delegate:'GPU'},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:0.55,minHandPresenceConfidence:0.55,minTrackingConfidence:0.5});
      setCameraOn(true); rafRef.current=requestAnimationFrame(processFrame);
    } catch(e) { setError(e?.message || 'Could not access webcam. Check browser permissions and try again.'); if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop()); }
    finally { setLoading(false); }
  };
  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current); if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop());
    streamRef.current=null; if(landmarkerRef.current){landmarkerRef.current.close();landmarkerRef.current=null;}
    if(canvasRef.current) canvasRef.current.getContext('2d').clearRect(0,0,canvasRef.current.width,canvasRef.current.height);
    setCameraOn(false); setGesture(null); wantedRef.current.clear(); lastGestureRef.current=''; stopNote(); velocityRef.current.reset(); if(chordTimerRef.current) clearTimeout(chordTimerRef.current); setChord(null);
  };
  useEffect(()=>()=>{cancelAnimationFrame(rafRef.current); if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop()); stopNote(); if(audioRef.current) audioRef.current.ctx.close();},[stopNote]);
  useEffect(()=>{if(audioRef.current){audioRef.current.gain.gain.setTargetAtTime(volume/100,audioRef.current.ctx.currentTime,.04);}},[volume]);
  useEffect(()=>{velocityRef.current.configure({sensitivity:velocitySensitivity,smoothing:velocitySmoothing});},[velocitySensitivity,velocitySmoothing]);
  useEffect(()=>{if(cameraOn){cancelAnimationFrame(rafRef.current);rafRef.current=requestAnimationFrame(processFrame);}},[processFrame,cameraOn]);

  const selected = gesture?.entry;
  return <div className={`app-shell ${cameraOn ? 'full-screen-mode' : ''}`}>
    <header className="topbar"><div className="brand"><div className="brand-icon"><AudioWaveform size={21}/></div><div><div className="brand-name">gesture<span>piano</span></div><div className="brand-sub">PLAY IN THE AIR</div></div></div>
      <div className="top-center"><span className={`status-dot ${cameraOn?'live':''}`}></span>{cameraOn?'CAMERA LIVE':'CAMERA OFFLINE'}<span className="top-divider"/><span className={`status-dot ${audioReady?'live':''}`}></span>{audioReady?'AUDIO READY':'AUDIO STANDBY'}</div>
      <div className="top-actions"><button className="icon-button" title="Settings" onClick={()=>setSettingsOpen(v=>!v)}><Settings2 size={18}/></button><button className={`session-button ${cameraOn?'stop':''}`} onClick={cameraOn?stopCamera:startCamera} disabled={loading}>{cameraOn?<><Square size={15} fill="currentColor"/> END SESSION</>:<><Play size={15} fill="currentColor"/> {loading?'INITIALIZING…':'START SESSION'}</>}</button></div>
    </header>
    <main className="main-content">
      <section className="welcome-row"><div><div className="eyebrow"><Sparkles size={13}/> REAL-TIME GESTURE INSTRUMENT</div><h1>Make music with <em>your hands.</em></h1><p>Raise a finger. Find a note. Let the music happen.</p></div><div className="session-pill"><span className="pulse-dot"/> LIVE INTERACTION <span className="pill-sep">/</span> COMPUTER VISION</div></section>
      {error && <div className="error-banner"><AlertCircle size={17}/>{error}<button onClick={()=>setError('')}>Dismiss</button></div>}
      <section className="workspace-grid">
        <div className="camera-card panel"><div className="panel-heading"><div><span className="section-kicker">01 / INPUT</span><h2>Hand tracking</h2></div><div className={`live-tag ${cameraOn?'active':''}`}><span/> {cameraOn?'TRACKING':'STANDBY'}</div></div>
          <div className={`camera-stage ${cameraOn?'is-live':''}`}><video ref={videoRef} className="camera-video" playsInline muted/><canvas ref={canvasRef} className="landmark-canvas"/>{!cameraOn&&<div className="camera-placeholder"><div className="camera-orbit"><Camera size={30}/><span className="orbit-dot one"/><span className="orbit-dot two"/><span className="orbit-dot three"/></div><h3>Your camera space</h3><p>Start a session to see your hand in motion.</p><button className="enable-camera" onClick={startCamera} disabled={loading}><Camera size={16}/>{loading?'CONNECTING…':'ENABLE CAMERA'}</button></div>}{cameraOn&&<div className="camera-overlay-label"><span className="rec-dot"/> LIVE FEED <span>·</span> MIRRORED</div>}</div>
          <div className="camera-footer"><div className="camera-foot-item"><span className="foot-label">DETECTION</span><strong>{cameraOn?(gesture?'HAND DETECTED':'SEARCHING…'):'NOT ACTIVE'}</strong></div><div className="camera-foot-item"><span className="foot-label">FRAME RATE</span><strong>{cameraOn?`${fps} FPS`:'—'}</strong></div><div className="camera-foot-item"><span className="foot-label">LATENCY</span><strong>{cameraOn?`${latency} MS`:'—'}</strong></div></div>
        </div>
        <div className="right-column">
          <div className="now-card panel"><div className="panel-heading"><div><span className="section-kicker">02 / OUTPUT</span><h2>Now playing</h2></div><div className="sound-icon"><Music2 size={17}/></div></div><div className="note-display"><div className="note-glow"/><div className="note-overline">CURRENT NOTE</div><div className="note-name">{activeNote?.note || '—'}<span>{activeNote?'♪':''}</span></div><div className="note-frequency">{activeNote?`${(440*Math.pow(2,(activeNote.midi-69)/12)).toFixed(2)} HZ`:'WAITING FOR GESTURE'}</div></div><div className="now-bottom"><div><span className="foot-label">INSTRUMENT</span><strong>{INSTRUMENTS.find(item=>item.id===(activeNote?.hand==='LEFT'?leftInstrument:rightInstrument))?.label || 'GRAND PIANO'}</strong></div><div className={`playing-state ${activeNote?'playing':''}`}><span/>{activeNote?'PLAYING':'IDLE'}</div></div></div>
          <div className="gesture-card panel"><div className="panel-heading"><div><span className="section-kicker">03 / RECOGNITION</span><h2>Detected gesture</h2></div><Hand size={18} className="muted-icon"/></div><div className="gesture-result"><div className="gesture-symbol"><Hand size={27}/></div><div className="gesture-text"><strong>{gesture?.label || 'NO GESTURE'}</strong><span>{activeFingerNotes.length ? activeFingerNotes.map(n=>`${n.hand} ${n.finger}`).join(' · ') : gesture?'Extend any finger to play':'Show one or both hands to the camera'}</span></div><div className="confidence"><strong>{gesture?'TRACKED':'—'}</strong><span>HAND STATUS</span></div></div><div className="gesture-progress"><div style={{width:`${gesture?gesture.confidence*100:0}%`}}/></div></div>
        </div>
      </section>
      <section className="lower-grid"><div className="mapping-card panel"><div className="panel-heading"><div><span className="section-kicker">04 / YOUR INSTRUMENT</span><h2>Gesture mapping</h2></div><span className="customizable">CUSTOMIZABLE</span></div><div className="mapping-grid">{mapping.map((n,i)=><div className={`mapping-item ${activeFingerNotes.some(a=>a.id===n.id)?'selected':''}`} key={n.id}><div className="mapping-top"><span className="mapping-index">0{i+1}</span><span className="mapping-note" style={{color:n.color}}>{n.note}</span></div><div className="mapping-gesture"><span className="finger-count">{n.finger==='THUMB'?'👍':n.finger==='INDEX'?'☝':n.finger==='MIDDLE'?'✌':n.finger==='RING'?'♧':'🤙'}</span><div><strong>{n.label}</strong><small>{n.detail}</small></div></div></div>)}</div></div>
        <div className="visualizer-card panel"><div className="panel-heading"><div><span className="section-kicker">05 / SOUND</span><h2>Audio spectrum</h2></div><div className="visualizer-status"><span className={activeNote?'active':''}/>{activeNote?'SIGNAL':'WAITING'}</div></div><div className={`spectrum ${activeNote?'animate':''}`}>{Array.from({length:42},(_,i)=><span key={i} style={{'--i':i,'--h':`${12+((i*17+7)%47)}px`}}/>)}</div><div className="visualizer-foot"><span>LOW FREQUENCY</span><span>LIVE AUDIO RESPONSE</span><span>HIGH FREQUENCY</span></div><div className="volume-row"><Volume2 size={16}/><span>MASTER VOLUME</span><input aria-label="Master volume" type="range" min="0" max="100" value={volume} onChange={e=>setVolume(+e.target.value)}/><strong>{volume}%</strong></div></div></section>
      <section className="bottom-row"><div className="tip"><div className="tip-icon"><Sparkles size={17}/></div><div><strong>A little tip</strong><span>Hold your hand in view, palm facing the camera. Change gestures to move between notes.</span></div></div><div className="stats"><div><Activity size={15}/><span>NOTES PLAYED</span><strong>{notesPlayed}</strong></div><div><Radio size={15}/><span>TRACKED HANDS</span><strong>{cameraOn?(gesture?.hands || 0):'00'}</strong></div></div></section>
      <footer><span>GESTURE MUSIC <i>·</i> A COMPUTER VISION EXPERIMENT</span><span>MADE FOR THE LOVE OF MUSIC <Sparkles size={12}/></span></footer>
    </main>
    {cameraOn && <div className="performance-hud">
      <div className="hud-top-left"><div className="hud-kicker">DUAL INSTRUMENTS</div><label className="hud-hand-select"><span>LEFT HAND</span><select aria-label="Left hand instrument" value={leftInstrument} onChange={e=>setLeftInstrument(e.target.value)}>{INSTRUMENTS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="hud-hand-select"><span>RIGHT HAND</span><select aria-label="Right hand instrument" value={rightInstrument} onChange={e=>setRightInstrument(e.target.value)}>{INSTRUMENTS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div>
      <div className="hud-title"><span className="hud-heart">♥</span><strong>GESTURE MUSIC</strong></div>
      <div className="hud-score"><span>SCORE</span><strong>{String(notesPlayed).padStart(6,'0')}</strong></div>
      <div className="hud-note"><span>NOW PLAYING</span><strong>{activeNote?.note || '—'}</strong><small>{gesture?.label || 'SHOW YOUR HAND'}</small><small>VELOCITY {velocity}</small></div><div className="hud-chord"><span>CHORD DETECTED</span><strong>{chord?.name || '—'}</strong><small>{chord ? `${chord.notes.join(' · ')} / ${chord.inversion}` : 'PLAY 2+ NOTES'}</small></div>
      <div className="hud-finger-map">{mapping.map(n=><div key={n.id} className={activeFingerNotes.some(a=>a.id===n.id)?'active':''}><small>{n.hand[0]} · {n.finger[0]}</small><strong>{n.note}</strong></div>)}</div>
      <div className="hud-bottom"><div className="hud-energy"><span>ENERGY</span><i><b style={{width:`${activeNote?Math.max(18,Math.min(100,volume)):8}%`}}/></i></div><div className="hud-hints"><span><kbd>L / R</kbd> INDEPENDENT INSTRUMENTS</span><span><kbd>2 HANDS</kbd> CHORDS</span><span><kbd>⚙</kbd> SETTINGS</span><button onClick={()=>setSettingsOpen(true)}>SETTINGS</button><button onClick={stopCamera}>END SESSION</button></div></div>
      <div className="hud-scanlines"/>
    </div>}
    {settingsOpen&&<div className="settings-backdrop" onClick={()=>setSettingsOpen(false)}><aside className="settings-drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><div><span className="section-kicker">PREFERENCES</span><h2>Studio settings</h2></div><button className="icon-button" onClick={()=>setSettingsOpen(false)}>×</button></div><label className="setting-label">DETECTION SENSITIVITY <strong>{sensitivity}%</strong></label><input className="wide-range" type="range" min="40" max="95" value={sensitivity} onChange={e=>setSensitivity(+e.target.value)}/><p className="setting-help">Higher sensitivity requires a more confident gesture before playing a note.</p><label className="setting-label">LEFT-HAND INSTRUMENT</label><select value={leftInstrument} onChange={e=>setLeftInstrument(e.target.value)}>{INSTRUMENTS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><label className="setting-label">RIGHT-HAND INSTRUMENT</label><select value={rightInstrument} onChange={e=>setRightInstrument(e.target.value)}>{INSTRUMENTS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><label className="setting-label">VELOCITY SENSITIVITY <strong>{velocitySensitivity.toFixed(1)}×</strong></label><input className="wide-range" type="range" min="0.4" max="2.5" step="0.1" value={velocitySensitivity} onChange={e=>setVelocitySensitivity(+e.target.value)}/><label className="setting-label">VELOCITY SMOOTHING <strong>{Math.round(velocitySmoothing*100)}%</strong></label><input className="wide-range" type="range" min="0.1" max="0.9" step="0.05" value={velocitySmoothing} onChange={e=>setVelocitySmoothing(+e.target.value)}/><label className="setting-label">CHORD GROUPING WINDOW <strong>{chordWindow} MS</strong></label><input className="wide-range" type="range" min="60" max="350" step="10" value={chordWindow} onChange={e=>setChordWindow(+e.target.value)}/><div className="drawer-note"><CircleHelp size={17}/><span>Allow camera access when prompted. Audio starts after you press Start Session.</span></div></aside></div>}
  </div>;
}
