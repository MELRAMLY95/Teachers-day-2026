export type Bed =
  | "none"
  | "gate"
  | "chemistry"
  | "physics"
  | "mathematics"
  | "biology"
  | "english"
  | "inner"
  | "memory";

const STORAGE_KEY = "wwli-sound";

export class Soundscape {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bedNodes: AudioNode[] = [];
  private current: Bed = "none";
  enabled = true;
  private duckScale = 1;

  constructor() {
    if (typeof window === "undefined") return;
    this.enabled = window.localStorage.getItem(STORAGE_KEY) !== "off";
  }

  private ensure() {
    if (typeof window === "undefined") return null;
    if (!this.ctx || this.ctx.state === "closed") {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = this.enabled ? 0.16 : 0;
      master.connect(ctx.destination);
      this.ctx = ctx;
      this.master = master;
      this.current = "none";
    }
    return this.ctx;
  }

  async unlock() {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
    }
    if (!this.master || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(on ? 0.16 * this.duckScale : 0, now + 0.15);
  }

  /** 1 is the room as it is. Lower values quiet the bed for a letter. */
  duck(scale: number) {
    this.duckScale = scale;
    if (!this.master || !this.ctx) return;
    const now = this.ctx.currentTime;
    const target = this.enabled ? 0.16 * scale : 0;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(target, now + 0.6);
  }

  page() {
    if (!this.enabled || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  private stopBed() {
    for (const node of this.bedNodes) {
      try {
        if ("stop" in node && typeof node.stop === "function") {
          node.stop();
        }
        node.disconnect();
      } catch {
        // Already stopped.
      }
    }
    this.bedNodes = [];
  }

  private tone(frequency: number, type: OscillatorType, gainValue: number) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = gainValue;
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    this.bedNodes.push(osc, gain);
  }

  private noise(amount: number, frequency: number) {
    if (!this.ctx || !this.master) return;
    const length = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = frequency;
    const gain = this.ctx.createGain();
    gain.gain.value = amount;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start();
    this.bedNodes.push(source, filter, gain);
  }

  async playBed(bed: Bed) {
    await this.unlock();
    if (!this.ctx || !this.master) return;
    if (this.current === bed) return;
    this.stopBed();
    this.current = bed;
    if (bed === "none") return;

    if (bed === "gate") {
      this.noise(0.012, 420);
      this.tone(82, "sine", 0.02);
      this.tone(123, "sine", 0.008);
      return;
    }
    if (bed === "chemistry") {
      this.noise(0.045, 700);
      this.tone(98, "sine", 0.03);
      return;
    }
    if (bed === "physics") {
      this.tone(55, "sine", 0.04);
      this.tone(82.5, "triangle", 0.015);
      return;
    }
    if (bed === "mathematics") {
      this.tone(220, "sine", 0.02);
      this.tone(330, "sine", 0.012);
      return;
    }
    if (bed === "biology") {
      this.tone(110, "sine", 0.03);
      this.tone(164, "triangle", 0.015);
      this.noise(0.02, 400);
      return;
    }
    if (bed === "english") {
      this.noise(0.02, 500);
      this.tone(196, "sine", 0.02);
      return;
    }
    if (bed === "inner") {
      this.tone(174, "sine", 0.018);
      return;
    }
    this.tone(261.6, "sine", 0.02);
    this.tone(329.6, "sine", 0.014);
    this.tone(392, "sine", 0.012);
  }

  /** A short string, for a weight let go. */
  pluck() {
    if (!this.enabled || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(196, now);
    osc.frequency.exponentialRampToValueAtTime(98, now + 0.35);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.56);
  }

  /** A softer beat than the grade memory, for a change of flow. */
  pulse() {
    if (!this.enabled || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(72, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  /** A quiet heartbeat. Used in the grade 6 / 7 darkness. */
  thump() {
    if (!this.enabled || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(58, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /** A short monitor beep. Used once, after the heart has already been said. */
  beep() {
    if (!this.enabled || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(740, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  clink() {
    if (!this.enabled || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1680, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  ignite() {
    if (!this.enabled || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const length = Math.floor(this.ctx.sampleRate * 0.45);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.2);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(now);
    source.stop(now + 0.46);
  }

  dispose() {
    this.stopBed();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.current = "none";
  }
}
