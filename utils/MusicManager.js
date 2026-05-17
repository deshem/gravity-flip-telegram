import { Storage } from './Storage.js';

const CHORDS = [
  [261.63, 329.63, 392.0],
  [293.66, 369.99, 440.0],
  [329.63, 415.3, 493.88],
  [349.23, 392.0, 523.25]
];

const BASE_VOLUME = 0.1;
const DUCK_VOLUME = 0.04;

class MusicManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.filter = null;
    this.playing = false;
    this.unlocked = false;
    this.intervalId = null;
    this.chordIndex = 0;
    this.targetVolume = BASE_VOLUME;
  }

  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 900;
    this.filter.Q.value = 0.6;

    this.master.connect(this.filter);
    this.filter.connect(this.ctx.destination);
  }

  async unlock() {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.unlocked = true;
    this.sync();
  }

  isEnabled() {
    return Storage.getSettings().sound;
  }

  sync() {
    if (!this.unlocked) return;
    if (this.isEnabled()) {
      this.start();
      this.fadeTo(this.targetVolume);
    } else {
      this.stop();
    }
  }

  fadeTo(level, duration = 0.8) {
    if (!this.master || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(level, t + duration);
  }

  duck(active) {
    this.targetVolume = active ? DUCK_VOLUME : BASE_VOLUME;
    if (this.playing && this.isEnabled()) {
      this.fadeTo(this.targetVolume, 0.4);
    }
  }

  playChord() {
    if (!this.ctx || !this.master) return;

    const freqs = CHORDS[this.chordIndex];
    this.chordIndex = (this.chordIndex + 1) % CHORDS.length;

    const now = this.ctx.currentTime;
    const duration = 5.8;

    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.value = freq;

      const peak = 0.07 / freqs.length;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peak, now + 1.2);
      gain.gain.linearRampToValueAtTime(peak * 0.85, now + duration - 1.4);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    });
  }

  start() {
    if (!this.ctx || this.playing || !this.isEnabled()) return;

    this.playing = true;
    this.playChord();
    this.intervalId = setInterval(() => this.playChord(), 5200);
    this.fadeTo(this.targetVolume);
  }

  stop() {
    this.playing = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.master && this.ctx) {
      this.fadeTo(0, 0.5);
    }
  }
}

export const music = new MusicManager();

export function bindMusicUnlock(scene) {
  const unlock = () => music.unlock();

  scene.input.once('pointerdown', unlock);
  document.addEventListener('pointerdown', unlock, { once: true });
  document.addEventListener('touchstart', unlock, { once: true });
}
