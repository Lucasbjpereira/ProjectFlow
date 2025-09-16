import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subject, takeUntil } from 'rxjs';

Chart.register(...registerables);

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'productivity' | 'collaboration' | 'quality' | 'milestone' | 'special';
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
  isUnlocked: boolean;
}

interface UserLevel {
  level: number;
  title: string;
  currentXP: number;
  requiredXP: number;
  benefits: string[];
}

interface Leaderboard {
  rank: number;
  userId: string;
  userName: string;
  avatar: string;
  totalPoints: number;
  level: number;
  weeklyPoints: number;
  monthlyPoints: number;
  achievements: number;
  streak: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  category: string;
  points: number;
  progress: number;
  maxProgress: number;
  deadline: Date;
  isCompleted: boolean;
  participants: number;
}

interface GamificationStats {
  totalPoints: number;
  currentLevel: UserLevel;
  nextLevel: UserLevel;
  achievementsUnlocked: number;
  totalAchievements: number;
  currentStreak: number;
  longestStreak: number;
  weeklyRank: number;
  monthlyRank: number;
  completedChallenges: number;
}

@Component({
  selector: 'app-gamification',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressBarModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonToggleModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './gamification.component.html',
  styleUrls: ['./gamification.component.scss']
})
export class GamificationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data properties
  stats: GamificationStats = {
    totalPoints: 0,
    currentLevel: { level: 1, title: 'Novato', currentXP: 0, requiredXP: 100, benefits: [] },
    nextLevel: { level: 2, title: 'Iniciante', currentXP: 0, requiredXP: 250, benefits: [] },
    achievementsUnlocked: 0,
    totalAchievements: 0,
    currentStreak: 0,
    longestStreak: 0,
    weeklyRank: 0,
    monthlyRank: 0,
    completedChallenges: 0
  };
  
  achievements: Achievement[] = [];
  leaderboard: Leaderboard[] = [];
  challenges: Challenge[] = [];
  
  // UI state
  selectedTab = 0;
  isLoading = false;
  
  // Charts
  progressChart: Chart | null = null;
  pointsChart: Chart | null = null;
  
  // Filters
  achievementFilter = 'all';
  leaderboardPeriod = 'weekly';
  challengeFilter = 'active';
  
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {}
  
  ngOnInit(): void {
    this.loadData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.progressChart) {
      this.progressChart.destroy();
    }
    if (this.pointsChart) {
      this.pointsChart.destroy();
    }
  }
  
  private loadData(): void {
    this.isLoading = true;
    
    // Simulate API call
    setTimeout(() => {
      this.loadStats();
      this.loadAchievements();
      this.loadLeaderboard();
      this.loadChallenges();
      this.createCharts();
      this.isLoading = false;
    }, 1000);
  }
  
  private loadStats(): void {
    this.stats = {
      totalPoints: 2847,
      currentLevel: {
        level: 8,
        title: 'Especialista',
        currentXP: 2847,
        requiredXP: 3000,
        benefits: ['Acesso a projetos premium', 'Bônus de 15% em pontos', 'Badge exclusivo']
      },
      nextLevel: {
        level: 9,
        title: 'Veterano',
        currentXP: 2847,
        requiredXP: 4000,
        benefits: ['Acesso a mentoria', 'Bônus de 20% em pontos', 'Prioridade em alocações']
      },
      achievementsUnlocked: 23,
      totalAchievements: 45,
      currentStreak: 12,
      longestStreak: 28,
      weeklyRank: 3,
      monthlyRank: 7,
      completedChallenges: 18
    };
  }
  
  private loadAchievements(): void {
    this.achievements = [
      {
        id: '1',
        title: 'Primeira Tarefa',
        description: 'Complete sua primeira tarefa',
        icon: 'task_alt',
        category: 'productivity',
        points: 50,
        rarity: 'common',
        isUnlocked: true,
        unlockedAt: new Date('2024-01-15')
      },
      {
        id: '2',
        title: 'Maratonista',
        description: 'Trabalhe por 8 horas consecutivas',
        icon: 'directions_run',
        category: 'productivity',
        points: 200,
        rarity: 'rare',
        isUnlocked: true,
        unlockedAt: new Date('2024-01-20')
      },
      {
        id: '3',
        title: 'Colaborador Estrela',
        description: 'Receba 10 feedbacks positivos',
        icon: 'star',
        category: 'collaboration',
        points: 300,
        rarity: 'epic',
        isUnlocked: true,
        unlockedAt: new Date('2024-02-01')
      },
      {
        id: '4',
        title: 'Perfeccionista',
        description: 'Complete 20 tarefas sem bugs',
        icon: 'verified',
        category: 'quality',
        points: 500,
        rarity: 'legendary',
        isUnlocked: false,
        progress: 15,
        maxProgress: 20
      },
      {
        id: '5',
        title: 'Sequência Dourada',
        description: 'Mantenha uma sequência de 30 dias',
        icon: 'local_fire_department',
        category: 'milestone',
        points: 1000,
        rarity: 'legendary',
        isUnlocked: false,
        progress: 12,
        maxProgress: 30
      }
    ];
  }
  
  private loadLeaderboard(): void {
    this.leaderboard = [
      {
        rank: 1,
        userId: '1',
        userName: 'Ana Silva',
        avatar: 'AS',
        totalPoints: 4250,
        level: 12,
        weeklyPoints: 380,
        monthlyPoints: 1200,
        achievements: 35,
        streak: 25
      },
      {
        rank: 2,
        userId: '2',
        userName: 'Carlos Santos',
        avatar: 'CS',
        totalPoints: 3890,
        level: 11,
        weeklyPoints: 320,
        monthlyPoints: 980,
        achievements: 28,
        streak: 18
      },
      {
        rank: 3,
        userId: '3',
        userName: 'Você',
        avatar: 'VC',
        totalPoints: 2847,
        level: 8,
        weeklyPoints: 280,
        monthlyPoints: 750,
        achievements: 23,
        streak: 12
      },
      {
        rank: 4,
        userId: '4',
        userName: 'Maria Oliveira',
        avatar: 'MO',
        totalPoints: 2650,
        level: 8,
        weeklyPoints: 250,
        monthlyPoints: 680,
        achievements: 21,
        streak: 8
      },
      {
        rank: 5,
        userId: '5',
        userName: 'João Costa',
        avatar: 'JC',
        totalPoints: 2420,
        level: 7,
        weeklyPoints: 220,
        monthlyPoints: 620,
        achievements: 19,
        streak: 15
      }
    ];
  }
  
  private loadChallenges(): void {
    this.challenges = [
      {
        id: '1',
        title: 'Desafio Diário',
        description: 'Complete 5 tarefas hoje',
        type: 'daily',
        category: 'Produtividade',
        points: 100,
        progress: 3,
        maxProgress: 5,
        deadline: new Date(),
        isCompleted: false,
        participants: 45
      },
      {
        id: '2',
        title: 'Semana Produtiva',
        description: 'Trabalhe 40 horas esta semana',
        type: 'weekly',
        category: 'Tempo',
        points: 300,
        progress: 28,
        maxProgress: 40,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        isCompleted: false,
        participants: 32
      },
      {
        id: '3',
        title: 'Mestre da Qualidade',
        description: 'Complete 15 tarefas sem revisões este mês',
        type: 'monthly',
        category: 'Qualidade',
        points: 500,
        progress: 8,
        maxProgress: 15,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        isCompleted: false,
        participants: 28
      }
    ];
  }
  
  private createCharts(): void {
    this.createProgressChart();
    this.createPointsChart();
  }
  
  private createProgressChart(): void {
    const ctx = document.getElementById('progressChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['XP Atual', 'XP Restante'],
        datasets: [{
          data: [this.stats.currentLevel.currentXP, this.stats.nextLevel.requiredXP - this.stats.currentLevel.currentXP],
          backgroundColor: ['#2563eb', '#e2e8f0'],
          borderWidth: 0
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
        elements: {
          arc: {
            borderWidth: 0
          }
        }
      }
    };
    
    this.progressChart = new Chart(ctx, config);
  }
  
  private createPointsChart(): void {
    const ctx = document.getElementById('pointsChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [{
          label: 'Pontos Mensais',
          data: [450, 680, 520, 750, 890, 650],
          borderColor: '#2563eb',
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
    };
    
    this.pointsChart = new Chart(ctx, config);
  }
  
  // Event handlers
  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTab = event.index;
  }
  
  onAchievementFilterChange(filter: string): void {
    this.achievementFilter = filter;
  }
  
  onLeaderboardPeriodChange(period: string): void {
    this.leaderboardPeriod = period;
  }
  
  onChallengeFilterChange(filter: string): void {
    this.challengeFilter = filter;
  }
  
  // Utility methods
  getFilteredAchievements(): Achievement[] {
    if (this.achievementFilter === 'all') {
      return this.achievements;
    }
    if (this.achievementFilter === 'unlocked') {
      return this.achievements.filter(a => a.isUnlocked);
    }
    if (this.achievementFilter === 'locked') {
      return this.achievements.filter(a => !a.isUnlocked);
    }
    return this.achievements.filter(a => a.category === this.achievementFilter);
  }
  
  getFilteredChallenges(): Challenge[] {
    if (this.challengeFilter === 'all') {
      return this.challenges;
    }
    if (this.challengeFilter === 'active') {
      return this.challenges.filter(c => !c.isCompleted);
    }
    if (this.challengeFilter === 'completed') {
      return this.challenges.filter(c => c.isCompleted);
    }
    return this.challenges.filter(c => c.type === this.challengeFilter);
  }
  
  getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'common': return '#6b7280';
      case 'rare': return '#2563eb';
      case 'epic': return '#7c3aed';
      case 'legendary': return '#f59e0b';
      default: return '#6b7280';
    }
  }
  
  getCategoryIcon(category: string): string {
    switch (category) {
      case 'productivity': return 'trending_up';
      case 'collaboration': return 'group';
      case 'quality': return 'verified';
      case 'milestone': return 'flag';
      case 'special': return 'star';
      default: return 'emoji_events';
    }
  }
  
  getProgressPercentage(): number {
    return (this.stats.currentLevel.currentXP / this.stats.nextLevel.requiredXP) * 100;
  }
  
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }
  
  getDaysUntilDeadline(deadline: Date): number {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  
  joinChallenge(challenge: Challenge): void {
    // Implement join challenge logic
    console.log('Joining challenge:', challenge.title);
  }
  
  shareAchievement(achievement: Achievement): void {
    // Implement share achievement logic
    console.log('Sharing achievement:', achievement.title);
  }
  
  exportProgress(): void {
    // Implement export progress logic
    console.log('Exporting progress data');
  }
}