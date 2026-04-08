import { Injectable, OnDestroy, signal } from '@angular/core';

/**
 * AudioService
 * Maneja el acceso al micrófono via Web Audio API.
 * Expone un buffer PCM (Float32Array) actualizado en tiempo real
 * para que PitchDetectionService lo procese.
 */
@Injectable({ providedIn: 'root' })
export class AudioService implements OnDestroy {

  // ── Estado público (signals) ────────────────────────────────
  readonly isListening = signal(false);
  readonly volume = signal(0);         // 0-100
  readonly hasPermission = signal<boolean | null>(null); // null = no preguntado aún
  readonly error = signal<string | null>(null);

  // ── Internos ─────────────────────────────────────────────────
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;

  /** Buffer de muestras PCM para detección de pitch (tamaño potencia de 2) */
  private _pcmBuffer = new Float32Array(2048);

  /** Solo lectura para servicios externos */
  get pcmBuffer(): Float32Array {
    return this._pcmBuffer;
  }

  get sampleRate(): number {
    return this.audioContext?.sampleRate ?? 44100;
  }

  // ── API Pública ───────────────────────────────────────────────

  async startListening(): Promise<void> {
    if (this.isListening()) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });

      this.hasPermission.set(true);
      this.error.set(null);

      this.audioContext = new AudioContext();
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.5;

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.analyserNode);

      this.isListening.set(true);
      this._startReadLoop();

    } catch (err: unknown) {
      this.hasPermission.set(false);
      const msg = err instanceof Error ? err.message : 'Error al acceder al micrófono';
      this.error.set(msg);
      console.error('[AudioService] Error:', err);
    }
  }

  stopListening(): void {
    if (!this.isListening()) return;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.sourceNode?.disconnect();
    this.analyserNode?.disconnect();
    this.mediaStream?.getTracks().forEach(t => t.stop());
    this.audioContext?.close();

    this.sourceNode = null;
    this.analyserNode = null;
    this.mediaStream = null;
    this.audioContext = null;

    this.isListening.set(false);
    this.volume.set(0);
    this._pcmBuffer.fill(0);
  }

  // ── Internos ──────────────────────────────────────────────────

  private _startReadLoop(): void {
    const read = () => {
      if (!this.analyserNode) return;

      // Leer buffer PCM para pitch detection
      this.analyserNode.getFloatTimeDomainData(this._pcmBuffer);

      // Calcular volumen RMS para el VU meter
      let sumSquares = 0;
      for (const sample of this._pcmBuffer) {
        sumSquares += sample * sample;
      }
      const rms = Math.sqrt(sumSquares / this._pcmBuffer.length);
      this.volume.set(Math.min(100, Math.round(rms * 400)));

      this.animationFrameId = requestAnimationFrame(read);
    };

    this.animationFrameId = requestAnimationFrame(read);
  }

  ngOnDestroy(): void {
    this.stopListening();
  }
}
