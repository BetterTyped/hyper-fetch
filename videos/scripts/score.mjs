/*
 * Synthesizes the soundtrack of every launch video from its cue sheet (src/cues.ts), plus the sound effects the
 * scenes place by hand. Everything is generated here, so there are no samples or licences to track.
 *
 *   node scripts/score.mjs             music for every video and all sound effects
 *   node scripts/score.mjs HyperFetchDB
 *
 * The music is a 120 BPM minor-key electronic track: a detuned supersaw pad and a pluck arpeggio over a
 * sidechained bass, with drums whose density follows each scene's energy. Every cut gets a fill and a riser into
 * the downbeat and a crash on it, so the edit and the music hit together.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { cues, downbeats, FPS, totalFrames } from "../src/cues.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SR = 48000;
const BEAT_S = 0.5;
const BAR_S = BEAT_S * 4;
const S16 = BEAT_S / 4;

/* ----------------------------------------------------------------------------------------------- helpers */

const seeded = (seed) => {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296) * 2 - 1;
  };
};
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const polyblep = (t, dt) => {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1;
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt;
    return t * t + t + t + 1;
  }
  return 0;
};

/* Topology-preserving state variable filter (Simper). Returns lp, bp, hp for one sample */
const svf = () => {
  let ic1 = 0;
  let ic2 = 0;
  return (x, fc, q = 0.707) => {
    const g = Math.tan((Math.PI * Math.min(fc, SR * 0.45)) / SR);
    const k = 1 / q;
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = x - ic2;
    const v1 = a1 * ic1 + a2 * v3;
    const v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1;
    ic2 = 2 * v2 - ic2;
    return { lp: v2, bp: v1, hp: x - k * v1 - v2 };
  };
};

class Bus {
  constructor(n) {
    this.L = new Float32Array(n);
    this.R = new Float32Array(n);
    this.n = n;
  }
  add(i, l, r = l) {
    if (i >= 0 && i < this.n) {
      this.L[i] += l;
      this.R[i] += r;
    }
  }
  mix(other, gain = 1) {
    for (let i = 0; i < this.n; i += 1) {
      this.L[i] += other.L[i] * gain;
      this.R[i] += other.R[i] * gain;
    }
  }
}

/* Freeverb */
const reverb = (bus, { room = 0.84, damp = 0.3 } = {}) => {
  const scale = SR / 44100;
  const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((t) => Math.round(t * scale));
  const apT = [556, 441, 341, 225].map((t) => Math.round(t * scale));
  const out = new Bus(bus.n);
  for (const [ch, spread] of [
    ["L", 0],
    ["R", Math.round(23 * scale)],
  ]) {
    const input = bus[ch];
    const combs = combT.map((t) => ({ buf: new Float32Array(t + spread), i: 0, store: 0 }));
    const aps = apT.map((t) => ({ buf: new Float32Array(t + spread), i: 0 }));
    const o = out[ch];
    for (let n = 0; n < bus.n; n += 1) {
      const x = input[n] * 0.015;
      let s = 0;
      for (const c of combs) {
        const y = c.buf[c.i];
        c.store = y * (1 - damp) + c.store * damp;
        c.buf[c.i] = x + c.store * room;
        c.i = (c.i + 1) % c.buf.length;
        s += y;
      }
      for (const a of aps) {
        const b = a.buf[a.i];
        a.buf[a.i] = s + b * 0.5;
        a.i = (a.i + 1) % a.buf.length;
        s = b - s;
      }
      o[n] = s;
    }
  }
  return out;
};

/* Ping-pong delay with a darkening feedback path */
const pingPong = (bus, time, feedback = 0.38) => {
  const d = Math.round(time * SR);
  const out = new Bus(bus.n);
  const bl = new Float32Array(d);
  const br = new Float32Array(d);
  let lpL = 0;
  let lpR = 0;
  for (let n = 0; n < bus.n; n += 1) {
    const i = n % d;
    const yl = bl[i];
    const yr = br[i];
    lpL += 0.35 * (yl - lpL);
    lpR += 0.35 * (yr - lpR);
    bl[i] = (bus.L[n] + bus.R[n]) * 0.5 + lpR * feedback;
    br[i] = lpL * feedback;
    out.L[n] = yl;
    out.R[n] = yr;
  }
  return out;
};

