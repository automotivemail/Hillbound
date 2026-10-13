// Procedural Web Audio synthesizer for vintage 4x4 engine, winch, camera shutter, and discovery chimes

class SoundManager {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.35;
  private isRunning: boolean = false;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.engineOsc = this.ctx.createOscillator();
      this.engineSubOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 180;

      this.engineOsc.type = 'sawtooth';
      this.engineSubOsc.type = 'triangle';
      this.engineOsc.frequency.value = 42;
      this.engineSubOsc.frequency.value = 21;

      this.engineGain.gain.value = 0.001;

      this.engineOsc.connect(filter);
      this.engineSubOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
      this.engineSubOsc.start();
      this.isRunning = true;
    } catch {
      // AudioContext blocked or unsupported
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(muted ? 0.0001 : 0.05 * this.masterVolume, this.ctx.currentTime, 0.1);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public updateEngine(rpmNormalized: number, load: number, paused: boolean) {
    if (!this.ctx || !this.engineOsc || !this.engineSubOsc || !this.engineGain || !this.isRunning) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (this.isMuted || paused) {
      this.engineGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
      return;
    }

    const baseFreq = 36 + rpmNormalized * 75;
    this.engineOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.05);
    this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, this.ctx.currentTime, 0.05);

    const targetGain = (0.04 + rpmNormalized * 0.06 + load * 0.04) * this.masterVolume;
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.06);
  }

  public playWinchClick() {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.12 * this.masterVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.065);
    } catch {
      // ignore
    }
  }

  public playCameraShutter() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

      gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.095);
    } catch {
      // ignore
    }
  }

  public playDiscoveryChime() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [392.0, 493.88, 587.33, 783.99]; // G4, B4, D5, G5
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.11);

        gain.gain.setValueAtTime(0.001, now + i * 0.11);
        gain.gain.linearRampToValueAtTime(0.16 * this.masterVolume, now + i * 0.11 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.11);
        osc.stop(now + i * 0.11 + 0.48);
      });
    } catch {
      // ignore
    }
  }

  public playHitchClank() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.14);

      gain.gain.setValueAtTime(0.2 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundManager();
