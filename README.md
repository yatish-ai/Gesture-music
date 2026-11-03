# Gesture Music 2.0

Gesture Music is a browser-based computer-vision musical instrument. It uses a webcam and MediaPipe hand landmarks to play notes with up to ten fingers, with expressive velocity estimation, six General MIDI instruments, and chord recognition.

## Gesture Music 2.0 upgrades

### 1. Expressive velocity estimation
- Tracks fingertip motion over time for each finger independently.
- Normalizes movement using wrist-to-middle-MCP palm scale.
- Maps estimated movement speed to MIDI-style velocity (1–127).
- Uses configurable sensitivity and smoothing.
- Velocity changes note amplitude. It is a visual-motion estimate, **not physical pressure sensing**.

### 2. Six instruments
The instrument engine loads actual SoundFont programs using `soundfont-player` and the FluidR3_GM soundfont:

| Instrument | General MIDI program |
|---|---:|
| Grand Piano | 0 |
| Electric Piano 1 | 4 |
| Acoustic Guitar (nylon) | 24 |
| Violin | 40 |
| Flute | 73 |
| Synth Lead 2 (sawtooth) | 81 |

Players are cached per instrument. Changing the instrument affects subsequently triggered notes without rebuilding the audio context.

### 3. Chord recognition
- Groups active notes with a configurable recognition window.
- Matches pitch-class intervals against major, minor, diminished, augmented, sus2, sus4, major 7, minor 7, dominant 7, diminished 7 and minor 7 flat 5 templates.
- Recognizes inversions and displays the chord name, notes and inversion.
- Displays unmatched combinations as `CUSTOM NOTE CLUSTER`.
- Chord recognition is informational; individual notes still sound immediately and are not delayed while the chord is classified.

## Existing functionality retained

- Fullscreen camera performance mode with grayscale/contrast treatment and CRT scanlines.
- MediaPipe Hand Landmarker, up to two hands.
- Ten-finger note mapping:
  - Left: C4, D4, E4, F4, G4.
  - Right: A4, B4, C5, D5, E5.
- Simultaneous finger-triggered notes.
- Gesture HUD, score, current-note display, camera status, visualizer, volume and sensitivity controls.

## Requirements

- Node.js 18+ and npm.
- Modern browser (Chrome or Edge recommended).
- Webcam permission.
- Internet on first run for npm packages, MediaPipe model/WASM assets, Google Fonts and SoundFont samples.

## Run locally

```bash
npm install
npm run dev
```

Open the localhost URL printed by Vite (normally `http://localhost:5173`) and press **Start Session**. Allow camera access. Audio is initialized from the user gesture.

Production build:

```bash
npm run build
npm run preview
```

Unit tests:

```bash
npm test
```

## Settings

Open the HUD settings to configure:
- Detection sensitivity.
- Instrument.
- Velocity sensitivity.
- Velocity smoothing.
- Chord grouping window (60–350 ms).

## How the system works

1. `getUserMedia` captures webcam frames.
2. MediaPipe extracts 21 landmarks per hand.
3. Geometric finger-state logic identifies extended fingers.
4. `VelocityEngine` tracks each fingertip and estimates motion speed relative to palm size.
5. Gesture-to-note mapping selects the MIDI note.
6. `instrumentEngine` loads/caches the selected SoundFont program and plays the note with velocity-scaled amplitude.
7. `chordRecognition` classifies the current active MIDI notes by pitch-class intervals and inversion.
8. The HUD displays current note, velocity, instrument and recognized chord.

## Project structure

```text
GesturePiano_ComputerVision/
├── index.html
├── package.json
├── package-lock.json
├── README.md
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── styles.css
│   ├── velocityEngine.js
│   ├── instrumentEngine.js
│   └── chordRecognition.js
└── tests/
    └── musicEngines.test.js
```

## Notes and limitations

- Velocity is inferred from 2D fingertip movement; a webcam cannot measure physical finger pressure. Results depend on frame rate, lighting, hand angle and tracking stability.
- The current velocity implementation changes sample playback amplitude. It does not guarantee multi-layer sampled velocity like a hardware piano.
- SoundFont assets are fetched by `soundfont-player` from its configured public host. An internet connection is needed when loading instruments for the first time. Check the SoundFont provider's license and terms before redistribution or public hosting.
- Chord classification operates on the currently active notes and their pitch classes. Ambiguous or incomplete sets may be reported as custom clusters.
- Two-hand assignment currently retains the existing app's left/right screen-side heuristic. Crossing hands or moving them across the camera center can affect side assignment.
- MediaPipe assets are fetched from Google's public model hosting and jsDelivr unless configured locally.
- The existing spectrum panel remains the project's current visual activity display; it is not represented as a measured FFT of the output audio.

## Testing

The included Node test suite covers:
- Relative velocity response.
- C major root position and inversion.
- A minor and custom clusters.
- MIDI note naming.
- Six unique instrument definitions.

The React/JSX source files were syntax-parsed during packaging. A production Vite build and webcam/audio hardware test still need to be run on the target Mac after installing dependencies.

## Academic explanation

Present the project as:

**Webcam acquisition → MediaPipe landmark extraction → finger-state estimation → normalized fingertip velocity estimation → gesture-to-MIDI mapping → SoundFont synthesis → chord interval classification → HUD feedback.**

The velocity estimator uses normalized landmark displacement divided by elapsed time. Chord recognition compares pitch-class sets with interval templates; sorting the MIDI notes also allows inversion information to be inferred from the bass note.


## Gesture Music 2.1 — Independent instruments per hand

The left and right hands now have independent instrument routing. Choose an instrument for each hand separately from the two selectors in the fullscreen HUD or from Studio Settings. The instrument selected for a hand is used for every note triggered by that hand; the other hand continues using its own selection. Both selections can be changed while the session is running. The active-note panel identifies the instrument associated with the most recently active note.

Default: Grand Piano on both hands. Supported choices for each hand: Grand Piano, Electric Piano, Acoustic Guitar, Violin, Flute and Synthesizer.