const toWav = (bus, file, { peak = 0.89 } = {}) => {
  let max = 0;
  for (let i = 0; i < bus.n; i += 1) max = Math.max(max, Math.abs(bus.L[i]), Math.abs(bus.R[i]));
  const g = max > 0 ? peak / max : 1;
  const data = Buffer.alloc(44 + bus.n * 4);
  data.write("RIFF", 0);
  data.writeUInt32LE(36 + bus.n * 4, 4);
  data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(2, 22);
  data.writeUInt32LE(SR, 24);
  data.writeUInt32LE(SR * 4, 28);
  data.writeUInt16LE(4, 32);
  data.writeUInt16LE(16, 34);
  data.write("data", 36);
  data.writeUInt32LE(bus.n * 4, 40);
  for (let i = 0; i < bus.n; i += 1) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, bus.L[i] * g)) * 32767), 44 + i * 4);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, bus.R[i] * g)) * 32767), 46 + i * 4);
  }
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, data);
};

/* ----------------------------------------------------------------------------------------------- voices */

const kick = (bus, t0, gain = 1) => {
  const s0 = Math.round(t0 * SR);
  let phase = 0;
  const noise = seeded(Math.round(t0 * 1000) + 7);
  for (let i = 0; i < SR * 0.5; i += 1) {
    const t = i / SR;
    const f = 52 + 120 * Math.exp(-t * 30);
    phase += f / SR;
    const body = Math.sin(2 * Math.PI * phase) * Math.exp(-t * 8.5);
    const click = t < 0.004 ? noise() * (1 - t / 0.004) * 0.5 : 0;
    const v = Math.tanh((body + click) * 1.6) * gain;
    bus.add(s0 + i, v, v);
  }
};

const clap = (bus, t0, gain = 0.38, seed = 3) => {
  const s0 = Math.round(t0 * SR);
  const noise = seeded(seed + Math.round(t0 * 997));
  const f = svf();
  for (let i = 0; i < SR * 0.35; i += 1) {
    const t = i / SR;
    let env = 0;
    for (const o of [0, 0.011, 0.022]) if (t >= o) env = Math.max(env, Math.exp(-(t - o) * 140));
    env = Math.max(env, t > 0.022 ? 0.45 * Math.exp(-(t - 0.022) * 11) : 0);
    const { bp } = f(noise(), 1500, 0.9);
    const v = bp * env * gain * 2.2;
    bus.add(s0 + i, v * 0.9, v);
  }
};

const hat = (bus, t0, { open = false, gain = 0.12, pan = 0.1 } = {}) => {
  const s0 = Math.round(t0 * SR);
  const noise = seeded(Math.round(t0 * 7919) + 11);
  const f = svf();
  const len = open ? 0.32 : 0.06;
  for (let i = 0; i < SR * len; i += 1) {
    const t = i / SR;
    const env = Math.exp(-t * (open ? 11 : 70));
    const { hp } = f(noise(), 7500, 0.8);
    const v = hp * env * gain;
    bus.add(s0 + i, v * (1 - pan), v * (1 + pan));
  }
};

const crash = (bus, t0, gain = 0.22) => {
  const s0 = Math.round(t0 * SR);
  const noise = seeded(Math.round(t0 * 4421) + 5);
  const fl = svf();
  const fr = svf();
  const noise2 = seeded(Math.round(t0 * 3331) + 9);
  for (let i = 0; i < SR * 2.6; i += 1) {
    const t = i / SR;
    const env = Math.exp(-t * 1.9) * Math.min(1, t / 0.002);
    bus.add(s0 + i, fl(noise(), 5200, 0.6).hp * env * gain, fr(noise2(), 5200, 0.6).hp * env * gain);
  }
};

const riser = (bus, t0, dur, gain = 0.26) => {
  const s0 = Math.round(t0 * SR);
  const noise = seeded(Math.round(t0 * 211) + 17);
  const f = svf();
  let phase = 0;
  for (let i = 0; i < SR * dur; i += 1) {
    const p = i / (SR * dur);
    const fc = 300 * (9000 / 300) ** p;
    const { bp } = f(noise(), fc, 2.2);
    phase += (200 + 900 * p * p) / SR;
    const tone = Math.sin(2 * Math.PI * phase) * 0.12 * p;
    const v = (bp * 1.8 + tone) * p ** 2.2 * gain;
    bus.add(s0 + i, v * (1 - p * 0.3), v * (0.7 + p * 0.3));
  }
};

