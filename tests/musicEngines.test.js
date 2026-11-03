import test from 'node:test';
import assert from 'node:assert/strict';
import { VelocityEngine } from '../src/velocityEngine.js';
import { recognizeChord, midiToName } from '../src/chordRecognition.js';
import { INSTRUMENTS, getInstrumentForHand } from '../src/instrumentEngine.js';

test('velocity engine estimates stronger motion as higher MIDI velocity', () => {
  const slow = new VelocityEngine();
  slow.update('finger', {x:0.2,y:0.2}, 0, 0.2);
  const slowValue = slow.update('finger', {x:0.201,y:0.2}, 16, 0.2);
  const fast = new VelocityEngine();
  fast.update('finger', {x:0.2,y:0.2}, 0, 0.2);
  const fastValue = fast.update('finger', {x:0.25,y:0.2}, 16, 0.2);
  assert.ok(fastValue > slowValue);
  assert.ok(fastValue >= 1 && fastValue <= 127);
});

test('recognizes C major in root position and inversion', () => {
  assert.equal(recognizeChord([60,64,67]).name, 'C MAJOR');
  const inverted = recognizeChord([64,67,72]);
  assert.equal(inverted.name, 'C MAJOR');
  assert.equal(inverted.inversion, '1ST INVERSION');
});

test('recognizes A minor and custom note clusters', () => {
  assert.equal(recognizeChord([69,72,76]).name, 'A MINOR');
  assert.equal(recognizeChord([60,61,67]).quality, 'CUSTOM');
});

test('maps MIDI numbers to note names', () => {
  assert.equal(midiToName(71), 'B4');
});

test('provides six distinct General MIDI instruments', () => {
  assert.equal(INSTRUMENTS.length, 6);
  assert.equal(new Set(INSTRUMENTS.map(x=>x.id)).size, 6);
  assert.ok(INSTRUMENTS.some(x=>x.id==='violin'));
  assert.ok(INSTRUMENTS.some(x=>x.id==='flute'));
});

test('routes each hand to its independently selected instrument', () => {
  assert.equal(getInstrumentForHand('LEFT', 'violin', 'flute'), 'violin');
  assert.equal(getInstrumentForHand('RIGHT', 'violin', 'flute'), 'flute');
});
