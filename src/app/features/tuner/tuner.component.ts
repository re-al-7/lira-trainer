import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, computed, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../core/services/audio.service';
import { PitchDetectionService } from '../../core/services/pitch-detection.service';
import { LYRE_DIATONIC_NOTES } from '../../core/models/note.model';
import { NoteDisplayComponent } from '../../shared/components/note-display/note-display.component';
import { VolumeMeterComponent } from '../../shared/components/volume-meter/volume-meter.component';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { KnobModule } from 'primeng/knob';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tuner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NoteDisplayComponent, VolumeMeterComponent,
    CardModule, ButtonModule, KnobModule, BadgeModule, TagModule, TooltipModule,
  ],
  templateUrl: './tuner.component.html',
  styleUrls: ['./tuner.component.scss'],
})
export class TunerComponent implements OnInit, OnDestroy {

  // Notas diatónicas de la lira (Do5 a Re7) para referencia visual
  readonly lyreNotes = LYRE_DIATONIC_NOTES.map(n => `${n.name}${n.octave}`);

  constructor(
    public audio: AudioService,
    public pitch: PitchDetectionService,
  ) {}

  // ── Computados ────────────────────────────────────────────────

  /** Cents desviación: 0 = perfectamente afinado */
  readonly cents = computed(() => this.pitch.detectedNote()?.cents ?? 0);

  /** Valor para el knob: 0-100 (50 = centro = afinado) */
  readonly knobValue = computed(() => {
    const c = this.cents();
    return Math.max(0, Math.min(100, 50 + c));
  });

  /** Color del indicador según desviación */
  readonly tuningStatus = computed((): 'perfect' | 'close' | 'off' => {
    const c = Math.abs(this.cents());
    if (c <= 8)  return 'perfect';
    if (c <= 20) return 'close';
    return 'off';
  });

  readonly tuningLabel = computed(() => {
    const status = this.tuningStatus();
    if (status === 'perfect') return '✓ Afinado';
    const c = this.cents();
    if (c > 0) return `+${c}¢ Demasiado agudo`;
    return `${c}¢ Demasiado grave`;
  });

  readonly tuningTagSeverity = computed((): 'success' | 'warning' | 'danger' => {
    const s = this.tuningStatus();
    if (s === 'perfect') return 'success';
    if (s === 'close')   return 'warning';
    return 'danger';
  });

  // ── Lifecycle ─────────────────────────────────────────────────

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.pitch.stopDetection();
    this.audio.stopListening();
  }

  // ── Acciones ──────────────────────────────────────────────────

  async toggleMic(): Promise<void> {
    if (this.audio.isListening()) {
      this.pitch.stopDetection();
      this.audio.stopListening();
    } else {
      await this.audio.startListening();
      if (this.audio.isListening()) {
        await this.pitch.startDetection();
      }
    }
  }

  /** Verifica si la nota pasada está actualmente activa */
  isActiveNote(noteLabel: string): boolean {
    const detected = this.pitch.detectedNote();
    if (!detected) return false;
    const detectedLabel = `${detected.note.name}${detected.note.octave}`;
    return detectedLabel === noteLabel;
  }
}
