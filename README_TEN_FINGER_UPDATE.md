# Gesture Music — Ten-Finger Update

This update expands Gesture Music from a small set of hand poses to **ten independent finger controls** using both hands.

## Default note map

| Visible hand | Finger | Note |
|---|---|---|
| Left | Thumb | C4 |
| Left | Index | D4 |
| Left | Middle | E4 |
| Left | Ring | F4 |
| Left | Pinky | G4 |
| Right | Thumb | A4 |
| Right | Index | B4 |
| Right | Middle | C5 |
| Right | Ring | D5 |
| Right | Pinky | E5 |

Raise a finger to start its note; fold it to release that note. You can raise several fingers at once to play chords. Notes are triggered on the finger's transition from folded to extended, so holding a finger up does not repeatedly retrigger it.

## How hand assignment works

The live camera preview is mirrored for a natural selfie view. Gesture Music uses each detected wrist's mirrored screen position to decide whether it is the visible left or right hand. Keep your left hand on the left half of the screen and your right hand on the right half for the default mapping.

## Run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, allow camera access, and press **Start Session**. Audio is initialized by the Start Session click to comply with browser audio autoplay restrictions.

## Notes

- The app uses MediaPipe Hand Landmarker with `numHands: 2` and tracks both detected hands.
- Piano notes are played through Soundfont Player. The browser fetches the selected instrument's soundfont samples when audio is initialized, so an internet connection is needed on first load unless you configure locally hosted assets.
- Finger extension is estimated from landmark joint angles and wrist-relative distances. Accuracy can vary with camera angle, lighting, hand rotation and fingers overlapping. Keep both palms visible and avoid crossing hands.
- The visual finger legend is shown in full-screen performance mode and active notes are highlighted.
