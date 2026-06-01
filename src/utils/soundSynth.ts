class SoundSynth {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  /**
   * Initializes the AudioContext on-demand.
   * Browsers block autoplay, so this is called on the first user interaction.
   */
  private init(): boolean {
    if (!this.soundEnabled) return false;
    if (this.ctx) return true;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
        return true;
      }
    } catch (e) {
      console.warn('Web Audio API is not supported in this browser.', e);
    }
    return false;
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (!enabled && this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Safe wrapper to ensure context is active
   */
  private getContext(): AudioContext | null {
    if (!this.init()) return null;
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Plays a clean wooden-like knock for chess moves.
   */
  public playMove() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    
    // Pitch envelope: drops rapidly from 600Hz to 150Hz for a woodblock feel
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);

    // Amplitude envelope: fast decay
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  /**
   * Plays a snappy double-click sound for capturing pieces.
   */
  public playCapture() {
    const ctx = this.getContext();
    if (!ctx) return;

    const playClick = (timeOffset: number, pitch: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, ctx.currentTime + timeOffset);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + timeOffset + 0.04);

      gain.gain.setValueAtTime(vol, ctx.currentTime + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + timeOffset);
      osc.stop(ctx.currentTime + timeOffset + 0.04);
    };

    // Double tap: two clicks separated by 40ms to simulate physical capture
    playClick(0, 1000, 0.3);
    playClick(0.04, 750, 0.25);
  }

  /**
   * Plays a bright, dual-frequency resonant chime for checks.
   */
  public playCheck() {
    const ctx = this.getContext();
    if (!ctx) return;

    const frequencies = [1200, 1500]; // Harmony chord
    const duration = 0.25;

    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    });
  }

  /**
   * Plays a deep declining chord for checkmate, draw, or resign.
   */
  public playGameOver() {
    const ctx = this.getContext();
    if (!ctx) return;

    const playTone = (freq: number, start: number, duration: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      osc.frequency.linearRampToValueAtTime(freq - 100, ctx.currentTime + start + duration);

      gain.gain.setValueAtTime(vol, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Minor arpeggio descending to a deep, dark chord
    playTone(600, 0.0, 0.2, 0.15);
    playTone(480, 0.12, 0.25, 0.15);
    playTone(360, 0.24, 0.35, 0.2);
    playTone(240, 0.36, 0.8, 0.25);
  }

  /**
   * Plays a quick dual-tone descending chime for Undos.
   */
  public playUndo() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  /**
   * Plays a pleasant magical chime for Hints.
   */
  public playHint() {
    const ctx = this.getContext();
    if (!ctx) return;

    const playSparkle = (freq: number, delay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.12);
    };

    // Quick rising major chords arpeggio
    playSparkle(523.25, 0); // C5
    playSparkle(659.25, 0.04); // E5
    playSparkle(783.99, 0.08); // G5
    playSparkle(1046.50, 0.12); // C6
  }

  /**
   * Plays a quick soft swoosh/woosh for board Flips.
   */
  public playFlip() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(320, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  /**
   * Plays a quick mechanical tick sound for PGN actions.
   */
  public playPgn() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.02);
  }

  /**
   * Plays a clean clicky sound for Restart.
   */
  public playRestart() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(660, ctx.currentTime + 0.07);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  }

  /**
   * Plays a full positive major arpeggio for starting a New Game.
   */
  public playNewGame() {
    const ctx = this.getContext();
    if (!ctx) return;

    const playTone = (freq: number, delay: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur);
    };

    // Bright ascending major chord progression
    playTone(523.25, 0, 0.15); // C5
    playTone(659.25, 0.06, 0.15); // E5
    playTone(783.99, 0.12, 0.15); // G5
    playTone(1046.50, 0.18, 0.35); // C6
  }
}

export const soundSynth = new SoundSynth();
