// Estimates expressive MIDI velocity from normalized fingertip motion.
// This is a visual-motion proxy, not physical pressure measurement.
export class VelocityEngine {
  constructor({ min = 0.025, max = 0.75, sensitivity = 1, smoothing = 0.35 } = {}) {
    this.min = min;
    this.max = max;
    this.sensitivity = sensitivity;
    this.smoothing = smoothing;
    this.history = new Map();
    this.filtered = new Map();
  }

  update(id, point, timestampMs, palmScale = 0.2) {
    const prev = this.history.get(id);
    this.history.set(id, { x: point.x, y: point.y, t: timestampMs });
    if (!prev) return this.filtered.get(id) ?? 64;
    const dt = Math.max(0.001, (timestampMs - prev.t) / 1000);
    const distance = Math.hypot(point.x - prev.x, point.y - prev.y);
    const normalizedSpeed = (distance / Math.max(0.04, palmScale)) / dt;
    const scaled = Math.max(0, Math.min(1, (normalizedSpeed * this.sensitivity - this.min) / (this.max - this.min)));
    const raw = Math.round(18 + scaled * 109);
    const old = this.filtered.get(id) ?? raw;
    const value = Math.round(old * (1 - this.smoothing) + raw * this.smoothing);
    this.filtered.set(id, value);
    return value;
  }

  get(id) { return this.filtered.get(id) ?? 64; }
  configure(options = {}) {
    if (Number.isFinite(options.sensitivity)) this.sensitivity = options.sensitivity;
    if (Number.isFinite(options.smoothing)) this.smoothing = options.smoothing;
    if (Number.isFinite(options.min)) this.min = options.min;
    if (Number.isFinite(options.max)) this.max = Math.max(this.min + 0.01, options.max);
  }
  reset(id) {
    if (id) { this.history.delete(id); this.filtered.delete(id); }
    else { this.history.clear(); this.filtered.clear(); }
  }
}
