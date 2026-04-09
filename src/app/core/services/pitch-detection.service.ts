import { Injectable, signal, computed, effect } from '@angular/core';
import { AudioService } from './audio.service';
import { DetectedNote, Note, ALL_NOTES_NAMES_ES, ALL_NOTES_NAMES_EN } from '../models/note.model';

/**
 * PitchDetectionService
 * Usa el algoritmo McLeod Pitch Method (MPM) para detectar la frecuencia
 * fundamental del audio capturado por AudioService.
 *
 * IMPORTANTE: Pitchy se importa dinámicamente para compatibilidad con
 * el bundle de Angular. Instalar: npm install pitchy
 */
@Injectable({ providedIn: 'root' })
export class PitchDetectionService {

  // ── Estado público ────────────────────────────────────────────
  readonly detectedNote = signal<DetectedNote | null>(null);
  readonly isDetecting = signal(false);

  /** Umbral mínimo de claridad para considerar válida la detección */
  readonly clarityThreshold = signal(0.90);

  /** Buffer de suavizado: evita flickering mostrando la nota más frecuente */
  private smoothingBuffer: string[] = [];
  private readonly SMOOTHING_SIZE = 12; // Aumentado de 4 a 12 para más estabilidad

  /** Persistencia de nota: mantiene la nota visible por más tiempo */
  private lastNote: DetectedNote | null = null;
  private noteHoldTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly NOTE_HOLD_DURATION_MS = 800; // Mantener nota visible por 800ms

  // ── Internos ──────────────────────────────────────────────────
  private pitchyModule: any = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private audioService: AudioService) {}

  // ── API Pública ───────────────────────────────────────────────

  async startDetection(): Promise<void> {
    if (this.isDetecting()) return;

    // Carga dinámica de Pitchy
    if (!this.pitchyModule) {
      try {
        this.pitchyModule = await import('pitchy');
      } catch {
        console.error('[PitchDetection] No se pudo cargar Pitchy. Ejecuta: npm install pitchy');
        return;
      }
    }

    this.isDetecting.set(true);
    this.smoothingBuffer = [];

    // Detectar cada 80ms (~12 veces por segundo) — suficiente para lira
    this.intervalId = setInterval(() => this._detect(), 80);
  }

  stopDetection(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.noteHoldTimeout !== null) {
      clearTimeout(this.noteHoldTimeout);
      this.noteHoldTimeout = null;
    }
    this.isDetecting.set(false);
    this.detectedNote.set(null);
    this.lastNote = null;
    this.smoothingBuffer = [];
  }

  // ── Internos ──────────────────────────────────────────────────

  private _detect(): void {
    if (!this.audioService.isListening() || !this.pitchyModule) return;

    const buffer = this.audioService.pcmBuffer;
    const sampleRate = this.audioService.sampleRate;

    try {
      const detector = this.pitchyModule.PitchDetector.forFloat32Array(buffer.length);
      const [frequency, clarity] = detector.findPitch(buffer, sampleRate);

      if (clarity < this.clarityThreshold() || frequency < 60 || frequency > 2000) {
        // Ruido o silencio: limpiar suavizado gradualmente
        if (this.smoothingBuffer.length > 0) {
          this.smoothingBuffer.shift();
        }
        // Si el buffer está vacío y hay una nota guardada, mantenerla temporalmente
        if (this.smoothingBuffer.length === 0 && this.lastNote) {
          // No limpiar la nota inmediatamente, dejar que el timeout la limpie
        } else if (this.smoothingBuffer.length === 0) {
          this.detectedNote.set(null);
        }
        return;
      }

      const note = this._frequencyToNote(frequency);
      const cents = this._getCents(frequency, note.frequency);

      // Suavizado: añadir al buffer y tomar la nota más frecuente
      const noteKey = `${note.name}${note.octave}`;
      this.smoothingBuffer.push(noteKey);
      if (this.smoothingBuffer.length > this.SMOOTHING_SIZE) {
        this.smoothingBuffer.shift();
      }

      const dominantKey = this._mostFrequent(this.smoothingBuffer);
      if (dominantKey !== noteKey) return; // No es la nota dominante aún

      const detectedNote: DetectedNote = {
        note,
        detectedFrequency: frequency,
        cents,
        clarity,
        timestamp: Date.now()
      };

      // Guardar la nota y actualizar inmediatamente
      this.lastNote = detectedNote;
      this.detectedNote.set(detectedNote);

      // Reiniciar el timeout de persistencia cada vez que detectamos la misma nota
      if (this.noteHoldTimeout !== null) {
        clearTimeout(this.noteHoldTimeout);
      }

      // Programar limpieza de la nota después del período de hold
      this.noteHoldTimeout = setTimeout(() => {
        // Solo limpiar si sigue siendo la misma nota (no ha llegado una nueva)
        if (this.lastNote === detectedNote) {
          this.detectedNote.set(null);
          this.lastNote = null;
        }
      }, this.NOTE_HOLD_DURATION_MS);

    } catch (err) {
      // Silenciar errores de buffer — ocurren normalmente al inicio
    }
  }

  /**
   * Convierte frecuencia Hz a objeto Note usando la fórmula MIDI.
   * MIDI = 69 + 12 * log2(freq / 440)
   */
  private _frequencyToNote(frequency: number): Note {
    const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;

    return {
      name: ALL_NOTES_NAMES_ES[noteIndex],
      nameEn: ALL_NOTES_NAMES_EN[noteIndex],
      octave,
      frequency: 440 * Math.pow(2, (midi - 69) / 12),
      midi,
      accidental: ALL_NOTES_NAMES_ES[noteIndex].includes('#') ? 'sharp' : null
    };
  }

  /**
   * Calcula desviación en cents entre la frecuencia detectada
   * y la frecuencia ideal de la nota.
   * 100 cents = 1 semitono. Rango: -50 a +50.
   */
  private _getCents(detectedFreq: number, idealFreq: number): number {
    return Math.round(1200 * Math.log2(detectedFreq / idealFreq));
  }

  private _mostFrequent(arr: string[]): string {
    const counts: Record<string, number> = {};
    let max = 0;
    let result = arr[0];
    for (const item of arr) {
      counts[item] = (counts[item] ?? 0) + 1;
      if (counts[item] > max) {
        max = counts[item];
        result = item;
      }
    }
    return result;
  }
}
