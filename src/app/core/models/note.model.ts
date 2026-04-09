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

/**
 * Notas de la Lira Militar/Estándar (25-27 teclas)
 * 
 * Rango típico: Do5 (C5) a Do7/Re7 (C7/D7)
 * - 25 teclas: Do5 a Do7 (3 octavas diatónicas)
 * - 27 teclas: Do5 a Re7 (3 octavas + 2 notas)
 * 
 * AFINACIÓN: La4 = 440 Hz (estándar)
 * Las liras militares son instrumentos transpositores en Do (sonido real)
 */
export const LYRE_NOTES: Note[] = [
  // Octava 5 (Do5 a Si5) - 12 notas cromáticas
  { name: 'Do',  nameEn: 'C',  octave: 5, frequency: 523.25, midi: 72, accidental: null },
  { name: 'Do#', nameEn: 'C#', octave: 5, frequency: 554.37, midi: 73, accidental: 'sharp' },
  { name: 'Re',  nameEn: 'D',  octave: 5, frequency: 587.33, midi: 74, accidental: null },
  { name: 'Re#', nameEn: 'D#', octave: 5, frequency: 622.25, midi: 75, accidental: 'sharp' },
  { name: 'Mi',  nameEn: 'E',  octave: 5, frequency: 659.25, midi: 76, accidental: null },
  { name: 'Fa',  nameEn: 'F',  octave: 5, frequency: 698.46, midi: 77, accidental: null },
  { name: 'Fa#', nameEn: 'F#', octave: 5, frequency: 739.99, midi: 78, accidental: 'sharp' },
  { name: 'Sol', nameEn: 'G',  octave: 5, frequency: 783.99, midi: 79, accidental: null },
  { name: 'Sol#', nameEn: 'G#', octave: 5, frequency: 830.61, midi: 80, accidental: 'sharp' },
  { name: 'La',  nameEn: 'A',  octave: 5, frequency: 880.00, midi: 81, accidental: null },
  { name: 'La#', nameEn: 'A#', octave: 5, frequency: 932.33, midi: 82, accidental: 'sharp' },
  { name: 'Si',  nameEn: 'B',  octave: 5, frequency: 987.77, midi: 83, accidental: null },

  // Octava 6 (Do6 a Si6) - 12 notas cromáticas
  { name: 'Do',  nameEn: 'C',  octave: 6, frequency: 1046.50, midi: 84, accidental: null },
  { name: 'Do#', nameEn: 'C#', octave: 6, frequency: 1108.73, midi: 85, accidental: 'sharp' },
  { name: 'Re',  nameEn: 'D',  octave: 6, frequency: 1174.66, midi: 86, accidental: null },
  { name: 'Re#', nameEn: 'D#', octave: 6, frequency: 1244.51, midi: 87, accidental: 'sharp' },
  { name: 'Mi',  nameEn: 'E',  octave: 6, frequency: 1318.51, midi: 88, accidental: null },
  { name: 'Fa',  nameEn: 'F',  octave: 6, frequency: 1396.91, midi: 89, accidental: null },
  { name: 'Fa#', nameEn: 'F#', octave: 6, frequency: 1479.98, midi: 90, accidental: 'sharp' },
  { name: 'Sol', nameEn: 'G',  octave: 6, frequency: 1567.98, midi: 91, accidental: null },
  { name: 'Sol#', nameEn: 'G#', octave: 6, frequency: 1661.22, midi: 92, accidental: 'sharp' },
  { name: 'La',  nameEn: 'A',  octave: 6, frequency: 1760.00, midi: 93, accidental: null },
  { name: 'La#', nameEn: 'A#', octave: 6, frequency: 1864.66, midi: 94, accidental: 'sharp' },
  { name: 'Si',  nameEn: 'B',  octave: 6, frequency: 1975.53, midi: 95, accidental: null },

  // Octava 7 (Do7 a Re7) - 2-3 notas para lira de 25-27 teclas
  { name: 'Do',  nameEn: 'C',  octave: 7, frequency: 2093.00, midi: 96, accidental: null },
  { name: 'Do#', nameEn: 'C#', octave: 7, frequency: 2217.46, midi: 97, accidental: 'sharp' },
  { name: 'Re',  nameEn: 'D',  octave: 7, frequency: 2349.32, midi: 98, accidental: null },
];

/** Notas diatónicas de la lira (sin accidentales) para referencia visual */
export const LYRE_DIATONIC_NOTES: Note[] = LYRE_NOTES.filter(n => n.accidental === null);

/** Todas las notas cromáticas para el afinador */
export const ALL_NOTES_NAMES_ES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
export const ALL_NOTES_NAMES_EN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
