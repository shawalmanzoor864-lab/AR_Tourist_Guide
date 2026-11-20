import { ModuleId, VoiceLanguage } from '../data/tourData';

export interface VoiceStateCallbacks {
  onStart: () => void;
  onEnd: () => void;
  onAmplitude: (amp: number) => void;
  onProgress: (ratio: number) => void;
  /** Optional: current playback time in seconds (recorded audio only) */
  onTime?: (seconds: number) => void;
}

class VoiceOverEngine {
  private audioCtx: AudioContext | null = null;
  private customAudio: HTMLAudioElement | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;
  private freqBuffer: Uint8Array<ArrayBuffer> | null = null;
  private animTimer: number | null = null;
  private cadenceTimer: number | null = null;
  private speaking = false;
  private lastBoundaryTime = 0;
  private currentCallbacks: VoiceStateCallbacks | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private fallbackStartTime = 0;
  private fallbackDurationMs = 12000;

  private ensureAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        this.audioCtx = new Ctx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /** Plays a gentle cultural chime using Web Audio API (zero external mp3 files) */
  public playSelectionChime(module: ModuleId): void {
    try {
      const ctx = this.ensureAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Mughal modal warmth vs Japanese Hirajoshi pentatonic chime
      const notes =
        module === 'lahore-fort' ? [293.66, 369.99, 440.0, 587.33] : [329.63, 349.23, 493.88, 659.25];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = module === 'lahore-fort' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.055);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.045, now + idx * 0.055 + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.055 + 0.42);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.055);
        osc.stop(now + idx * 0.055 + 0.45);
      });
    } catch {
      // Ignore Web Audio errors on restricted autoplay contexts
    }
  }

  public stop(): void {
    this.speaking = false;

    if (this.animTimer !== null) {
      window.clearInterval(this.animTimer);
      this.animTimer = null;
    }
    if (this.cadenceTimer !== null) {
      window.clearInterval(this.cadenceTimer);
      this.cadenceTimer = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.activeUtterance = null;

    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio.currentTime = 0;
    }

    this.currentCallbacks?.onAmplitude(0);
    this.currentCallbacks?.onProgress(0);
    this.currentCallbacks?.onEnd();
    this.currentCallbacks = null;
  }

  private pickVoice(lang: VoiceLanguage): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    if (lang === 'ja') {
      return (
        voices.find((v) => v.lang.toLowerCase().startsWith('ja')) ??
        voices.find((v) => v.lang.toLowerCase().startsWith('en')) ??
        voices[0]
      );
    }

    if (lang === 'ur') {
      return (
        voices.find((v) => v.lang.toLowerCase().startsWith('ur')) ??
        voices.find((v) => v.lang.toLowerCase().includes('in')) ??
        voices.find((v) => v.lang.toLowerCase().startsWith('en-gb')) ??
        voices[0]
      );
    }

    return (
      voices.find((v) => /natural|daniel|samantha|google uk english male|google us english/i.test(v.name)) ??
      voices.find((v) => v.lang.toLowerCase().startsWith('en')) ??
      voices[0]
    );
  }

  /** Play custom user-uploaded audio file with live Web Audio amplitude lip-sync */
  public speakCustomAudio(audioUrl: string, callbacks: VoiceStateCallbacks): void {
    this.stop();
    this.currentCallbacks = callbacks;
    this.speaking = true;

    const ctx = this.ensureAudioContext();
    if (!this.customAudio) {
      this.customAudio = new Audio();
      this.customAudio.crossOrigin = 'anonymous';
    }

    this.customAudio.src = audioUrl;

    if (ctx && !this.mediaSource) {
      try {
        this.mediaSource = ctx.createMediaElementSource(this.customAudio);
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 64;
        this.freqBuffer = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
        this.mediaSource.connect(this.analyser);
        this.analyser.connect(ctx.destination);
      } catch {
        this.analyser = null;
      }
    }

    this.customAudio.onplay = () => {
      callbacks.onStart();
    };

    this.customAudio.onended = () => {
      this.stop();
    };

    this.customAudio.onerror = () => {
      this.stop();
    };

    void this.customAudio.play().catch(() => {
      this.stop();
    });

    this.animTimer = window.setInterval(() => {
      if (!this.speaking || !this.customAudio) return;
      let amp = 0.35;
      if (this.analyser && this.freqBuffer) {
        this.analyser.getByteFrequencyData(this.freqBuffer);
        let sum = 0;
        for (let i = 0; i < 12; i++) {
          sum += this.freqBuffer[i] ?? 0;
        }
        amp = Math.min(1, sum / (12 * 140));
      }
      callbacks.onAmplitude(amp);
      callbacks.onTime?.(this.customAudio.currentTime);
      if (this.customAudio.duration > 0) {
        callbacks.onProgress(Math.min(1, this.customAudio.currentTime / this.customAudio.duration));
      }
    }, 50);
  }

  /** Speak text using Web Speech API with lip-sync amplitude modulation */
  public speakText(
    text: string,
    lang: VoiceLanguage,
    rate: number,
    callbacks: VoiceStateCallbacks,
  ): void {
    this.stop();
    this.currentCallbacks = callbacks;
    this.speaking = true;
    this.fallbackStartTime = performance.now();
    this.fallbackDurationMs = Math.max(4000, (text.split(/\s+/).length / (2.5 * rate)) * 1000);

    const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;
    if (!hasSpeech) {
      this.startSimulatedCadence(callbacks);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    this.activeUtterance = utterance;
    utterance.rate = rate;
    utterance.pitch = lang === 'ja' ? 1.02 : 0.96;

    const voice = this.pickVoice(lang);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = lang === 'ja' ? 'ja-JP' : lang === 'ur' ? 'ur-PK' : 'en-US';
    }

    utterance.onstart = () => {
      callbacks.onStart();
    };

    utterance.onboundary = (event) => {
      this.lastBoundaryTime = performance.now();
      if (text.length > 0) {
        callbacks.onProgress(Math.min(1, (event.charIndex + 8) / text.length));
      }
    };

    utterance.onend = () => {
      if (this.activeUtterance === utterance) {
        this.stop();
      }
    };

    utterance.onerror = () => {
      // Fallback gracefully if headless sandbox lacks TTS voices
      if (this.speaking && this.activeUtterance === utterance) {
        this.startSimulatedCadence(callbacks);
      }
    };

    callbacks.onStart();
    window.speechSynthesis.speak(utterance);

    // Lip-sync cadence loop: uses boundary events when available + natural syllable envelope
    this.cadenceTimer = window.setInterval(() => {
      if (!this.speaking) return;
      const now = performance.now();
      const sinceBoundary = now - this.lastBoundaryTime;
      const t = now * 0.015;
      const syllableWave = Math.max(
        0.1,
        Math.abs(Math.sin(t) * 0.65 + Math.sin(t * 2.3) * 0.35),
      );
      const boundaryBoost = sinceBoundary < 180 ? 1.0 : 0.72;
      callbacks.onAmplitude(Math.min(1, syllableWave * boundaryBoost));

      const elapsed = now - this.fallbackStartTime;
      const estRatio = Math.min(0.98, elapsed / this.fallbackDurationMs);
      callbacks.onProgress(estRatio);
    }, 50);
  }

  private startSimulatedCadence(callbacks: VoiceStateCallbacks): void {
    callbacks.onStart();
    if (this.cadenceTimer !== null) {
      window.clearInterval(this.cadenceTimer);
    }
    this.cadenceTimer = window.setInterval(() => {
      if (!this.speaking) return;
      const elapsed = performance.now() - this.fallbackStartTime;
      const ratio = elapsed / this.fallbackDurationMs;
      if (ratio >= 1) {
        this.stop();
        return;
      }
      const t = performance.now() * 0.016;
      const amp = Math.max(0.15, Math.abs(Math.sin(t) * 0.7 + Math.cos(t * 2.1) * 0.3));
      callbacks.onAmplitude(Math.min(1, amp));
      callbacks.onProgress(ratio);
    }, 50);
  }

  public isSpeaking(): boolean {
    return this.speaking;
  }
}

export const voiceEngine = new VoiceOverEngine();