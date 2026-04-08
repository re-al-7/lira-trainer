import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type FeedbackState = 'correct' | 'incorrect' | 'off-tune' | 'idle';

@Component({
  selector: 'app-feedback-indicator',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './feedback-indicator.component.scss',
  template: `
    <div class="feedback" [ngClass]="'feedback--' + state">
      <div class="feedback__icon">
        <i [class]="iconClass"></i>
      </div>
      <div class="feedback__message">{{ message }}</div>
      <div class="feedback__sub" *ngIf="subMessage">{{ subMessage }}</div>
    </div>
  `,
})
export class FeedbackIndicatorComponent {
  @Input() state: FeedbackState = 'idle';
  @Input() subMessage: string | null = null;

  get iconClass(): string {
    const icons: Record<FeedbackState, string> = {
      idle:      'pi pi-circle',
      correct:   'pi pi-check-circle',
      incorrect: 'pi pi-times-circle',
      'off-tune': 'pi pi-exclamation-triangle',
    };
    return icons[this.state];
  }

  get message(): string {
    const messages: Record<FeedbackState, string> = {
      idle:      'Esperando...',
      correct:   '¡Correcto!',
      incorrect: 'Nota incorrecta',
      'off-tune': 'Desafinado',
    };
    return messages[this.state];
  }
}
