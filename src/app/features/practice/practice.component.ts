import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  computed, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AudioService } from '../../core/services/audio.service';
import { PitchDetectionService } from '../../core/services/pitch-detection.service';
import { ScoreService } from '../../core/services/score.service';
import { FeedbackIndicatorComponent, FeedbackState } from '../../shared/components/feedback-indicator/feedback-indicator.component';
import { NoteDisplayComponent } from '../../shared/components/note-display/note-display.component';
import { VolumeMeterComponent } from '../../shared/components/volume-meter/volume-meter.component';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { ScoreNote } from '../../core/models/score.model';

type PracticeState = 'idle' | 'playing' | 'paused' | 'finished';

@Component({
  selector: 'app-practice',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterModule,
    FeedbackIndicatorComponent, NoteDisplayComponent, VolumeMeterComponent,
    CardModule, ButtonModule, ProgressBarModule, TagModule, BadgeModule, DividerModule,
  ],
  templateUrl: './practice.component.html',
  styleUrls: ['./practice.component.scss'],
})
export class PracticeComponent implements OnInit, OnDestroy {

  // ── Estado ────────────────────────────────────────────────────
  readonly practiceState = signal<PracticeState>('idle');
  readonly currentIndex = signal(0);
  readonly correctCount = signal(0);
  readonly incorrectCount = signal(0);
  readonly feedback = signal<FeedbackState>('idle');
  readonly feedbackSub = signal<string | null>(null);

  /** Tiempo de bloqueo tras acierto para evitar detecciones dobles */
  private _blocked = false;
  private _detectionWatcher: ReturnType<typeof setInterval> | null = null;

  constructor(
    public audio: AudioService,
    public pitch: PitchDetectionService,
    public score: ScoreService,
  ) {}

  // ── Computados ────────────────────────────────────────────────

  readonly notes = computed(() => this.score.currentScore()?.notes ?? []);

  readonly currentNote = computed((): ScoreNote | null =>
    this.notes()[this.currentIndex()] ?? null
  );

  readonly progress = computed(() => {
    const total = this.notes().length;
    if (total === 0) return 0;
    return Math.round((this.currentIndex() / total) * 100);
  });

  readonly accuracy = computed(() => {
    const total = this.correctCount() + this.incorrectCount();
    if (total === 0) return 0;
    return Math.round((this.correctCount() / total) * 100);
  });

  readonly hasScore = computed(() => !!this.score.currentScore());

  // ── Lifecycle ─────────────────────────────────────────────────

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this._stopWatcher();
    this.pitch.stopDetection();
    this.audio.stopListening();
  }

  // ── Acciones ──────────────────────────────────────────────────

  async startPractice(): Promise<void> {
    this.currentIndex.set(0);
    this.correctCount.set(0);
    this.incorrectCount.set(0);
    this.feedback.set('idle');

    await this.audio.startListening();
    if (!this.audio.isListening()) return;
    await this.pitch.startDetection();

    this.practiceState.set('playing');
    this._startWatcher();
  }

  pausePractice(): void {
    if (this.practiceState() === 'playing') {
      this.practiceState.set('paused');
      this._stopWatcher();
    } else if (this.practiceState() === 'paused') {
      this.practiceState.set('playing');
      this._startWatcher();
    }
  }

  stopPractice(): void {
    this._stopWatcher();
    this.pitch.stopDetection();
    this.audio.stopListening();
    this.practiceState.set('idle');
    this.feedback.set('idle');
  }

  restartPractice(): void {
    this.stopPractice();
    setTimeout(() => this.startPractice(), 300);
  }

  // ── Lógica de comparación ──────────────────────────────────────

  private _startWatcher(): void {
    this._detectionWatcher = setInterval(() => this._checkNote(), 100);
  }

  private _stopWatcher(): void {
    if (this._detectionWatcher !== null) {
      clearInterval(this._detectionWatcher);
      this._detectionWatcher = null;
    }
  }

  private _checkNote(): void {
    if (this._blocked) return;
    const detected = this.pitch.detectedNote();
    if (!detected) return;

    const expected = this.currentNote();
    if (!expected || expected.isRest) {
      // Avanzar automáticamente en silencios
      this._advance();
      return;
    }

    const detectedName = detected.note.name.replace('#', '').split('')[0];
    const expectedName = expected.note.name.replace('#', '').split('')[0];
    const sameNote = detected.note.name === expected.note.name;
    const cents = Math.abs(detected.cents);

    if (sameNote && cents <= 25) {
      // ✅ CORRECTO
      this.correctCount.update(c => c + 1);
      this.feedback.set('correct');
      this.feedbackSub.set(null);
      this._blockAndAdvance(600);

    } else if (sameNote && cents > 25) {
      // ⚠️ DESAFINADO
      this.feedback.set('off-tune');
      this.feedbackSub.set(detected.cents > 0
        ? `Baja ${Math.round(detected.cents)}¢`
        : `Sube ${Math.round(Math.abs(detected.cents))}¢`
      );

    } else {
      // ❌ INCORRECTO
      this.incorrectCount.update(c => c + 1);
      this.feedback.set('incorrect');
      this.feedbackSub.set(`Toca: ${expected.note.name}${expected.note.octave}`);
      this._blockTemp(800);
    }
  }

  private _blockAndAdvance(ms: number): void {
    this._blocked = true;
    setTimeout(() => {
      this._advance();
      this._blocked = false;
    }, ms);
  }

  private _blockTemp(ms: number): void {
    this._blocked = true;
    setTimeout(() => { this._blocked = false; }, ms);
  }

  private _advance(): void {
    const next = this.currentIndex() + 1;
    if (next >= this.notes().length) {
      this._finish();
    } else {
      this.currentIndex.set(next);
      this.feedback.set('idle');
      this.feedbackSub.set(null);
    }
  }

  private _finish(): void {
    this._stopWatcher();
    this.pitch.stopDetection();
    this.audio.stopListening();
    this.practiceState.set('finished');
    this.feedback.set('idle');
  }
}
