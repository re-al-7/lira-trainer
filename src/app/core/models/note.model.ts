// ─────────────────────────────────────────────
// Note Model
// ─────────────────────────────────────────────

export interface Note {
  /** Nombre de la nota: Do, Re, Mi, Fa, Sol, La, Si */
  name: string;
  /** Nombre en notación anglosajona: C, D, E, F, G, A, B */
  nameEn: string;
  /** Octava (4 = octava central) */
  octave: number;
  /** Frecuencia fundamental en Hz */
  frequency: number;
  /** Número MIDI (60 = Do4) */
  midi: number;
  /** Alteración: null, 'sharp' (#), 'flat' (b) */
  accidental: null | 'sharp' | 'flat';
}

export interface DetectedNote {
  /** Nota detectada */
  note: Note;
  /** Frecuencia real detectada por el micrófono */
  detectedFrequency: number;
  /** Desviación en cents respecto a la nota ideal (-50 a +50) */
  cents: number;
  /** Claridad de la detección (0-1). Solo usar si > 0.9 */
  clarity: number;
  /** Timestamp de la detección */
  timestamp: number;
}

// ─────────────────────────────────────────────
// Tablas de Referencia
// ─────────────────────────────────────────────

/** Notas de la lira diatónica en Do mayor (Do4 a Si5) */
export const LYRE_NOTES: Note[] = [
  { name: 'Do',  nameEn: 'C',  octave: 4, frequency: 261.63, midi: 60, accidental: null },
  { name: 'Re',  nameEn: 'D',  octave: 4, frequency: 293.66, midi: 62, accidental: null },
  { name: 'Mi',  nameEn: 'E',  octave: 4, frequency: 329.63, midi: 64, accidental: null },
  { name: 'Fa',  nameEn: 'F',  octave: 4, frequency: 349.23, midi: 65, accidental: null },
  { name: 'Sol', nameEn: 'G',  octave: 4, frequency: 392.00, midi: 67, accidental: null },
  { name: 'La',  nameEn: 'A',  octave: 4, frequency: 440.00, midi: 69, accidental: null },
  { name: 'Si',  nameEn: 'B',  octave: 4, frequency: 493.88, midi: 71, accidental: null },
  { name: 'Do',  nameEn: 'C',  octave: 5, frequency: 523.25, midi: 72, accidental: null },
  { name: 'Re',  nameEn: 'D',  octave: 5, frequency: 587.33, midi: 74, accidental: null },
  { name: 'Mi',  nameEn: 'E',  octave: 5, frequency: 659.25, midi: 76, accidental: null },
  { name: 'Fa',  nameEn: 'F',  octave: 5, frequency: 698.46, midi: 77, accidental: null },
  { name: 'Sol', nameEn: 'G',  octave: 5, frequency: 783.99, midi: 79, accidental: null },
  { name: 'La',  nameEn: 'A',  octave: 5, frequency: 880.00, midi: 81, accidental: null },
  { name: 'Si',  nameEn: 'B',  octave: 5, frequency: 987.77, midi: 83, accidental: null },
];

/** Todas las notas cromáticas para el afinador */
export const ALL_NOTES_NAMES_ES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
export const ALL_NOTES_NAMES_EN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