const impact = (bus, t0, gain = 0.9) => {
  const s0 = Math.round(t0 * SR);
  let phase = 0;
  const noise = seeded(Math.round(t0 * 131) + 23);
  const f = svf();
  for (let i = 0; i < SR * 2.2; i += 1) {
    const t = i / SR;
    const freq = 28 + 52 * Math.exp(-t * 3);
    phase += freq / SR;
    const sub = Math.sin(2 * Math.PI * phase) * Math.exp(-t * 1.6);
    const thump = f(noise(), 260, 0.7).lp * Math.exp(-t * 9) * 2.5;
    const v = Math.tanh((sub + thump) * 1.4) * gain;
    bus.add(s0 + i, v, v);
  }
};

/* A detuned supersaw chord, filtered as one, with its own envelope */
const padChord = (bus, t0, dur, notes, { cutoff = 1800, cutoffEnd = cutoff, attack = 0.3, release = 1.1, gain = 0.05 } = {}) => {
  const s0 = Math.round(t0 * SR);
  const n = Math.round((dur + release) * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const detunes = [-0.16, -0.08, 0, 0.08, 0.16];
  notes.forEach((note, ni) => {
    detunes.forEach((cents, di) => {
      const freq = mtof(note + cents);
      const dt = freq / SR;
      let ph = (ni * 0.37 + di * 0.21) % 1;
      const pan = ((di + ni) % 2 === 0 ? -1 : 1) * (0.25 + Math.abs(cents) * 3);
      for (let i = 0; i < n; i += 1) {
        ph += dt;
        if (ph >= 1) ph -= 1;
        const v = 2 * ph - 1 - polyblep(ph, dt);
        L[i] += v * (1 - pan) * 0.5;
        R[i] += v * (1 + pan) * 0.5;
      }
    });
  });
  const fl = svf();
  const fr = svf();
  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    const p = Math.min(1, t / dur);
    const fc = cutoff * (cutoffEnd / cutoff) ** p;
    const env = Math.min(1, t / attack) * (t > dur ? Math.exp(-(t - dur) * (4.5 / release)) : 1);
    bus.add(s0 + i, fl(L[i], fc, 0.9).lp * env * gain, fr(R[i], fc, 0.9).lp * env * gain);
  }
};

const pluck = (bus, t0, note, { gain = 0.11, decay = 0.28, bright = 1, pan = 0 } = {}) => {
  const s0 = Math.round(t0 * SR);
  const freq = mtof(note);
  const dt = freq / SR;
  const f = svf();
  let ph = 0;
  let ph2 = 0.3;
  for (let i = 0; i < SR * (decay * 2.2); i += 1) {
    const t = i / SR;
    ph = (ph + dt) % 1;
    ph2 = (ph2 + dt * 1.003) % 1;
    const saw = 2 * ph - 1 - polyblep(ph, dt);
    const sq = ph2 < 0.5 ? 1 : -1;
    const fc = 500 + 4200 * bright * Math.exp(-t * 18);
    const v = f(saw * 0.7 + sq * 0.25, fc, 1.4).lp * Math.exp(-t / decay) * gain;
    bus.add(s0 + i, v * (1 - pan), v * (1 + pan));
  }
};

const bell = (bus, t0, note, { gain = 0.07, decay = 1.6 } = {}) => {
  const s0 = Math.round(t0 * SR);
  const freq = mtof(note);
  for (let i = 0; i < SR * decay * 2; i += 1) {
    const t = i / SR;
    const mod = Math.sin(2 * Math.PI * freq * 3.5 * t) * 2.2 * Math.exp(-t * 5);
    const v = Math.sin(2 * Math.PI * freq * t + mod) * Math.exp(-t / decay * 2.2) * gain;
    bus.add(s0 + i, v * 0.8, v);
  }
};

