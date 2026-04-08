import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Note } from '../../../core/models/note.model';

@Component({
  selector: 'app-note-display',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './note-display.component.scss',
  template: `
    <div class="note-display" [class.note-display--active]="note" [class.note-display--large]="size === 'large'">
      <div class="note-display__name animate-note-pop" *ngIf="note; else empty">
        <span class="note-display__label">{{ note.name }}</span>
        <span class="note-display__accidental" *ngIf="note.accidental">
          {{ note.accidental === 'sharp' ? '♯' : '♭' }}
        </span>
        <span class="note-display__octave" *ngIf="showOctave">{{ note.octave }}</span>
      </div>
      <ng-template #empty>
        <span class="note-display__empty">—</span>
      </ng-template>
      <div class="note-display__freq" *ngIf="note && showFrequency">
        {{ note.frequency | number:'1.1-1' }} Hz
      </div>
    </div>
  `,
})
export class NoteDisplayComponent {
  @Input() note: Note | null = null;
  @Input() size: 'normal' | 'large' = 'normal';
  @Input() showOctave = true;
  @Input() showFrequency = false;
}
