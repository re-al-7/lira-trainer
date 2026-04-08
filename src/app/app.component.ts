import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MenubarModule, ButtonModule, BadgeModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  readonly navItems = [
    { label: 'Afinador',    route: '/tuner',    icon: 'pi pi-microphone' },
    { label: 'Partituras',  route: '/scores',   icon: 'pi pi-file-edit'  },
    { label: 'Práctica',    route: '/practice', icon: 'pi pi-play-circle' },
  ];
}
