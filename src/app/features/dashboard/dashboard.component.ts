import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { Subject, Observable, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { DashboardService } from '../../core/services/dashboard.service';
import { ProjectService } from '../../core/services/project.service';
import { TaskService } from '../../core/services/task.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { 
  DashboardMetrics, 
  Project, 
  Task, 
  User,
  ChartData 
} from '../../core/models';

Chart.register(...registerables);

interface MetricCard {
  title: string;
  value: number | string;
  subtitle: string;
  icon: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  route?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTabsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  @ViewChild('projectStatusChart') projectStatusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyHoursChart') monthlyHoursChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('teamUtilizationChart') teamUtilizationChartRef!: ElementRef<HTMLCanvasElement>;
  
  currentUser$: Observable<User | null>;
  metrics$: Observable<DashboardMetrics>;
  
  metricCards: MetricCard[] = [];
  recentActivities: any[] = [];
  
  private charts: { [key: string]: Chart } = {};

  constructor(
    private dashboardService: DashboardService,
    private projectService: ProjectService,
    private taskService: TaskService,
    private userService: UserService,
    private authService: AuthService
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.metrics$ = this.dashboardService.getDashboardMetrics();
  }

  ngOnInit(): void {
    this.loadDashboardData();
    this.setupMetricCards();
    this.loadRecentActivities();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Destruir charts
    Object.values(this.charts).forEach(chart => chart.destroy());
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  private loadDashboardData(): void {
    // Carregar dados dos serviços
    combineLatest([
      this.projectService.getProjects(),
      this.taskService.getTasks(),
      this.userService.getUsers()
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([projects, tasks, users]) => {
      // Dados carregados, charts serão atualizados automaticamente
    });
  }

  private setupMetricCards(): void {
    this.metrics$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(metrics => {
      this.metricCards = [
        {
          title: 'Projetos Ativos',
          value: metrics.activeProjects,
          subtitle: `${metrics.totalProjects} total`,
          icon: 'folder',
          color: 'primary',
          trend: { value: 12, isPositive: true },
          route: '/projects'
        },
        {
          title: 'Tarefas Pendentes',
          value: metrics.pendingTasks,
          subtitle: `${metrics.totalTasks} total`,
          icon: 'assignment',
          color: 'warning',
          trend: { value: 5, isPositive: false },
          route: '/workboard'
        },
        {
          title: 'Consultores Ativos',
          value: metrics.availableConsultants,
          subtitle: 'Disponíveis',
          icon: 'people',
          color: 'primary',
          route: '/talent-pool'
        },
        {
          title: 'Horas Trabalhadas',
          value: `${metrics.monthlyHours}h`,
          subtitle: 'Este mês',
          icon: 'schedule',
          color: 'info',
          trend: { value: 15, isPositive: true }
        },
        {
          title: 'Receita Mensal',
          value: `R$ ${metrics.totalRevenue.toLocaleString()}`,
          subtitle: 'Este mês',
          icon: 'attach_money',
          color: 'accent',
          trend: { value: 22, isPositive: true },
          route: '/financial'
        },
        {
          title: 'Taxa de Utilização',
          value: `${Math.round((metrics.busyConsultants / metrics.totalConsultants) * 100)}%`,
          subtitle: 'Média da equipe',
          icon: 'trending_up',
          color: 'primary'
        }
      ];
    });
  }

  private loadRecentActivities(): void {
    this.recentActivities = [
      {
        type: 'project',
        icon: 'folder',
        title: 'Novo projeto criado',
        description: 'Sistema de E-commerce - Cliente ABC',
        time: '2 horas atrás'
      },
      {
        type: 'task',
        icon: 'assignment',
        title: 'Tarefa concluída',
        description: 'Implementação do módulo de pagamentos',
        time: '4 horas atrás'
      },
      {
        type: 'user',
        icon: 'person_add',
        title: 'Novo consultor adicionado',
        description: 'Maria Silva - Desenvolvedora Frontend',
        time: '1 dia atrás'
      },
      {
        type: 'financial',
        icon: 'attach_money',
        title: 'Fatura enviada',
        description: 'Fatura #2024-001 - R$ 15.000,00',
        time: '2 dias atrás'
      }
    ];
  }

  private initializeCharts(): void {
    this.createProjectStatusChart();
    this.createMonthlyHoursChart();
    this.createRevenueChart();
    this.createTeamUtilizationChart();
  }

  private createProjectStatusChart(): void {
    this.dashboardService.getProjectStatusChart().subscribe(data => {
      const ctx = this.projectStatusChartRef.nativeElement.getContext('2d');
      if (ctx) {
        this.charts['projectStatus'] = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: data.map((item: any) => item.name),
            datasets: [{
              data: data.map((item: any) => item.value),
              backgroundColor: ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#6B7280'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }
    });
  }

  private createMonthlyHoursChart(): void {
    this.dashboardService.getMonthlyHoursChart().subscribe(data => {
      const ctx = this.monthlyHoursChartRef.nativeElement.getContext('2d');
      if (ctx) {
        this.charts['monthlyHours'] = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.map((item: any) => item.month),
            datasets: [{
              label: 'Horas Trabalhadas',
              data: data.map((item: any) => item.hours),
              borderColor: '#2563EB',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    });
  }

  private createRevenueChart(): void {
    this.dashboardService.getRevenueChart().subscribe(data => {
      const ctx = this.revenueChartRef.nativeElement.getContext('2d');
      if (ctx) {
        this.charts['revenue'] = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: data.map((item: any) => item.month),
            datasets: [{
              label: 'Receita (R$)',
              data: data.map((item: any) => item.revenue),
              backgroundColor: '#10B981',
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    });
  }

  private createTeamUtilizationChart(): void {
    this.dashboardService.getTeamUtilizationChart().subscribe(data => {
      const ctx = this.teamUtilizationChartRef.nativeElement.getContext('2d');
      if (ctx) {
        this.charts['teamUtilization'] = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: data.map((item: any) => item.name),
            datasets: [{
              label: 'Utilização (%)',
              data: data.map((item: any) => item.utilization),
              backgroundColor: '#F59E0B',
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              x: {
                beginAtZero: true,
                max: 100
              }
            }
          }
        });
      }
    });
  }
}