const bassNote = (bus, t0, dur, note, { gain = 0.2, cutoff = 700 } = {}) => {
  const s0 = Math.round(t0 * SR);
  const freq = mtof(note);
  const dt = freq / SR;
  const f = svf();
  let ph = 0;
  let sub = 0;
  const n = Math.round((dur + 0.05) * SR);
  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    ph = (ph + dt) % 1;
    sub += freq / 2 / SR;
    const saw = 2 * ph - 1 - polyblep(ph, dt);
    const env = Math.min(1, t / 0.004) * (t > dur ? Math.exp(-(t - dur) * 60) : 1) * (0.75 + 0.25 * Math.exp(-t * 8));
    const fc = cutoff * (1 + 2.2 * Math.exp(-t * 14));
    const v = (f(saw, fc, 1.1).lp * 0.7 + Math.sin(2 * Math.PI * sub) * 0.28) * env * gain;
    bus.add(s0 + i, v, v);
  }
};

/* ----------------------------------------------------------------------------------------------- harmony */

/* A minor chords: pad voicing, bass root and arpeggio tones */
const CHORDS = {
  i: { pad: [57, 60, 64, 67, 71], bass: 45, arp: [69, 72, 76, 79, 81, 84] },
  iv: { pad: [57, 60, 62, 65, 69], bass: 38, arp: [69, 74, 77, 81, 74, 86] },
  V: { pad: [56, 59, 64, 68, 71], bass: 40, arp: [68, 71, 76, 80, 83, 88] },
  VI: { pad: [53, 57, 60, 64, 67], bass: 41, arp: [65, 69, 72, 76, 79, 81] },
  III: { pad: [55, 60, 64, 67, 71], bass: 36, arp: [67, 72, 76, 79, 83, 84] },
  VII: { pad: [55, 59, 62, 65, 69], bass: 43, arp: [67, 71, 74, 79, 81, 83] },
};
const PROGRESSIONS = [
  ["i", "VI", "III", "VII"],
  ["i", "VII", "VI", "VII"],
  ["VI", "VII", "i", "i"],
  ["i", "iv", "VI", "V"],
];
const ARPS = [
  [0, 2, 1, 3, 2, 4, 3, 5, 0, 2, 1, 3, 2, 4, 3, 1],
  [0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 5, 3, 2, 1],
  [0, 3, 1, 4, 2, 5, 1, 3, 0, 3, 1, 4, 2, 5, 4, 2],
  [0, 2, 4, 2, 1, 3, 5, 3, 0, 2, 4, 2, 1, 3, 5, 4],
];

/* ----------------------------------------------------------------------------------------------- score */

const ENERGY = { hook: 0, intro: 0, low: 1, mid: 2, high: 3, outro: 4 };

