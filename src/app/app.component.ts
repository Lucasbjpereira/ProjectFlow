import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { LayoutComponent } from './shared/components/layout/layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LayoutComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'project-flow';
  showLayout = true;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        // Não mostrar layout nas rotas de autenticação
        const navigationEnd = event as NavigationEnd;
        this.showLayout = !navigationEnd.url.includes('/login') && !navigationEnd.url.includes('/client-dashboard');
      });

    // Verificar rota inicial
    this.showLayout = !this.router.url.includes('/login');
  }
}
