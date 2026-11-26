"use client";

class TactileAudioEngine {
  private ctx: AudioContext | null = null;
  public soundEnabled = true;

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playTap() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(95, ctx.currentTime + 0.035);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }

  public playMedal(tier: "bronze" | "silver" | "gold") {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const notes =
      tier === "bronze"
        ? [330, 440]
        : tier === "silver"
        ? [392, 523.25]
        : [440, 554.37, 659.25];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const start = ctx.currentTime + idx * 0.065;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.09, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    });
  }

  /**
   * Warm, resonant two-harmonic completion bell (~0.45s)
   * Played when a mission countdown finishes or Day Debrief closes.
   */
  public playMissionBell() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const harmonics: Array<{ freq: number; peak: number; type: OscillatorType }> = [
      { freq: 523.25, peak: 0.095, type: "sine" }, // C5 warm fundamental
      { freq: 783.99, peak: 0.055, type: "triangle" }, // G5 resonant fifth
    ];

    harmonics.forEach(({ freq, peak, type }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    });
  }

  /**
   * Iconic ascending 4-step harmonic sequence (~0.9s)
   * Played when the MOB 0% -> 100% counter reaches 100%.
   */
  public playMobHundredSequence() {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const steps: Array<{
      offset: number;
      freqs: number[];
      duration: number;
      peak: number;
    }> = [
      { offset: 0.0, freqs: [392.0], duration: 0.18, peak: 0.08 }, // G4
      { offset: 0.14, freqs: [523.25], duration: 0.19, peak: 0.09 }, // C5
      { offset: 0.28, freqs: [659.25], duration: 0.21, peak: 0.1 }, // E5
      { offset: 0.43, freqs: [783.99, 1046.5], duration: 0.46, peak: 0.11 }, // G5 + C6 warm resolution
    ];

    steps.forEach((step) => {
      const start = now + step.offset;
      step.freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(
          idx === 0 ? step.peak : step.peak * 0.65,
          start + 0.016
        );
        gain.gain.exponentialRampToValueAtTime(0.001, start + step.duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + step.duration + 0.01);
      });
    });
  }
}

export const soundEngine = new TactileAudioEngine();
