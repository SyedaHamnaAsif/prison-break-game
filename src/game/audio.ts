class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private lastStepTime = 0;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private playTone(
    freq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), now);
      if (endFreq !== freq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      // Ignore transient Web Audio errors
    }
  }

  playStep(sprinting: boolean, crouching: boolean) {
    const now = performance.now();
    const interval = sprinting ? 230 : crouching ? 440 : 330;
    if (now - this.lastStepTime < interval) return;
    this.lastStepTime = now;
    const vol = crouching ? 0.025 : sprinting ? 0.07 : 0.04;
    const pitch = crouching ? 110 : sprinting ? 165 : 135;
    this.playTone(pitch + Math.random() * 20, 65, 0.07, 'triangle', vol);
  }

  playLoot() {
    this.playTone(520, 740, 0.09, 'sine', 0.08);
    this.playTone(760, 1020, 0.11, 'sine', 0.07, 0.07);
  }

  playCraft() {
    this.playTone(300, 420, 0.08, 'square', 0.06);
    this.playTone(540, 680, 0.12, 'triangle', 0.08, 0.08);
  }

  playDoor() {
    this.playTone(140, 90, 0.16, 'sawtooth', 0.06);
    this.playTone(220, 170, 0.12, 'triangle', 0.05, 0.05);
  }

  playLockpickTick() {
    this.playTone(880, 1200, 0.045, 'square', 0.05);
  }

  playLockpickSuccess() {
    this.playTone(620, 880, 0.08, 'triangle', 0.08);
    this.playTone(920, 1280, 0.14, 'sine', 0.08, 0.07);
  }

  playLockpickFail() {
    this.playTone(240, 120, 0.18, 'sawtooth', 0.08);
  }

  playCoin() {
    this.playTone(1650, 1920, 0.07, 'sine', 0.07);
    this.playTone(2150, 2000, 0.14, 'sine', 0.06, 0.06);
  }

  playEMP() {
    this.playTone(900, 110, 0.35, 'sawtooth', 0.09);
    this.playTone(440, 75, 0.3, 'sine', 0.08, 0.04);
  }

  playSmoke() {
    this.playTone(260, 95, 0.28, 'triangle', 0.08);
  }

  playSnip() {
    this.playTone(740, 320, 0.09, 'sawtooth', 0.08);
    this.playTone(540, 220, 0.08, 'square', 0.05, 0.06);
  }

  playDig() {
    this.playTone(130, 55, 0.14, 'triangle', 0.09);
  }

  playSuspicious() {
    this.playTone(380, 490, 0.12, 'sine', 0.07);
  }

  playWhistle() {
    this.playTone(1480, 1720, 0.15, 'sine', 0.09);
    this.playTone(1680, 1340, 0.18, 'sine', 0.08, 0.15);
  }

  playAlarmPulse() {
    this.playTone(620, 440, 0.24, 'sawtooth', 0.06);
  }

  playHit() {
    this.playTone(170, 55, 0.22, 'sawtooth', 0.12);
  }

  playBusted() {
    this.playTone(220, 150, 0.22, 'sawtooth', 0.1);
    this.playTone(150, 85, 0.35, 'sawtooth', 0.1, 0.2);
  }

  playEscape() {
    this.playTone(440, 440, 0.12, 'triangle', 0.09, 0);
    this.playTone(554.37, 554.37, 0.12, 'triangle', 0.09, 0.1);
    this.playTone(659.25, 659.25, 0.14, 'triangle', 0.09, 0.2);
    this.playTone(880, 880, 0.36, 'sine', 0.11, 0.32);
  }
}

export const soundEngine = new SoundEngine();
