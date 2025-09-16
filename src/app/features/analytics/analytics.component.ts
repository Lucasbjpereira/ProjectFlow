import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

export interface AnalyticsData {
  productivity: ProductivityMetrics;
  timeTracking: TimeTrackingData;
  projectProgress: ProjectProgressData;
  teamPerformance: TeamPerformanceData;
  financialMetrics: FinancialMetrics;
}

export interface ProductivityMetrics {
  tasksCompleted: number;
  averageCompletionTime: number;
  efficiencyScore: number;
  burndownRate: number;
  velocityTrend: number[];
}

export interface TimeTrackingData {
  totalHours: number;
  billableHours: number;
  overtimeHours: number;
  dailyHours: { date: string; hours: number }[];
  projectHours: { project: string; hours: number }[];
}

export interface ProjectProgressData {
  onTrack: number;
  delayed: number;
  completed: number;
  cancelled: number;
  milestoneCompletion: { milestone: string; completion: number }[];
}

export interface TeamPerformanceData {
  memberStats: { name: string; tasksCompleted: number; hoursLogged: number; efficiency: number }[];
  collaborationScore: number;
  knowledgeSharing: number;
}

export interface FinancialMetrics {
  revenue: number;
  costs: number;
  profit: number;
  profitMargin: number;
  revenueByProject: { project: string; revenue: number }[];
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatTableModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('productivityChart', { static: false }) productivityChartRef!: ElementRef;
  @ViewChild('timeChart', { static: false }) timeChartRef!: ElementRef;
  @ViewChild('projectChart', { static: false }) projectChartRef!: ElementRef;
  @ViewChild('teamChart', { static: false }) teamChartRef!: ElementRef;
  @ViewChild('financialChart', { static: false }) financialChartRef!: ElementRef;
  @ViewChild('burndownChart', { static: false }) burndownChartRef!: ElementRef;

  private destroy$ = new Subject<void>();
  private charts: Chart[] = [];

  // Forms
  filterForm: FormGroup;

  // Data
  analyticsData: AnalyticsData = {
    productivity: {
      tasksCompleted: 0,
      averageCompletionTime: 0,
      efficiencyScore: 0,
      burndownRate: 0,
      velocityTrend: []
    },
    timeTracking: {
      totalHours: 0,
      billableHours: 0,
      overtimeHours: 0,
      dailyHours: [],
      projectHours: []
    },
    projectProgress: {
      onTrack: 0,
      delayed: 0,
      completed: 0,
      cancelled: 0,
      milestoneCompletion: []
    },
    teamPerformance: {
      memberStats: [],
      collaborationScore: 0,
      knowledgeSharing: 0
    },
    financialMetrics: {
      revenue: 0,
      costs: 0,
      profit: 0,
      profitMargin: 0,
      revenueByProject: []
    }
  };

  // Filters
  dateRanges = [
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 3 meses' },
    { value: '1y', label: 'Último ano' },
    { value: 'custom', label: 'Período personalizado' }
  ];

  projects = ['ProjectFlow', 'Website Redesign', 'Mobile App', 'API Integration'];
  teams = ['Frontend', 'Backend', 'Design', 'QA'];

  // Table columns
  teamColumns: string[] = ['name', 'tasksCompleted', 'hoursLogged', 'efficiency', 'actions'];
  projectColumns: string[] = ['project', 'revenue', 'costs', 'profit', 'margin'];