const renderScore = (cue) => {
  const total = totalFrames(cue) / FPS;
  const n = Math.ceil(total * SR);
  const drums = new Bus(n);
  const bass = new Bus(n);
  const pad = new Bus(n);
  const arp = new Bus(n);
  const fx = new Bus(n);
  const verbSend = new Bus(n);
  const kicks = [];

  const t = (x) => x + cue.key;
  const transpose = (notes) => notes.map(t);
  const progression = PROGRESSIONS[cue.flavor % PROGRESSIONS.length];
  const arpPattern = ARPS[cue.flavor % ARPS.length];
  const beats = downbeats(cue).map((f) => f / FPS);
  let globalBar = 0;

  cue.scenes.forEach((scene, si) => {
    const start = beats[si];
    const e = ENERGY[scene.energy];
    const next = cue.scenes[si + 1];
    const isLastBeforeOutro = next && ENERGY[next.energy] === 4;
    const fromHook = scene.energy === "hook";

    for (let b = 0; b < scene.bars; b += 1) {
      const t0 = start + b * BAR_S;
      const chord = CHORDS[e === 4 ? "i" : progression[globalBar % 4]];
      const lastBar = b === scene.bars - 1;

      /* The cold open: a hit with every word slam on the first bar, then a swell into the drop */
      if (scene.energy === "hook") {
        if (b === 0) {
          for (let k = 0; k < 4; k += 1) {
            const ht = t0 + k * BEAT_S;
            kick(drums, ht, 0.9);
            impact(fx, ht, 0.32);
            bell(fx, ht, t(CHORDS.i.arp[[0, 2, 1, 3][k]] + 12), { gain: 0.04, decay: 0.8 });
          }
        } else {
          padChord(pad, t0, BAR_S, transpose(chord.pad), { cutoff: 400, cutoffEnd: 2600, attack: 0.6, gain: 0.05 });
          for (let k = 0; k < 8; k += 1) pluck(arp, t0 + k * S16 * 2, t(chord.arp[k % 6]), { gain: 0.035 + k * 0.007, bright: 0.4 + k * 0.08, pan: k % 2 ? 0.4 : -0.4 });
        }
        globalBar += 1;
        continue;
      }

      /* Pad */
      if (e === 0) {
        padChord(pad, t0, BAR_S, transpose(chord.pad), { cutoff: 300 + b * 700, cutoffEnd: 1000 + b * 1600, attack: b === 0 ? 1.4 : 0.2, gain: 0.05 });
      } else if (e === 4) {
        if (b === 0) padChord(pad, t0, scene.bars * BAR_S + BAR_S * 0.5, transpose([...chord.pad, 76]), { cutoff: 2600, cutoffEnd: 700, attack: 0.02, release: 2.5, gain: 0.055 });
      } else {
        padChord(pad, t0, BAR_S, transpose(chord.pad), { cutoff: [0, 1600, 2400, 3400][e], cutoffEnd: [0, 2000, 3000, 4200][e], attack: 0.08, gain: 0.065 });
      }

      /* Bass */
      if (e >= 2 && e < 4) {
        for (let k = 0; k < 8; k += 1) {
          if (e === 2 && k % 2 === 0) continue;
          const bt = t0 + k * (BEAT_S / 2);
          bassNote(bass, bt, BEAT_S / 2 - 0.03, t(chord.bass) + (k === 7 && lastBar ? 2 : 0), { gain: e === 3 ? 0.15 : 0.13 });
        }
      } else if (e === 1) {
        bassNote(bass, t0, BAR_S - 0.05, t(chord.bass), { gain: 0.1, cutoff: 500 });
      } else if (e === 4 && b === 0) {
        bassNote(bass, t0, BAR_S * 2, t(chord.bass) - 12, { gain: 0.12, cutoff: 360 });
      }

      /* Arpeggio */
      if (e >= 1 && e < 4) {
        const steps = e === 1 ? 8 : 16;
        for (let k = 0; k < steps; k += 1) {
          const stepT = t0 + k * (BAR_S / steps);
          const note = t(chord.arp[arpPattern[(k * (16 / steps)) % 16] % chord.arp.length]);
          pluck(arp, stepT, note, { gain: e === 3 ? 0.13 : 0.11, bright: e === 3 ? 1.1 : 0.75, pan: k % 2 ? 0.35 : -0.35 });
        }
      } else if (e === 0 && b === scene.bars - 1) {
        for (let k = 0; k < 8; k += 1) pluck(arp, t0 + k * S16 * 2, t(chord.arp[k % 6]), { gain: 0.03 + k * 0.006, bright: 0.4 + k * 0.08, pan: k % 2 ? 0.4 : -0.4 });
      }

      /* Bells: a sparkle on the top of the chord every other bar */
      if ((e === 3 && b % 2 === 0) || (e === 4 && b < 2)) {
        bell(fx, t0, t(chord.arp[3] + 12), { gain: 0.05 });
        if (e === 4) [0, 1, 2, 3, 4].forEach((k) => bell(fx, t0 + BAR_S * 0.5 + k * BEAT_S * 0.5, t(CHORDS.i.arp[k] + 12), { gain: 0.035 }));
      }

      /* Drums */
      for (let beat = 0; beat < 4; beat += 1) {
        const bt = t0 + beat * BEAT_S;
        const fillBeat = lastBar && beat === 3 && next;
        if (e >= 2 && e < 4) {
          kick(drums, bt, 0.78);
          kicks.push(bt);
          if (beat % 2 === 1 && !fillBeat) clap(drums, bt, 0.34);
          for (let h = 0; h < (e === 3 ? 4 : 2); h += 1) {
            const ht = bt + h * (BEAT_S / (e === 3 ? 4 : 2));
            const off = e === 3 ? h === 2 : h === 1;
            hat(drums, ht, { open: off && e === 3, gain: off ? 0.17 : 0.11 + (h % 2) * 0.035, pan: h % 2 ? 0.25 : -0.15 });
          }
        } else if (e === 1) {
          if (beat === 0 || beat === 2) {
            kick(drums, bt, 0.7);
            kicks.push(bt);
          }
          hat(drums, bt + BEAT_S / 2, { gain: 0.1 });
        }
        /* The fill into the next scene: sixteenth claps that grow */
        if (fillBeat && e >= 1 && e < 4) {
          for (let k = 0; k < 4; k += 1) clap(drums, bt + k * S16, 0.12 + k * 0.07, 40 + k);
        }
      }
      globalBar += 1;
    }

    /* Into the next scene: a riser over the last two beats, then a crash and a hit on its downbeat */
    if (next) {
      const cut = beats[si + 1];
      riser(fx, cut - BEAT_S * (isLastBeforeOutro || e === 0 ? 4 : 2), BEAT_S * (isLastBeforeOutro || e === 0 ? 4 : 2), e === 0 ? 0.3 : 0.2);
      if (fromHook) bell(fx, cut, t(CHORDS.i.arp[3] + 12), { gain: 0.06 });
      crash(fx, cut, ENERGY[next.energy] >= 3 ? 0.24 : 0.16);
      if (e === 0 || ENERGY[next.energy] === 4) impact(fx, cut, 0.5);
    }
  });


  /* Sidechain: the pad, bass and arpeggio duck under every kick */
  const duck = new Float32Array(n).fill(1);
  for (const k of kicks) {
    const s0 = Math.round(k * SR);
    for (let i = 0; i < SR * 0.4 && s0 + i < n; i += 1) duck[s0 + i] = Math.min(duck[s0 + i], 1 - 0.6 * Math.exp(-(i / SR) / 0.11));
  }
  for (const [bus, depth] of [
    [pad, 1],
    [bass, 1],
    [arp, 0.45],
  ]) {
    for (let i = 0; i < n; i += 1) {
      const g = 1 - (1 - duck[i]) * depth;
      bus.L[i] *= g;
      bus.R[i] *= g;
    }
  }

  verbSend.mix(pad, 0.6);
  verbSend.mix(arp, 0.5);
  verbSend.mix(fx, 0.5);
  verbSend.mix(drums, 0.12);
  const verb = reverb(verbSend);
  const echo = pingPong(arp, BEAT_S * 0.75, 0.42);

  const master = new Bus(n);
  master.mix(drums, 1);
  master.mix(bass, 1);
  master.mix(pad, 1);
  master.mix(arp, 0.9);
  master.mix(fx, 0.9);
  master.mix(echo, 0.28);
  master.mix(verb, 0.42);

  /* Air: a little of everything above 4 kHz again, for presence on laptop speakers */
  const airL = svf();
  const airR = svf();
  for (let i = 0; i < n; i += 1) {
    master.L[i] += airL(master.L[i], 4000, 0.7).hp * 0.35;
    master.R[i] += airR(master.R[i], 4000, 0.7).hp * 0.35;
  }

  /* Highpass at 25 Hz, then a soft clip as the glue, then a short fade at both ends */
  let hl = 0;
  let hr = 0;
  let pl = 0;
  let pr = 0;
  const a = Math.exp((-2 * Math.PI * 25) / SR);
  let rms = 0;
  for (let i = 0; i < n; i += 1) rms += master.L[i] ** 2;
  const pre = 0.16 / Math.sqrt(rms / n);
  for (let i = 0; i < n; i += 1) {
    const xl = master.L[i] * pre;
    const xr = master.R[i] * pre;
    hl = a * (hl + xl - pl);
    hr = a * (hr + xr - pr);
    pl = xl;
    pr = xr;
    const fade = Math.min(1, i / (SR * 0.02), (n - i) / (SR * 1.2));
    master.L[i] = Math.tanh(hl * 1.25) * fade;
    master.R[i] = Math.tanh(hr * 1.25) * fade;
  }
  return master;
};

