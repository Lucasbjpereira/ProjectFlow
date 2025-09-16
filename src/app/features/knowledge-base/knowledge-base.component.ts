import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';

// Interfaces
export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  tags: string[];
  author: string;
  authorAvatar?: string;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  likes: number;
  isPublished: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
  attachments?: KnowledgeAttachment[];
  relatedArticles?: string[];
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  articleCount: number;
  isActive: boolean;
}

export interface KnowledgeAttachment {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'image' | 'video' | 'link';
  url: string;
  size?: number;
}

export interface KnowledgeStats {
  totalArticles: number;
  totalViews: number;
  totalAuthors: number;
  avgReadTime: number;
  popularCategories: { name: string; count: number; }[];
  recentActivity: { date: string; articles: number; views: number; }[];
}

export interface SearchFilter {
  query: string;
  category: string;
  difficulty: string;
  author: string;
  dateRange: { start: Date | null; end: Date | null; };
  tags: string[];
}

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTabsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatSnackBarModule,
    MatButtonToggleModule
  ],
  templateUrl: './knowledge-base.component.html',
  styleUrls: ['./knowledge-base.component.scss']
})
export class KnowledgeBaseComponent implements OnInit {
  @ViewChild('viewsChart') viewsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoriesChart') categoriesChartRef!: ElementRef<HTMLCanvasElement>;

  // Data properties
  articles: KnowledgeArticle[] = [];
  categories: KnowledgeCategory[] = [];
  stats: KnowledgeStats = {
    totalArticles: 0,
    totalViews: 0,
    totalAuthors: 0,
    avgReadTime: 0,
    popularCategories: [],
    recentActivity: []
  };
  filteredArticles: KnowledgeArticle[] = [];
  selectedArticle: KnowledgeArticle | null = null;

  // UI state
  isLoading = false;
  activeTab = 0;
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: 'recent' | 'popular' | 'title' | 'author' = 'recent';
  selectedCategory = 'all';
  selectedDifficulty = 'all';
  searchQuery = '';

  // Forms
  articleForm: FormGroup;
  searchForm: FormGroup;
  categoryForm: FormGroup;

  // Charts
  viewsChart?: Chart;
  categoriesChart?: Chart;

