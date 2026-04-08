import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tuner',
    pathMatch: 'full'
  },
  {
    path: 'tuner',
    loadComponent: () =>
      import('./features/tuner/tuner.component').then(m => m.TunerComponent),
    title: 'Afinador — Lira Trainer'
  },
  {
    path: 'practice',
    loadComponent: () =>
      import('./features/practice/practice.component').then(m => m.PracticeComponent),
    title: 'Práctica — Lira Trainer'
  },
  {
    path: 'scores',
    loadComponent: () =>
      import('./features/score-viewer/score-viewer.component').then(m => m.ScoreViewerComponent),
    title: 'Partituras — Lira Trainer'
  },
  {
    path: '**',
    redirectTo: 'tuner'
  }
];
