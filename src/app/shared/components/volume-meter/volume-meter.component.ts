import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-volume-meter',
  standalone: true,
  imports: [CommonModule, ProgressBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './volume-meter.component.scss',
  template: `
    <div class="volume-meter">
      <span class="volume-meter__icon pi pi-microphone"></span>
      <div class="volume-meter__bar">
        <p-progressBar
          [value]="volume"
          [showValue]="false"
          styleClass="volume-bar"
          [ngClass]="volumeClass">
        </p-progressBar>
      </div>
      <span class="volume-meter__label">{{ volume }}%</span>
    </div>
  `,
})
export class VolumeMeterComponent {
  @Input() volume = 0;

  get volumeClass(): string {
    if (this.volume > 90) return 'volume-clipping';
    if (this.volume > 70) return 'volume-high';
    return '';
  }
}