/* ----------------------------------------------------------------------------------------------- sound effects */

const one = (seconds, fn) => {
  const bus = new Bus(Math.ceil(seconds * SR));
  fn(bus);
  return bus;
};

const SFX = {
  whoosh: () =>
    one(0.9, (bus) => {
      const noise = seeded(91);
      const f = svf();
      const dur = 0.62;
      for (let i = 0; i < SR * 0.9; i += 1) {
        const t = i / SR;
        const p = Math.min(1, t / dur);
        const env = p < 0.82 ? (p / 0.82) ** 2.4 : Math.exp(-(t - dur * 0.82) * 14);
        const fc = 400 + 5200 * Math.sin(Math.min(1, p) * Math.PI * 0.55);
        const v = f(noise(), fc, 1.6).bp * env * 0.9;
        bus.add(i, v * (1.2 - p), v * (0.4 + p));
      }
    }),
  swish: () =>
    one(0.4, (bus) => {
      const noise = seeded(17);
      const f = svf();
      for (let i = 0; i < SR * 0.4; i += 1) {
        const t = i / SR;
        const env = Math.sin(Math.min(1, t / 0.22) * Math.PI) * (t < 0.22 ? 1 : 0);
        const v = f(noise(), 2500 + 6000 * (t / 0.22), 2).bp * env * 0.6;
        bus.add(i, v, v);
      }
    }),
  impact: () => one(2.3, (bus) => impact(bus, 0, 1)),
  boom: () =>
    one(2.4, (bus) => {
      impact(bus, 0, 1);
      crash(bus, 0, 0.18);
    }),
  riser: () => one(2.1, (bus) => riser(bus, 0, 2, 0.6)),
  pop: () =>
    one(0.25, (bus) => {
      let ph = 0;
      for (let i = 0; i < SR * 0.25; i += 1) {
        const t = i / SR;
        ph += (700 + 900 * Math.exp(-t * 60)) / SR;
        const v = Math.sin(2 * Math.PI * ph) * Math.exp(-t * 38) * 0.7;
        bus.add(i, v, v);
      }
    }),
  tick: () =>
    one(0.08, (bus) => {
      const noise = seeded(5);
      const f = svf();
      for (let i = 0; i < SR * 0.08; i += 1) {
        const t = i / SR;
        const v = (f(noise(), 3200, 3).bp * 1.6 + Math.sin(2 * Math.PI * 2400 * t) * 0.3) * Math.exp(-t * 160);
        bus.add(i, v, v);
      }
    }),
  type: () =>
    one(0.09, (bus) => {
      const noise = seeded(33);
      const f = svf();
      for (let i = 0; i < SR * 0.09; i += 1) {
        const t = i / SR;
        const v = f(noise(), 1900, 2.5).bp * Math.exp(-t * 110) * 1.2 + Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 90) * 0.25;
        bus.add(i, v, v);
      }
    }),
  ding: () => one(2.4, (bus) => bell(bus, 0, 91, { gain: 0.5, decay: 1.1 })),
  success: () =>
    one(2.4, (bus) => {
      bell(bus, 0, 88, { gain: 0.42, decay: 0.9 });
      bell(bus, 0.09, 95, { gain: 0.42, decay: 1.1 });
    }),
  error: () =>
    one(0.5, (bus) => {
      const f = svf();
      for (const [o, freq] of [
        [0, 196],
        [0.13, 165],
      ]) {
        const s0 = Math.round(o * SR);
        let ph = 0;
        for (let i = 0; i < SR * 0.12; i += 1) {
          const t = i / SR;
          ph = (ph + freq / SR) % 1;
          const v = f((ph < 0.5 ? 1 : -1) * 0.6, 1400, 0.9).lp * Math.min(1, t / 0.004) * Math.exp(-t * 14) * 0.7;
          bus.add(s0 + i, v, v);
        }
      }
    }),
  glitch: () =>
    one(0.3, (bus) => {
      const noise = seeded(71);
      let hold = 0;
      for (let i = 0; i < SR * 0.3; i += 1) {
        if (i % 180 === 0) hold = noise();
        const gate = Math.floor(i / (SR * 0.03)) % 2 === 0 ? 1 : 0.15;
        const v = Math.round(hold * 6) / 6 * gate * 0.5 * Math.exp(-(i / SR) * 6);
        bus.add(i, v, -v);
      }
    }),
};

/* ----------------------------------------------------------------------------------------------- main */

const only = process.argv.slice(2);
for (const [name, make] of Object.entries(SFX)) {
  toWav(make(), path.join(root, `public/sfx/${name}.wav`), { peak: 0.8 });
}
console.log(`sfx: ${Object.keys(SFX).join(", ")}`);

for (const cue of Object.values(cues)) {
  if (only.length && !only.includes(cue.id)) continue;
  const started = Date.now();
  toWav(renderScore(cue), path.join(root, `public/music/${cue.id}.wav`), { peak: 0.8 });
  console.log(`music: ${cue.id} (${((totalFrames(cue) / FPS) | 0)}s, ${Date.now() - started}ms)`);
}


