import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, combineLatest } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { DashboardMetrics, FinancialMetrics } from '../models';
import { ProjectService } from './project.service';
import { TaskService } from './task.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly METRICS_KEY = 'projectflow_metrics';
  
  private metricsSubject = new BehaviorSubject<DashboardMetrics | null>(null);
  public metrics$ = this.metricsSubject.asObservable();

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private userService: UserService
  ) {
    this.loadMetrics();
  }

  getDashboardMetrics(): Observable<DashboardMetrics> {
    return combineLatest([
      this.projectService.getProjects(),
      this.taskService.getTasks(),
      this.userService.getUsers(),
      this.taskService.getTimeEntries()
    ]).pipe(
      map(([projects, tasks, users, timeEntries]) => {
        const activeProjects = projects.filter(p => p.status === 'active').length;
        const totalProjects = projects.length;
        const completedTasks = tasks.filter(t => t.status === 'done').length;
        const totalTasks = tasks.length;
        const availableConsultants = users.filter(u => 
          (u.role === 'consultant' || u.role === 'manager') && 
          u.availabilityStatus === 'available'
        ).length;
        const totalConsultants = users.filter(u => 
          u.role === 'consultant' || u.role === 'manager'
        ).length;
        
        // Calcular horas trabalhadas no mês atual
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyHours = timeEntries
          .filter(entry => {
            const entryDate = new Date(entry.entryDate);
            return entryDate.getMonth() === currentMonth && 
                   entryDate.getFullYear() === currentYear;
          })
          .reduce((total, entry) => total + entry.hours, 0);
        
        // Calcular receita estimada
        const totalBudget = projects
          .filter(p => p.status === 'active')
          .reduce((total, project) => total + (project.budgetAmount || 0), 0);
        
        const metrics: DashboardMetrics = {
          totalProjects,
          activeProjects,
          completedProjects: projects.filter(p => p.status === 'completed').length,
          totalTasks,
          completedTasks,
          pendingTasks: tasks.filter(t => t.status === 'todo').length,
          inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
          totalConsultants,
          availableConsultants,
          busyConsultants: users.filter(u => 
            (u.role === 'consultant' || u.role === 'manager') && 
            u.availabilityStatus === 'busy'
          ).length,
          monthlyHours: Math.round(monthlyHours * 100) / 100,
          totalRevenue: totalBudget,
          averageProjectValue: totalProjects > 0 ? Math.round(totalBudget / totalProjects) : 0
        };
        
        this.metricsSubject.next(metrics);
        this.saveMetrics(metrics);
        
        return metrics;
      }),
      delay(500)
    );
  }

  getProjectStatusChart(): Observable<any[]> {
    return this.projectService.getProjects().pipe(
      map(projects => {
        const statusCount = projects.reduce((acc, project) => {
          acc[project.status] = (acc[project.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return [
          { name: 'Planejamento', value: statusCount['planning'] || 0, color: '#FFA726' },
          { name: 'Ativo', value: statusCount['active'] || 0, color: '#2563EB' },
          { name: 'Pausado', value: statusCount['paused'] || 0, color: '#EF4444' },
          { name: 'Concluído', value: statusCount['completed'] || 0, color: '#10B981' }
        ];
      }),
      delay(300)
    );
  }

  getTaskStatusChart(): Observable<any[]> {
    return this.taskService.getTasks().pipe(
      map(tasks => {
        const statusCount = tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return [
          { name: 'A Fazer', value: statusCount['todo'] || 0, color: '#94A3B8' },
          { name: 'Em Progresso', value: statusCount['in_progress'] || 0, color: '#2563EB' },
          { name: 'Em Revisão', value: statusCount['review'] || 0, color: '#F59E0B' },
          { name: 'Concluído', value: statusCount['completed'] || 0, color: '#10B981' }
        ];
      }),
      delay(300)
    );
  }

  getMonthlyHoursChart(): Observable<any[]> {
    return this.taskService.getTimeEntries().pipe(
      map(timeEntries => {
        const currentYear = new Date().getFullYear();
        const monthlyData = Array.from({ length: 12 }, (_, index) => {
          const month = index;
          const monthName = new Date(currentYear, month, 1).toLocaleDateString('pt-BR', { month: 'short' });
          
          const monthHours = timeEntries
            .filter(entry => {
              const entryDate = new Date(entry.entryDate);
              return entryDate.getMonth() === month && entryDate.getFullYear() === currentYear;
            })
            .reduce((total, entry) => total + entry.hours, 0);
          
          return {
            month: monthName,
            hours: Math.round(monthHours * 100) / 100
          };
        });
        
        return monthlyData;
      }),
      delay(300)
    );
  }

  getRevenueChart(): Observable<any[]> {
    return this.projectService.getProjects().pipe(
      map(projects => {
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = Array.from({ length: 12 }, (_, index) => {
          const month = index;
          const monthName = new Date(currentYear, month, 1).toLocaleDateString('pt-BR', { month: 'short' });
          
          const monthRevenue = projects
            .filter(project => {
              const projectDate = new Date(project.createdAt);
              return projectDate.getMonth() === month && 
                     projectDate.getFullYear() === currentYear &&
                     project.status === 'completed';
            })
            .reduce((total, project) => total + (project.budgetAmount || 0), 0);
          
          return {
            month: monthName,
            revenue: monthRevenue
          };
        });
        
        return monthlyRevenue;
      }),
      delay(300)
    );
  }

  getTopSkillsChart(): Observable<any[]> {
    return combineLatest([
      this.userService.getUsers(),
      this.userService.getSkills()
    ]).pipe(
      map(([users, skills]) => {
        const skillCount = users
          .filter(user => user.role === 'consultant' || user.role === 'manager')
          .flatMap(user => user.skills)
          .reduce((acc, userSkill) => {
            acc[userSkill.id] = (acc[userSkill.id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        
        return Object.entries(skillCount)
          .map(([skillId, count]) => {
            const skill = skills.find(s => s.id === skillId);
            return {
              name: skill?.name || 'Desconhecida',
              value: count,
              category: 'Técnica'
            };
          })
          .sort((a, b) => b.value - a.value)
          .slice(0, 10); // Top 10 skills
      }),
      delay(300)
    );
  }

  getConsultantUtilizationChart(): Observable<any[]> {
    return combineLatest([
      this.userService.getUsers(),
      this.taskService.getTimeEntries()
    ]).pipe(
      map(([users, timeEntries]) => {
        const consultants = users.filter(u => u.role === 'consultant' || u.role === 'manager');
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return consultants.map(consultant => {
          const consultantHours = timeEntries
            .filter(entry => {
              const entryDate = new Date(entry.entryDate);
              return entry.userId === consultant.id &&
                     entryDate.getMonth() === currentMonth &&
                     entryDate.getFullYear() === currentYear;
            })
            .reduce((total, entry) => total + entry.hours, 0);
          
          const workingDays = 22; // Média de dias úteis por mês
          const expectedHours = workingDays * 8; // 8 horas por dia
          const utilization = expectedHours > 0 ? (consultantHours / expectedHours) * 100 : 0;
          
          return {
            name: consultant.name,
            hours: Math.round(consultantHours * 100) / 100,
            utilization: Math.round(utilization * 100) / 100,
            status: consultant.availabilityStatus
          };
        }).sort((a, b) => b.utilization - a.utilization);
      }),
      delay(300)
    );
  }

  getTeamUtilizationChart(): Observable<any> {
    return this.getConsultantUtilizationChart().pipe(
      map(data => ({
        labels: data.map(item => item.name),
        datasets: [{
          label: 'Utilização (%)',
          data: data.map(item => item.utilization),
          backgroundColor: '#2563EB',
          borderColor: '#1D4ED8',
          borderWidth: 1
        }]
      }))
    );
  }

  private saveMetrics(metrics: DashboardMetrics): void {
    const data = {
      metrics,
      timestamp: Date.now()
    };
    localStorage.setItem(this.METRICS_KEY, JSON.stringify(data));
  }

  private loadMetrics(): void {
    const stored = localStorage.getItem(this.METRICS_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Verificar se os dados não são muito antigos (1 hora)
        const isStale = Date.now() - data.timestamp > 60 * 60 * 1000;
        if (!isStale && data.metrics) {
          this.metricsSubject.next(data.metrics);
        }
      } catch {
        // Ignorar erro de parsing
      }
    }
  }
}