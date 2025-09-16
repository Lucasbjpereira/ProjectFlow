import { Routes } from '@angular/router';
import { AuthGuard, GuestGuard } from './core/guards';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [GuestGuard]
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'talent-pool',
        loadComponent: () => import('./features/talent-pool/talent-pool.component').then(m => m.TalentPoolComponent),
        data: { roles: ['admin', 'manager'] }
      },
      
      {
        path: 'workboard',
        loadComponent: () => import('./features/workboard/workboard.component').then(m => m.WorkboardComponent),
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent),
        data: { roles: ['admin', 'manager'] }
      },
      {
        path: 'client-dashboard',
        loadComponent: () => import('./features/client-dashboard/client-dashboard.component').then(m => m.ClientDashboardComponent),
        data: { roles: ['client', 'admin', 'user'] }
      },
      {
        path: 'financial',
        loadComponent: () => import('./features/financial/financial.component').then(m => m.FinancialComponent),
        data: { roles: ['admin', 'manager'] }
      },
      {
        path: 'allocation',
        loadComponent: () => import('./features/allocation/allocation.component').then(m => m.AllocationComponent),
        data: { roles: ['admin', 'manager'] }
      },
      {
        path: 'gamification',
        loadComponent: () => import('./features/gamification/gamification.component').then(m => m.GamificationComponent),
      },
      {
        path: 'knowledge-base',
        loadComponent: () => import('./features/knowledge-base/knowledge-base.component').then(m => m.KnowledgeBaseComponent),
      },
       {
        path: 'reports',
        loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent),
        data: { roles: ['admin', 'manager'] }
      },
      {
        path: 'clients/:id',
        loadComponent: () => import('./features/client-dashboard/client-dashboard.component').then(m => m.ClientDashboardComponent),
        data: { roles: ['client', 'admin', 'user'] }
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
