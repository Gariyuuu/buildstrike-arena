"use client";

// All sound effects are synthesized procedurally with the Web Audio API.
// No audio files are used anywhere in this project, which keeps the bundle
// tiny and guarantees every sound is original (no third-party assets).

type SoundId =
  | "rifleFire"
  | "shotgunFire"
  | "reload"
  | "hitConfirm"
  | "takeDamage"
  | "buildPlace"
  | "buildDenied"
  | "buildDestroy"
  | "potionUse"
  | "medkitUse"
  | "jump"
  | "elimination"
  | "countdown"
  | "roundVictory"
  | "levelUp"
  | "coinGain"
  | "purchase"
  | "equip"
  | "uiClick";

class SoundManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private masterVolume = 0.8;
  private sfxVolume = 0.9;
  private muted = false;

  private ensureCtx() {
    if (this.ctx) return this.ctx;
    if (typeof window === "undefined") return null;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.effectiveVolume();
    this.master.connect(this.ctx.destination);
    return this.ctx;
  }

  private effectiveVolume() {
    return this.muted ? 0 : this.masterVolume * this.sfxVolume;
  }

  setVolumes(master: number, sfx: number, muted: boolean) {
    this.masterVolume = master;
    this.sfxVolume = sfx;
    this.muted = muted;
    if (this.master) this.master.gain.value = this.effectiveVolume();
  }

  /** Must be called from a user gesture (click) to unlock audio on some browsers. */
  resume() {
    const ctx = this.ensureCtx();
    if (ctx && ctx.state === "suspended") ctx.resume();
  }

  private noiseBuffer(ctx: AudioContext, duration: number) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private envGain(ctx: AudioContext, attack: number, decay: number, peak = 1) {
    const g = ctx.createGain();
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(peak, now + attack);
    g.gain.exponentialRampToValueAtTime(0.001, now + attack + decay);
    return g;
  }

  play(id: SoundId, opts: { volume?: number; pitch?: number } = {}) {
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    const vol = opts.volume ?? 1;
    const pitch = opts.pitch ?? 1;

    switch (id) {
      case "rifleFire":
        this.playPercussiveTone(ctx, 180 * pitch, 0.06, "square", vol * 0.5);
        this.playNoiseBurst(ctx, 0.05, vol * 0.4);
        break;
      case "shotgunFire":
        this.playPercussiveTone(ctx, 90 * pitch, 0.14, "sawtooth", vol * 0.7);
        this.playNoiseBurst(ctx, 0.18, vol * 0.6);
        break;
      case "reload":
        this.playClick(ctx, 900, 0.03, vol * 0.5);
        this.playClick(ctx, 700, 0.03, vol * 0.5, 0.12);
        break;
      case "hitConfirm":
        this.playPercussiveTone(ctx, 1400, 0.05, "sine", vol * 0.5);
        break;
      case "takeDamage":
        this.playPercussiveTone(ctx, 140, 0.18, "sawtooth", vol * 0.5);
        break;
      case "buildPlace":
        this.playPercussiveTone(ctx, 320, 0.09, "triangle", vol * 0.5);
        break;
      case "buildDenied":
        this.playPercussiveTone(ctx, 220, 0.08, "square", vol * 0.35);
        this.playPercussiveTone(ctx, 160, 0.1, "square", vol * 0.3, 0.06);
        break;
      case "buildDestroy":
        this.playNoiseBurst(ctx, 0.28, vol * 0.6);
        this.playPercussiveTone(ctx, 90, 0.22, "sawtooth", vol * 0.4);
        break;
      case "potionUse":
        this.playPercussiveTone(ctx, 700, 0.16, "sine", vol * 0.4);
        break;
      case "medkitUse":
        this.playPercussiveTone(ctx, 500, 0.22, "sine", vol * 0.4);
        break;
      case "jump":
        this.playPercussiveTone(ctx, 500, 0.08, "sine", vol * 0.35);
        break;
      case "elimination":
        this.playPercussiveTone(ctx, 220, 0.5, "sawtooth", vol * 0.6);
        this.playPercussiveTone(ctx, 110, 0.6, "square", vol * 0.4, 0.08);
        break;
      case "countdown":
        this.playPercussiveTone(ctx, 660, 0.12, "square", vol * 0.4);
        break;
      case "roundVictory":
        [523, 659, 784].forEach((f, i) => this.playPercussiveTone(ctx, f, 0.3, "triangle", vol * 0.4, i * 0.12));
        break;
      case "uiClick":
        this.playClick(ctx, 500, 0.02, vol * 0.4);
        break;
      case "levelUp":
        [392, 523, 659, 784].forEach((f, i) => this.playPercussiveTone(ctx, f, 0.35, "triangle", vol * 0.45, i * 0.09));
        break;
      case "coinGain":
        this.playPercussiveTone(ctx, 1046, 0.08, "sine", vol * 0.4);
        this.playPercussiveTone(ctx, 1568, 0.1, "sine", vol * 0.35, 0.05);
        break;
      case "purchase":
        this.playPercussiveTone(ctx, 660, 0.1, "triangle", vol * 0.4);
        this.playPercussiveTone(ctx, 880, 0.14, "triangle", vol * 0.4, 0.07);
        break;
      case "equip":
        this.playClick(ctx, 700, 0.03, vol * 0.45);
        this.playPercussiveTone(ctx, 440, 0.08, "sine", vol * 0.3, 0.03);
        break;
    }
  }

  private playPercussiveTone(
    ctx: AudioContext,
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0
  ) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * 0.5), ctx.currentTime + delay + duration);
    const gain = this.envGain(ctx, 0.005, duration, volume);
    osc.connect(gain);
    gain.connect(this.master!);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  }

  private playNoiseBurst(ctx: AudioContext, duration: number, volume: number) {
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx, duration);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 3000;
    const gain = this.envGain(ctx, 0.002, duration, volume);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master!);
    src.start();
  }

  private playClick(ctx: AudioContext, freq: number, duration: number, volume: number, delay = 0) {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = freq;
    const gain = this.envGain(ctx, 0.001, duration, volume);
    osc.connect(gain);
    gain.connect(this.master!);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.02);
  }
}

export const soundManager = new SoundManager();
