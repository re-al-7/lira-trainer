import { Note } from './note.model';

export interface ScoreNote {
  /** Nota musical */
  note: Note;
  /** Duración en beats (1 = negra, 0.5 = corchea, 2 = blanca, 4 = redonda) */
  duration: number;
  /** Posición en el tiempo (en beats desde el inicio) */
  position: number;
  /** Si es un silencio */
  isRest: boolean;
}

export interface Score {
  /** Título de la pieza */
  title: string;
  /** Compositor (opcional) */
  composer?: string;
  /** Tempo en BPM */
  bpm: number;
  /** Compás: numerador */
  timeSignatureNumerator: number;
  /** Compás: denominador */
  timeSignatureDenominator: number;
  /** Tonalidad (ej: 'C major', 'A minor') */
  key: string;
  /** Secuencia de notas */
  notes: ScoreNote[];
  /** Contenido MusicXML original (si se cargó desde archivo) */
  musicXmlContent?: string;
}

export interface PracticeSession {
  /** ID único de la sesión */
  id: string;
  /** Partitura practicada */
  scoreTitle: string;
  /** Fecha de inicio */
  startedAt: Date;
  /** Fecha de fin */
  finishedAt?: Date;
  /** Total de notas en la partitura */
  totalNotes: number;
  /** Notas correctas */
  correctNotes: number;
  /** Notas incorrectas */
  incorrectNotes: number;
  /** Porcentaje de acierto */
  accuracy: number;
}
