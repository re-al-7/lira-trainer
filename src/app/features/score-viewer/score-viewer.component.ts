import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ChangeDetectionStrategy, ViewChild, ElementRef, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScoreService } from '../../core/services/score.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { ListboxModule } from 'primeng/listbox';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-score-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterModule,
    CardModule, ButtonModule, FileUploadModule, ListboxModule,
    TagModule, ProgressSpinnerModule,
  ],
  templateUrl: './score-viewer.component.html',
  styleUrls: ['./score-viewer.component.scss'],
})
export class ScoreViewerComponent implements AfterViewInit, OnDestroy {

  @ViewChild('osmdContainer') osmdContainer!: ElementRef<HTMLDivElement>;

  private osmdInstance: any = null;

  constructor(public score: ScoreService) {}

  readonly builtInOptions = this.score.builtInScores.map(s => ({
    label: s.title,
    value: s.id
  }));

  readonly selectedBuiltIn = signal<string | null>(null);
  readonly pdfWarning = signal(false);

  readonly currentTitle = computed(() => this.score.currentScore()?.title ?? null);
  readonly noteCount = computed(() => this.score.currentScore()?.notes.length ?? 0);
  readonly isMidiScore = computed(() => {
    const s = this.score.currentScore();
    return s !== null && !s.musicXmlContent;
  });

  // ── Lifecycle ─────────────────────────────────────────────────

  ngAfterViewInit(): void {
    if (this.score.currentScore()?.musicXmlContent) {
      this._renderOsmd(this.score.currentScore()!.musicXmlContent!);
    }
  }

  ngOnDestroy(): void {
    this.osmdInstance = null;
  }

  // ── Acciones ──────────────────────────────────────────────────

  async onFileSelect(event: { files: File[] }): Promise<void> {
    const file = event.files?.[0];
    if (!file) return;

    this.pdfWarning.set(false);
    const ext = file.name.toLowerCase().split('.').pop();

    if (ext === 'pdf') {
      this.pdfWarning.set(true);
      return;
    }

    if (ext === 'mid' || ext === 'midi') {
      await this.score.loadFromMidiFile(file);
      return;
    }

    await this.score.loadFromFile(file);
    this._tryRenderOsmd();
  }

  async loadBuiltIn(id: string): Promise<void> {
    await this.score.loadBuiltIn(id);
    this._tryRenderOsmd();
  }

  clearScore(): void {
    this.score.clearScore();
    this.selectedBuiltIn.set(null);
    if (this.osmdContainer) {
      this.osmdContainer.nativeElement.innerHTML = '';
    }
    this.osmdInstance = null;
  }

  // ── OSMD ──────────────────────────────────────────────────────

  private async _tryRenderOsmd(): Promise<void> {
    const xml = this.score.currentScore()?.musicXmlContent;
    if (!xml || !this.osmdContainer) return;

    // Pequeño delay para que Angular actualice la vista
    setTimeout(() => this._renderOsmd(xml), 50);
  }

  private async _renderOsmd(xmlContent: string): Promise<void> {
    if (!this.osmdContainer) return;

    try {
      // Carga dinámica de OSMD para evitar problemas con SSR
      const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay');

      this.osmdContainer.nativeElement.innerHTML = '';
      this.osmdInstance = new OpenSheetMusicDisplay(this.osmdContainer.nativeElement, {
        autoResize: true,
        backend: 'svg',
        darkMode: true,
        drawTitle: true,
        drawComposer: true,
      });

      await this.osmdInstance.load(xmlContent);
      this.osmdInstance.render();

    } catch (err) {
      console.error('[ScoreViewer] Error al renderizar con OSMD:', err);
    }
  }
}