  // Summary metrics
  summaryMetrics = {
    totalProjects: 0,
    activeProjects: 0,
    teamMembers: 0,
    totalRevenue: 0,
    avgEfficiency: 0,
    completionRate: 0
  };

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      dateRange: ['30d'],
      startDate: [''],
      endDate: [''],
      projects: [[]],
      teams: [[]]
    });
  }

  ngOnInit(): void {
    this.loadAnalyticsData();
    this.setupFilters();
    this.calculateSummaryMetrics();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  // Data Loading
  loadAnalyticsData(): void {
    // Simulate loading analytics data
    this.generateMockAnalyticsData();
  }

  generateMockAnalyticsData(): void {
    // Productivity Metrics
    this.analyticsData.productivity = {
      tasksCompleted: 156,
      averageCompletionTime: 2.5,
      efficiencyScore: 87,
      burndownRate: 12,
      velocityTrend: [8, 12, 15, 18, 22, 19, 25, 28, 24, 30]
    };

    // Time Tracking
    this.analyticsData.timeTracking = {
      totalHours: 320,
      billableHours: 280,
      overtimeHours: 15,
      dailyHours: this.generateDailyHours(),
      projectHours: [
        { project: 'ProjectFlow', hours: 120 },
        { project: 'Website Redesign', hours: 80 },
        { project: 'Mobile App', hours: 70 },
        { project: 'API Integration', hours: 50 }
      ]
    };

    // Project Progress
    this.analyticsData.projectProgress = {
      onTrack: 8,
      delayed: 3,
      completed: 12,
      cancelled: 1,
      milestoneCompletion: [
        { milestone: 'Planning', completion: 100 },
        { milestone: 'Development', completion: 75 },
        { milestone: 'Testing', completion: 45 },
        { milestone: 'Deployment', completion: 20 }
      ]
    };

    // Team Performance
    this.analyticsData.teamPerformance = {
      memberStats: [
        { name: 'João Silva', tasksCompleted: 45, hoursLogged: 120, efficiency: 92 },
        { name: 'Maria Santos', tasksCompleted: 38, hoursLogged: 110, efficiency: 88 },
        { name: 'Pedro Costa', tasksCompleted: 42, hoursLogged: 115, efficiency: 85 },
        { name: 'Ana Oliveira', tasksCompleted: 31, hoursLogged: 95, efficiency: 90 }
      ],
      collaborationScore: 85,
      knowledgeSharing: 78
    };

    // Financial Metrics
    this.analyticsData.financialMetrics = {
      revenue: 125000,
      costs: 85000,
      profit: 40000,
      profitMargin: 32,
      revenueByProject: [
        { project: 'ProjectFlow', revenue: 45000 },
        { project: 'Website Redesign', revenue: 35000 },
        { project: 'Mobile App', revenue: 30000 },
        { project: 'API Integration', revenue: 15000 }
      ]
    };
  }

  generateDailyHours(): { date: string; hours: number }[] {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        hours: Math.floor(Math.random() * 4) + 6 // 6-10 hours
      });
    }
    
    return data;
  }

  // Charts
  initializeCharts(): void {
    this.createProductivityChart();
    this.createTimeTrackingChart();
    this.createProjectProgressChart();
    this.createTeamPerformanceChart();
    this.createFinancialChart();
    this.createBurndownChart();
  }

  createProductivityChart(): void {
    if (!this.productivityChartRef?.nativeElement) return;

    const ctx = this.productivityChartRef.nativeElement.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8', 'Sem 9', 'Sem 10'],
        datasets: [{
          label: 'Velocidade da Equipe',
          data: this.analyticsData.productivity.velocityTrend,
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          tension: 0.4,
          fill: true
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
            beginAtZero: true,
            title: {
              display: true,
              text: 'Story Points'
            }
          }
        }
      }
    });
    
    this.charts.push(chart);
  }

  createTimeTrackingChart(): void {
    if (!this.timeChartRef?.nativeElement) return;

    const ctx = this.timeChartRef.nativeElement.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.analyticsData.timeTracking.dailyHours.slice(-7).map(d => 
          new Date(d.date).toLocaleDateString('pt-BR', { weekday: 'short' })
        ),
        datasets: [{
          label: 'Horas Trabalhadas',
          data: this.analyticsData.timeTracking.dailyHours.slice(-7).map(d => d.hours),
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
            beginAtZero: true,
            title: {
              display: true,
              text: 'Horas'
            }
          }
        }
      }
    });
    
    this.charts.push(chart);
  }

  createProjectProgressChart(): void {
    if (!this.projectChartRef?.nativeElement) return;

    const ctx = this.projectChartRef.nativeElement.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['No Prazo', 'Atrasados', 'Concluídos', 'Cancelados'],
        datasets: [{
          data: [
            this.analyticsData.projectProgress.onTrack,
            this.analyticsData.projectProgress.delayed,
            this.analyticsData.projectProgress.completed,
            this.analyticsData.projectProgress.cancelled
          ],
          backgroundColor: ['#10B981', '#F59E0B', '#2563EB', '#EF4444'],
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
    
    this.charts.push(chart);
  }

  createTeamPerformanceChart(): void {
    if (!this.teamChartRef?.nativeElement) return;

    const ctx = this.teamChartRef.nativeElement.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: this.analyticsData.teamPerformance.memberStats.map(m => m.name),
        datasets: [{
          label: 'Eficiência (%)',
          data: this.analyticsData.teamPerformance.memberStats.map(m => m.efficiency),
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          pointBackgroundColor: '#8B5CF6'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
    
    this.charts.push(chart);
  }

  createFinancialChart(): void {
    if (!this.financialChartRef?.nativeElement) return;

    const ctx = this.financialChartRef.nativeElement.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.analyticsData.financialMetrics.revenueByProject.map(p => p.project),
        datasets: [{
          label: 'Receita (R$)',
          data: this.analyticsData.financialMetrics.revenueByProject.map(p => p.revenue),
          backgroundColor: '#06B6D4',
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
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R$ ' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
    
    this.charts.push(chart);
  }

  createBurndownChart(): void {
    if (!this.burndownChartRef?.nativeElement) return;

    const ctx = this.burndownChartRef.nativeElement.getContext('2d');
    const idealBurndown = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];
    const actualBurndown = [100, 95, 85, 75, 70, 55, 45, 35, 25, 15, 5];
    
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Sprint Start', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8', 'Day 9', 'Sprint End'],
        datasets: [
          {
            label: 'Burndown Ideal',
            data: idealBurndown,
            borderColor: '#94A3B8',
            backgroundColor: 'transparent',
            borderDash: [5, 5]
          },
          {
            label: 'Burndown Real',
            data: actualBurndown,
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Story Points Restantes'
            }
          }
        }
      }
    });
    
    this.charts.push(chart);
  }

  destroyCharts(): void {
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];
  }

  // Filters
  setupFilters(): void {
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  applyFilters(): void {
    // Simulate applying filters and reloading data
    this.loadAnalyticsData();
    this.destroyCharts();
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  // Summary Metrics
  calculateSummaryMetrics(): void {
    this.summaryMetrics = {
      totalProjects: this.projects.length,
      activeProjects: this.analyticsData.projectProgress.onTrack + this.analyticsData.projectProgress.delayed,
      teamMembers: this.analyticsData.teamPerformance.memberStats.length,
      totalRevenue: this.analyticsData.financialMetrics.revenue,
      avgEfficiency: Math.round(
        this.analyticsData.teamPerformance.memberStats.reduce((sum, member) => sum + member.efficiency, 0) /
        this.analyticsData.teamPerformance.memberStats.length
      ),
      completionRate: Math.round(
        (this.analyticsData.projectProgress.completed / 
        (this.analyticsData.projectProgress.completed + this.analyticsData.projectProgress.onTrack + 
         this.analyticsData.projectProgress.delayed + this.analyticsData.projectProgress.cancelled)) * 100
      )
    };
  }

  // Navigation
  navigateToProjects(): void {
    this.router.navigate(['/projects']);
  }

  navigateToWorkboard(): void {
    this.router.navigate(['/workboard']);
  }

  navigateToTalentPool(): void {
    this.router.navigate(['/talent-pool']);
  }

  // Export
  exportReport(): void {
    const reportData = {
      generatedAt: new Date().toISOString(),
      period: this.filterForm.get('dateRange')?.value,
      summary: this.summaryMetrics,
      analytics: this.analyticsData
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  // Utility
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatPercentage(value: number): string {
    return `${value}%`;
  }

  getEfficiencyColor(efficiency: number): string {
    if (efficiency >= 90) return '#10B981';
    if (efficiency >= 80) return '#F59E0B';
    return '#EF4444';
  }

  getProjectStatusColor(status: string): string {
    switch (status) {
      case 'onTrack': return '#10B981';
      case 'delayed': return '#F59E0B';
      case 'completed': return '#2563EB';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  }
}