import { Injectable, signal } from '@angular/core';
import { Score, ScoreNote } from '../models/score.model';
import { Note, ALL_NOTES_NAMES_ES, ALL_NOTES_NAMES_EN } from '../models/note.model';

/**
 * ScoreService
 * Carga y parsea partituras en formato MusicXML.
 * Convierte el XML en un array de ScoreNote para el modo práctica.
 */
@Injectable({ providedIn: 'root' })
export class ScoreService {

  readonly currentScore = signal<Score | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  /** Catálogo de partituras de ejemplo integradas */
  readonly builtInScores: { id: string; title: string; filename: string }[] = [
    { id: 'mary', title: 'Mary Had a Little Lamb', filename: 'mary-had-a-little-lamb.xml' },
    { id: 'ode', title: 'Oda a la Alegría', filename: 'ode-to-joy.xml' },
    { id: 'twinkle', title: 'Twinkle Twinkle Little Star', filename: 'twinkle.xml' },
  ];

  // ── API Pública ───────────────────────────────────────────────

  async loadFromMidiFile(file: File): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const { Midi } = await import('@tonejs/midi');
      const buffer = await file.arrayBuffer();
      const midi = new Midi(buffer);
      const score = this._midiToScore(midi, file.name);
      this.currentScore.set(score);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar el archivo MIDI';
      this.error.set(msg);
      console.error('[ScoreService] MIDI Error:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadFromFile(file: File): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const content = await file.text();
      const score = this._parseMusicXml(content);
      score.musicXmlContent = content;
      this.currentScore.set(score);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar la partitura';
      this.error.set(msg);
      console.error('[ScoreService] Error:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadBuiltIn(id: string): Promise<void> {
    const found = this.builtInScores.find(s => s.id === id);
    if (!found) {
      this.error.set('Partitura no encontrada');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await fetch(`/assets/scores/${found.filename}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const content = await response.text();
      const score = this._parseMusicXml(content);
      score.musicXmlContent = content;
      this.currentScore.set(score);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar la partitura';
      this.error.set(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  clearScore(): void {
    this.currentScore.set(null);
    this.error.set(null);
  }

  // ── Parser MIDI ───────────────────────────────────────────────

  private _midiToScore(midi: any, filename: string): Score {
    const bpm = Math.round(midi.header.tempos[0]?.bpm ?? 120);
    const ts = midi.header.timeSignatures[0];

    const allNotes: ScoreNote[] = [];

    for (const track of midi.tracks) {
      for (const n of track.notes) {
        const note = this._midiNumberToNote(n.midi);
        const durationBeats = Math.max(0.25, Math.round(n.duration * (bpm / 60) * 4) / 4);
        const positionBeats = n.time * (bpm / 60);
        allNotes.push({ note, duration: durationBeats, position: positionBeats, isRest: false });
      }
    }

    allNotes.sort((a, b) => a.position - b.position);

    return {
      title: filename.replace(/\.(mid|midi)$/i, ''),
      bpm,
      timeSignatureNumerator: ts?.numerator ?? 4,
      timeSignatureDenominator: ts?.denominator ?? 4,
      key: 'Do mayor',
      notes: allNotes,
    };
  }

  private _midiNumberToNote(midiNumber: number): Note {
    const noteIndex = midiNumber % 12;
    const octave = Math.floor(midiNumber / 12) - 1;
    const rawEs = ALL_NOTES_NAMES_ES[noteIndex];
    const rawEn = ALL_NOTES_NAMES_EN[noteIndex];
    const isSharp = rawEs.includes('#');
    const frequency = 440 * Math.pow(2, (midiNumber - 69) / 12);

    return {
      name: rawEs.replace('#', ''),
      nameEn: rawEn.replace('#', ''),
      octave,
      frequency,
      midi: midiNumber,
      accidental: isSharp ? 'sharp' : null,
    };
  }

  // ── Parser MusicXML ───────────────────────────────────────────

  private _parseMusicXml(xmlContent: string): Score {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'application/xml');

    const parseError = doc.querySelector('parsererror');
    if (parseError) throw new Error('XML inválido: ' + parseError.textContent);

    // Metadatos
    const title = doc.querySelector('work-title, movement-title')?.textContent?.trim() ?? 'Sin título';
    const composer = doc.querySelector('creator[type="composer"]')?.textContent?.trim();

    // Tempo
    const bpmEl = doc.querySelector('sound[tempo]');
    const bpm = bpmEl ? parseInt(bpmEl.getAttribute('tempo') ?? '80') : 80;

    // Compás
    const beatsEl = doc.querySelector('beats');
    const beatTypeEl = doc.querySelector('beat-type');
    const timeNum = beatsEl ? parseInt(beatsEl.textContent ?? '4') : 4;
    const timeDen = beatTypeEl ? parseInt(beatTypeEl.textContent ?? '4') : 4;

    // Tonalidad
    const fifths = doc.querySelector('fifths');
    const mode = doc.querySelector('mode');
    const key = this._parseKey(
      fifths ? parseInt(fifths.textContent ?? '0') : 0,
      mode?.textContent ?? 'major'
    );

    // Notas
    const notes = this._parseNotes(doc);

    return { title, composer, bpm, timeSignatureNumerator: timeNum, timeSignatureDenominator: timeDen, key, notes };
  }

  private _parseNotes(doc: Document): ScoreNote[] {
    const result: ScoreNote[] = [];
    const noteElements = doc.querySelectorAll('note');
    let position = 0;

    noteElements.forEach(el => {
      const isRest = el.querySelector('rest') !== null;
      const durationEl = el.querySelector('duration');
      const duration = durationEl ? parseInt(durationEl.textContent ?? '4') / 4 : 1;

      if (isRest) {
        result.push({ note: this._silenceNote(), duration, position, isRest: true });
        position += duration;
        return;
      }

      const stepEl = el.querySelector('step');
      const octaveEl = el.querySelector('octave');
      const alterEl = el.querySelector('alter');

      if (!stepEl || !octaveEl) return;

      const step = stepEl.textContent?.trim() ?? 'C';
      const octave = parseInt(octaveEl.textContent ?? '4');
      const alter = alterEl ? parseFloat(alterEl.textContent ?? '0') : 0;

      const note = this._buildNote(step, octave, alter);
      result.push({ note, duration, position, isRest: false });
      position += duration;
    });

    return result;
  }

  private _buildNote(step: string, octave: number, alter: number): Note {
    const noteIndex = ALL_NOTES_NAMES_EN.indexOf(step);
    const semitoneOffset = alter > 0 ? 1 : alter < 0 ? -1 : 0;
    const adjustedIndex = (noteIndex + semitoneOffset + 12) % 12;
    const midi = (octave + 1) * 12 + noteIndex + Math.round(alter);
    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    const accidental = alter > 0 ? 'sharp' : alter < 0 ? 'flat' : null;

    return {
      name: ALL_NOTES_NAMES_ES[adjustedIndex],
      nameEn: ALL_NOTES_NAMES_EN[adjustedIndex],
      octave,
      frequency,
      midi,
      accidental: accidental as null | 'sharp' | 'flat'
    };
  }

  private _silenceNote(): Note {
    return { name: '—', nameEn: 'rest', octave: 0, frequency: 0, midi: -1, accidental: null };
  }

  private _parseKey(fifths: number, mode: string): string {
    const majorKeys = ['Do', 'Sol', 'Re', 'La', 'Mi', 'Si', 'Fa#', 'Do#'];
    const minorKeys = ['La', 'Mi', 'Si', 'Fa#', 'Do#', 'Sol#', 'Re#', 'La#'];
    const flatMajor = ['Do', 'Fa', 'Sib', 'Mib', 'Lab', 'Reb', 'Solb'];
    const flatMinor = ['La', 'Re', 'Sol', 'Do', 'Fa', 'Sib', 'Mib'];

    if (fifths >= 0) {
      const key = mode === 'minor' ? minorKeys[fifths] : majorKeys[fifths];
      return `${key} ${mode === 'minor' ? 'menor' : 'mayor'}`;
    } else {
      const idx = Math.abs(fifths);
      const key = mode === 'minor' ? flatMinor[idx] : flatMajor[idx];
      return `${key} ${mode === 'minor' ? 'menor' : 'mayor'}`;
    }
  }
}