  // Dialog states
  showArticleDialog = false;
  showCategoryDialog = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.articleForm = this.createArticleForm();
    this.searchForm = this.createSearchForm();
    this.categoryForm = this.createCategoryForm();
  }

  ngOnInit(): void {
    this.loadData();
    this.setupCharts();
  }

  private createArticleForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      summary: ['', [Validators.required, Validators.maxLength(200)]],
      category: ['', Validators.required],
      tags: [''],
      difficulty: ['beginner', Validators.required],
      isPublished: [false]
    });
  }

  private createSearchForm(): FormGroup {
    return this.fb.group({
      query: [''],
      category: ['all'],
      difficulty: ['all'],
      author: ['all'],
      startDate: [null],
      endDate: [null]
    });
  }

  private createCategoryForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', Validators.required],
      icon: ['article', Validators.required],
      color: ['#2563eb', Validators.required],
      isActive: [true]
    });
  }

  // Property for template binding
  new: any = {};

  private loadData(): void {
    this.isLoading = true;
    
    // Simulate API call
    setTimeout(() => {
      this.loadMockData();
      this.applyFilters();
      this.calculateStats();
      this.isLoading = false;
    }, 1000);
  }

  private loadMockData(): void {
    // Mock categories
    this.categories = [
      {
        id: '1',
        name: 'Desenvolvimento',
        description: 'Artigos sobre desenvolvimento de software',
        icon: 'code',
        color: '#2563eb',
        articleCount: 15,
        isActive: true
      },
      {
        id: '2',
        name: 'Design',
        description: 'Guias de design e UX/UI',
        icon: 'palette',
        color: '#7c3aed',
        articleCount: 8,
        isActive: true
      },
      {
        id: '3',
        name: 'Gestão',
        description: 'Metodologias e práticas de gestão',
        icon: 'business',
        color: '#059669',
        articleCount: 12,
        isActive: true
      },
      {
        id: '4',
        name: 'Ferramentas',
        description: 'Tutoriais de ferramentas e tecnologias',
        icon: 'build',
        color: '#dc2626',
        articleCount: 10,
        isActive: true
      }
    ];

    // Mock articles
    this.articles = [
      {
        id: '1',
        title: 'Introdução ao Angular',
        content: 'Conteúdo completo sobre Angular...',
        summary: 'Aprenda os conceitos básicos do Angular framework',
        category: 'Desenvolvimento',
        tags: ['angular', 'typescript', 'frontend'],
        author: 'João Silva',
        authorAvatar: 'JS',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        views: 1250,
        likes: 89,
        isPublished: true,
        difficulty: 'beginner',
        estimatedReadTime: 8,
        relatedArticles: ['2', '3']
      },
      {
        id: '2',
        title: 'Design System Avançado',
        content: 'Guia completo para criar design systems...',
        summary: 'Como criar e manter um design system eficiente',
        category: 'Design',
        tags: ['design-system', 'ui', 'componentes'],
        author: 'Maria Santos',
        authorAvatar: 'MS',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-18'),
        views: 890,
        likes: 67,
        isPublished: true,
        difficulty: 'advanced',
        estimatedReadTime: 12,
        relatedArticles: ['1']
      },
      {
        id: '3',
        title: 'Metodologias Ágeis',
        content: 'Implementação de metodologias ágeis...',
        summary: 'Guia prático para implementar Scrum e Kanban',
        category: 'Gestão',
        tags: ['scrum', 'kanban', 'agile'],
        author: 'Pedro Costa',
        authorAvatar: 'PC',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-15'),
        views: 1100,
        likes: 78,
        isPublished: true,
        difficulty: 'intermediate',
        estimatedReadTime: 10
      }
    ];
  }

  private calculateStats(): void {
    this.stats = {
      totalArticles: this.articles.length,
      totalViews: this.articles.reduce((sum, article) => sum + article.views, 0),
      totalAuthors: new Set(this.articles.map(a => a.author)).size,
      avgReadTime: Math.round(this.articles.reduce((sum, article) => sum + article.estimatedReadTime, 0) / this.articles.length),
      popularCategories: this.categories.map(cat => ({
        name: cat.name,
        count: this.articles.filter(a => a.category === cat.name).length
      })).sort((a, b) => b.count - a.count),
      recentActivity: this.generateRecentActivity()
    };
  }

  private generateRecentActivity(): { date: string; articles: number; views: number; }[] {
    const activity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      activity.push({
        date: date.toISOString().split('T')[0],
        articles: Math.floor(Math.random() * 5) + 1,
        views: Math.floor(Math.random() * 200) + 50
      });
    }
    return activity;
  }

  private setupCharts(): void {
    setTimeout(() => {
      this.createViewsChart();
      this.createCategoriesChart();
    }, 100);
  }

  private createViewsChart(): void {
    if (!this.viewsChartRef?.nativeElement) return;

    const ctx = this.viewsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels: this.stats.recentActivity.map(item => {
          const date = new Date(item.date);
          return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }),
        datasets: [
          {
            label: 'Visualizações',
            data: this.stats.recentActivity.map(item => item.views),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Artigos',
            data: this.stats.recentActivity.map(item => item.articles),
            borderColor: '#059669',
            backgroundColor: 'rgba(5, 150, 105, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        }
      }
    };

    this.viewsChart = new Chart(ctx, config);
  }

  private createCategoriesChart(): void {
    if (!this.categoriesChartRef?.nativeElement) return;

    const ctx = this.categoriesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'doughnut' as ChartType,
      data: {
        labels: this.stats.popularCategories.map(cat => cat.name),
        datasets: [{
          data: this.stats.popularCategories.map(cat => cat.count),
          backgroundColor: [
            '#2563eb',
            '#7c3aed',
            '#059669',
            '#dc2626',
            '#f59e0b'
          ],
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
    };

    this.categoriesChart = new Chart(ctx, config);
  }

  // Filter and search methods
  applyFilters(): void {
    let filtered = [...this.articles];

    // Search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === this.selectedCategory);
    }

    // Difficulty filter
    if (this.selectedDifficulty !== 'all') {
      filtered = filtered.filter(article => article.difficulty === this.selectedDifficulty);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'popular':
          return b.views - a.views;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        default:
          return 0;
      }
    });

    this.filteredArticles = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  onDifficultyChange(difficulty: string): void {
    this.selectedDifficulty = difficulty;
    this.applyFilters();
  }

  onSortChange(sortBy: 'recent' | 'popular' | 'title' | 'author'): void {
    this.sortBy = sortBy;
    this.applyFilters();
  }

  // Article methods
  openArticle(article: KnowledgeArticle): void {
    this.selectedArticle = article;
    // Increment views
    article.views++;
    this.calculateStats();
  }

  closeArticle(): void {
    this.selectedArticle = null;
  }

  likeArticle(article: KnowledgeArticle): void {
    article.likes++;
    this.snackBar.open('Artigo curtido!', 'Fechar', { duration: 2000 });
  }

  shareArticle(article: KnowledgeArticle): void {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      this.snackBar.open('Link copiado para a área de transferência!', 'Fechar', { duration: 2000 });
    }
  }

  // Dialog methods
  openArticleDialog(article?: KnowledgeArticle): void {
    this.isEditMode = !!article;
    if (article) {
      this.articleForm.patchValue({
        title: article.title,
        content: article.content,
        summary: article.summary,
        category: article.category,
        tags: article.tags.join(', '),
        difficulty: article.difficulty,
        isPublished: article.isPublished
      });
    } else {
      this.articleForm.reset();
      this.articleForm.patchValue({ difficulty: 'beginner', isPublished: false });
    }
    this.showArticleDialog = true;
  }

  closeArticleDialog(): void {
    this.showArticleDialog = false;
    this.articleForm.reset();
  }

  saveArticle(): void {
    if (this.articleForm.valid) {
      const formValue = this.articleForm.value;
      const article: KnowledgeArticle = {
        id: this.isEditMode ? this.selectedArticle!.id : Date.now().toString(),
        title: formValue.title,
        content: formValue.content,
        summary: formValue.summary,
        category: formValue.category,
        tags: formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag),
        author: 'Usuário Atual',
        authorAvatar: 'UC',
        createdAt: this.isEditMode ? this.selectedArticle!.createdAt : new Date(),
        updatedAt: new Date(),
        views: this.isEditMode ? this.selectedArticle!.views : 0,
        likes: this.isEditMode ? this.selectedArticle!.likes : 0,
        isPublished: formValue.isPublished,
        difficulty: formValue.difficulty,
        estimatedReadTime: Math.ceil(formValue.content.split(' ').length / 200)
      };

      if (this.isEditMode) {
        const index = this.articles.findIndex(a => a.id === article.id);
        if (index !== -1) {
          this.articles[index] = article;
        }
      } else {
        this.articles.unshift(article);
      }

      this.applyFilters();
      this.calculateStats();
      this.closeArticleDialog();
      this.snackBar.open(
        this.isEditMode ? 'Artigo atualizado com sucesso!' : 'Artigo criado com sucesso!',
        'Fechar',
        { duration: 3000 }
      );
    }
  }

  deleteArticle(article: KnowledgeArticle): void {
    if (confirm('Tem certeza que deseja excluir este artigo?')) {
      this.articles = this.articles.filter(a => a.id !== article.id);
      this.applyFilters();
      this.calculateStats();
      this.snackBar.open('Artigo excluído com sucesso!', 'Fechar', { duration: 3000 });
    }
  }

  // Category methods
  openCategoryDialog(category?: KnowledgeCategory): void {
    this.isEditMode = !!category;
    if (category) {
      this.categoryForm.patchValue({
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: category.color,
        isActive: category.isActive
      });
    } else {
      this.categoryForm.reset();
      this.categoryForm.patchValue({ icon: 'article', color: '#2563eb', isActive: true });
    }
    this.showCategoryDialog = true;
  }

  closeCategoryDialog(): void {
    this.showCategoryDialog = false;
    this.categoryForm.reset();
  }

  saveCategory(): void {
    if (this.categoryForm.valid) {
      const formValue = this.categoryForm.value;
      const category: KnowledgeCategory = {
        id: this.isEditMode ? this.categories.find(c => c.name === formValue.name)?.id || Date.now().toString() : Date.now().toString(),
        name: formValue.name,
        description: formValue.description,
        icon: formValue.icon,
        color: formValue.color,
        articleCount: 0,
        isActive: formValue.isActive
      };

      if (this.isEditMode) {
        const index = this.categories.findIndex(c => c.id === category.id);
        if (index !== -1) {
          this.categories[index] = category;
        }
      } else {
        this.categories.push(category);
      }

      this.calculateStats();
      this.closeCategoryDialog();
      this.snackBar.open(
        this.isEditMode ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!',
        'Fechar',
        { duration: 3000 }
      );
    }
  }

  // Export methods
  exportData(): void {
    const data = {
      articles: this.articles,
      categories: this.categories,
      stats: this.stats,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `knowledge-base-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.snackBar.open('Dados exportados com sucesso!', 'Fechar', { duration: 3000 });
  }

  // Utility methods
  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  }

  getDifficultyIcon(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'trending_up';
      case 'intermediate': return 'show_chart';
      case 'advanced': return 'trending_flat';
      default: return 'help';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatReadTime(minutes: number): string {
    return `${minutes} min de leitura`;
  }

  getRelatedArticles(article: KnowledgeArticle): KnowledgeArticle[] {
    if (!article.relatedArticles) return [];
    return this.articles.filter(a => article.relatedArticles!.includes(a.id));
  }

  getCategoryColor(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category?.color || '#2563eb';
  }

  getCategoryIcon(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category?.icon || 'article';
  }

  getPublishedPercentage(): number {
    if (this.articles.length === 0) return 0;
    const publishedCount = this.articles.filter(a => a.isPublished).length;
    return Math.round((publishedCount / this.articles.length) * 100);
  }

  getRecentArticlesCount(): number {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return this.articles.filter(a => new Date(a.createdAt) > oneWeekAgo).length;
  }
}