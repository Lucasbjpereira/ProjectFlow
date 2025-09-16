import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay, takeUntil } from 'rxjs/operators';
import { AuthService, ProjectService } from '../../../core/services';
import { User, Client } from '../../../core/models';
import { HeaderComponent } from '../header/header.component';
import { LogoComponent } from '../logo/logo.component';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  badge?: number;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    HeaderComponent,
    LogoComponent
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentUser$: Observable<User | null>;
  currentUser: User | null = null;
  isHandset$: Observable<boolean>;
  sidebarOpen = false;
  userMenuOpen = false;
  unreadNotifications = 3;
  clients$!: Observable<Client[]>;
  
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      roles: ['admin', 'user', 'client']
    },
    {
      label: 'Projetos',
      icon: 'folder_open',
      route: '/projects',
      roles: ['admin', 'user', 'client']
    },
    {
      label: 'Clientes',
      icon: 'group',
      route: '/client-dashboard',
      roles: ['admin', 'user', 'client']
    },
    {
      label: 'Relatórios',
      icon: 'assessment',
      route: '/reports',
      roles: ['admin', 'user', 'client']
    }
  ];

  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private router: Router,
    private projectService: ProjectService
  ) {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(
        map(result => result.matches),
        shareReplay()
      );
    
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
    });
    this.clients$ = this.projectService.getClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  canShowMenuItem(item: MenuItem): boolean {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    
    return this.authService.hasRole(item.roles);
  }

  closeDrawerOnMobile(): void {
    this.isHandset$.pipe(takeUntil(this.destroy$)).subscribe(isHandset => {
      if (isHandset) {
        // Fechar drawer em dispositivos móveis
      }
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  toggleNotifications(): void {
    // Implementar lógica de notificações
    console.log('Toggle notifications');
  }

  viewProfile(): void {
    this.userMenuOpen = false;
    this.router.navigate(['/profile']);
  }

  openSettings(): void {
    this.userMenuOpen = false;
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.userMenuOpen = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
