# Full-screen camera performance mode

The app now switches to a full-screen camera performance view after **Start Session**. The live mirrored webcam feed fills the viewport, with a grayscale/CRT treatment and neon cyan HUD overlays for instrument selection, score, current note, gesture status, energy meter, settings and session controls.

Before starting, the existing setup/dashboard remains available. Press **END SESSION** to return to it.

## Run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite and allow camera access. Use localhost or HTTPS for webcam permissions.

## Gesture mapping

- One finger: C4
- Two fingers (index + middle): B4
- Three fingers: D5
- Four fingers: E5
- Open palm: G5
- Thumb/index pinch: A4
- Fist: release / silence

The full-screen HUD uses the existing camera and gesture pipeline; it does not create a second camera stream.
