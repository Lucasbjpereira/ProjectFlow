import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule, MatChipSet } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { Subject, interval, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'review' | 'done';
  project: string;
  estimatedHours: number;
  loggedHours: number;
  dueDate: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  timeEntries: TimeEntry[];
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // em minutos
  description: string;
  isActive: boolean;
}

export interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  tasks: Task[];
  color: string;
  limit?: number;
}

@Component({
  selector: 'app-workboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatMenuModule,
    MatSnackBarModule,
    MatTabsModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatTooltipModule,
    DragDropModule,
    MatDividerModule,
    MatChipSet
  ],
  templateUrl: './workboard.component.html',
  styleUrls: ['./workboard.component.scss']
})
export class WorkboardComponent implements OnInit, OnDestroy {
  @ViewChild('timerDisplay', { static: false }) timerDisplay!: ElementRef;

  private destroy$ = new Subject<void>();
  private timerSubscription?: Subscription;

  // Kanban Board
  columns: KanbanColumn[] = [
    {
      id: 'todo',
      title: 'A Fazer',
      status: 'todo',
      tasks: [],
      color: '#e3f2fd',
      limit: 10
    },
    {
      id: 'in-progress',
      title: 'Em Progresso',
      status: 'in-progress',
      tasks: [],
      color: '#fff3e0',
      limit: 5
    },
    {
      id: 'review',
      title: 'Em Revisão',
      status: 'review',
      tasks: [],
      color: '#f3e5f5',
      limit: 3
    },
    {
      id: 'done',
      title: 'Concluído',
      status: 'done',
      tasks: [],
      color: '#e8f5e8'
    }
  ];

  // Timer
  currentTimer: TimeEntry | null = null;
  timerSeconds = 0;
  timerDisplay$ = '';
  isTimerRunning = false;

  // Forms
  taskForm: FormGroup;
  timeEntryForm: FormGroup;
  filterForm: FormGroup;

  // Data
  tasks: Task[] = [];
  timeEntries: TimeEntry[] = [];
  filteredTasks: Task[] = [];
  selectedTask: Task | null = null;
  showTaskDialog = false;
  showTimeDialog = false;

  // Filters
  selectedProject = '';
  selectedAssignee = '';
  selectedPriority = '';
  searchTerm = '';

  // Statistics
  stats = {
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    totalHours: 0,
    todayHours: 0,
    efficiency: 0
  };

  // Mock data
  projects = ['ProjectFlow', 'Website Redesign', 'Mobile App', 'API Integration'];
  users = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira'];
  priorities = [
    { value: 'low', label: 'Baixa', color: '#4caf50' },
    { value: 'medium', label: 'Média', color: '#ff9800' },
    { value: 'high', label: 'Alta', color: '#f44336' },
    { value: 'urgent', label: 'Urgente', color: '#9c27b0' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      assignee: ['', Validators.required],
      priority: ['medium', Validators.required],
      project: ['', Validators.required],
      estimatedHours: [0, [Validators.required, Validators.min(0.5)]],
      dueDate: ['', Validators.required],
      tags: [[]]
    });

    this.timeEntryForm = this.fb.group({
      description: ['', Validators.required],
      duration: [0, [Validators.required, Validators.min(1)]]
    });

    this.filterForm = this.fb.group({
      project: [''],
      assignee: [''],
      priority: [''],
      search: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.setupFilters();
    this.calculateStats();
    this.distributeTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopTimer();
  }

  // Data Management
  loadData(): void {
    const savedTasks = localStorage.getItem('projectflow_tasks');
    const savedTimeEntries = localStorage.getItem('projectflow_time_entries');

    if (savedTasks) {
      this.tasks = JSON.parse(savedTasks).map((task: any) => ({
        ...task,
        dueDate: new Date(task.dueDate),
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt)
      }));
    } else {
      this.generateMockTasks();
    }

    if (savedTimeEntries) {
      this.timeEntries = JSON.parse(savedTimeEntries).map((entry: any) => ({
        ...entry,
        startTime: new Date(entry.startTime),
        endTime: entry.endTime ? new Date(entry.endTime) : undefined
      }));
    }

    this.filteredTasks = [...this.tasks];
  }

  saveData(): void {
    localStorage.setItem('projectflow_tasks', JSON.stringify(this.tasks));
    localStorage.setItem('projectflow_time_entries', JSON.stringify(this.timeEntries));
  }

  generateMockTasks(): void {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Implementar autenticação',
        description: 'Desenvolver sistema de login e registro de usuários',
        assignee: 'João Silva',
        priority: 'high',
        status: 'in-progress',
        project: 'ProjectFlow',
        estimatedHours: 8,
        loggedHours: 4.5,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        tags: ['frontend', 'backend', 'security'],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        timeEntries: []
      },
      {
        id: '2',
        title: 'Design do dashboard',
        description: 'Criar layout responsivo para o dashboard principal',
        assignee: 'Maria Santos',
        priority: 'medium',
        status: 'todo',
        project: 'ProjectFlow',
        estimatedHours: 6,
        loggedHours: 0,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        tags: ['design', 'ui/ux'],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        timeEntries: []
      },
      {
        id: '3',
        title: 'Testes unitários',
        description: 'Implementar testes para os componentes principais',
        assignee: 'Pedro Costa',
        priority: 'low',
        status: 'review',
        project: 'ProjectFlow',
        estimatedHours: 12,
        loggedHours: 10,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tags: ['testing', 'quality'],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        timeEntries: []
      }
    ];

    this.tasks = mockTasks;
    this.saveData();
  }

  // Kanban Board
  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      const newStatus = event.container.id as Task['status'];
      
      // Check column limits
      const targetColumn = this.columns.find(col => col.id === newStatus);
      if (targetColumn?.limit && event.container.data.length >= targetColumn.limit) {
        this.snackBar.open(`Limite de ${targetColumn.limit} tarefas atingido para ${targetColumn.title}`, 'Fechar', {
          duration: 3000
        });
        return;
      }

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update task status
      task.status = newStatus;
      task.updatedAt = new Date();

      // Stop timer if task is moved to done
      if (newStatus === 'done' && this.currentTimer?.taskId === task.id) {
        this.stopTimer();
      }

      this.updateTaskInArray(task);
      this.saveData();
      this.calculateStats();

      this.snackBar.open(`Tarefa movida para ${targetColumn?.title}`, 'Fechar', {
        duration: 2000
      });
    }
  }

  distributeTasks(): void {
    this.columns.forEach(column => {
      column.tasks = this.filteredTasks.filter(task => task.status === column.status);
    });
  }

  // Timer Functions
  startTimer(task: Task): void {
    if (this.isTimerRunning) {
      this.stopTimer();
    }

    this.currentTimer = {
      id: this.generateId(),
      taskId: task.id,
      userId: 'current-user',
      startTime: new Date(),
      duration: 0,
      description: '',
      isActive: true
    };

    this.isTimerRunning = true;
    this.timerSeconds = 0;

    this.timerSubscription = interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.timerSeconds++;
        this.updateTimerDisplay();
      });

    this.snackBar.open(`Timer iniciado para: ${task.title}`, 'Fechar', {
      duration: 2000
    });
  }

  stopTimer(): void {
    if (!this.currentTimer || !this.isTimerRunning) return;

    this.isTimerRunning = false;
    this.timerSubscription?.unsubscribe();

    this.currentTimer.endTime = new Date();
    this.currentTimer.duration = Math.floor(this.timerSeconds / 60); // Convert to minutes
    this.currentTimer.isActive = false;

    // Add to time entries
    this.timeEntries.push({ ...this.currentTimer });

    // Update task logged hours
    const task = this.tasks.find(t => t.id === this.currentTimer!.taskId);
    if (task) {
      task.loggedHours += this.currentTimer.duration / 60; // Convert to hours
      task.timeEntries.push({ ...this.currentTimer });
      this.updateTaskInArray(task);
    }

    this.saveData();
    this.calculateStats();
    this.showTimeEntryDialog();

    this.currentTimer = null;
    this.timerSeconds = 0;
    this.timerDisplay$ = '00:00:00';
  }

  updateTimerDisplay(): void {
    const hours = Math.floor(this.timerSeconds / 3600);
    const minutes = Math.floor((this.timerSeconds % 3600) / 60);
    const seconds = this.timerSeconds % 60;

    this.timerDisplay$ = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Task Management
  openTaskDialog(task?: Task): void {
    if (task) {
      this.selectedTask = task;
      this.taskForm.patchValue({
        title: task.title,
        description: task.description,
        assignee: task.assignee,
        priority: task.priority,
        project: task.project,
        estimatedHours: task.estimatedHours,
        dueDate: task.dueDate,
        tags: task.tags
      });
    } else {
      this.selectedTask = null;
      this.taskForm.reset();
      this.taskForm.patchValue({ priority: 'medium' });
    }
    this.showTaskDialog = true;
  }

  saveTask(): void {
    if (this.taskForm.invalid) return;

    const formValue = this.taskForm.value;
    
    if (this.selectedTask) {
      // Update existing task
      Object.assign(this.selectedTask, {
        ...formValue,
        updatedAt: new Date()
      });
      this.updateTaskInArray(this.selectedTask);
      this.snackBar.open('Tarefa atualizada com sucesso!', 'Fechar', { duration: 2000 });
    } else {
      // Create new task
      const newTask: Task = {
        id: this.generateId(),
        ...formValue,
        status: 'todo' as Task['status'],
        loggedHours: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        timeEntries: []
      };
      this.tasks.push(newTask);
      this.snackBar.open('Tarefa criada com sucesso!', 'Fechar', { duration: 2000 });
    }

    this.saveData();
    this.applyFilters();
    this.distributeTasks();
    this.calculateStats();
    this.closeTaskDialog();
  }

  deleteTask(task: Task): void {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      this.tasks = this.tasks.filter(t => t.id !== task.id);
      this.timeEntries = this.timeEntries.filter(te => te.taskId !== task.id);
      
      if (this.currentTimer?.taskId === task.id) {
        this.stopTimer();
      }

      this.saveData();
      this.applyFilters();
      this.distributeTasks();
      this.calculateStats();
      this.snackBar.open('Tarefa excluída com sucesso!', 'Fechar', { duration: 2000 });
    }
  }

  updateTaskInArray(task: Task): void {
    const index = this.tasks.findIndex(t => t.id === task.id);
    if (index !== -1) {
      this.tasks[index] = task;
    }
  }

  closeTaskDialog(): void {
    this.showTaskDialog = false;
    this.selectedTask = null;
    this.taskForm.reset();
  }

  // Time Entry Dialog
  showTimeEntryDialog(): void {
    if (this.currentTimer) {
      this.timeEntryForm.patchValue({
        description: '',
        duration: this.currentTimer.duration
      });
      this.showTimeDialog = true;
    }
  }

  saveTimeEntry(): void {
    if (this.timeEntryForm.invalid || !this.currentTimer) return;

    const formValue = this.timeEntryForm.value;
    const lastEntry = this.timeEntries[this.timeEntries.length - 1];
    
    if (lastEntry) {
      lastEntry.description = formValue.description;
      lastEntry.duration = formValue.duration;
    }

    this.saveData();
    this.closeTimeDialog();
    this.snackBar.open('Apontamento de horas salvo!', 'Fechar', { duration: 2000 });
  }

  closeTimeDialog(): void {
    this.showTimeDialog = false;
    this.timeEntryForm.reset();
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
    const filters = this.filterForm.value;
    
    this.filteredTasks = this.tasks.filter(task => {
      const matchesProject = !filters.project || task.project === filters.project;
      const matchesAssignee = !filters.assignee || task.assignee === filters.assignee;
      const matchesPriority = !filters.priority || task.priority === filters.priority;
      const matchesSearch = !filters.search || 
        task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.description.toLowerCase().includes(filters.search.toLowerCase());

      return matchesProject && matchesAssignee && matchesPriority && matchesSearch;
    });

    this.distributeTasks();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filteredTasks = [...this.tasks];
    this.distributeTasks();
  }

  // Statistics
  calculateStats(): void {
    this.stats.totalTasks = this.tasks.length;
    this.stats.completedTasks = this.tasks.filter(t => t.status === 'done').length;
    this.stats.inProgressTasks = this.tasks.filter(t => t.status === 'in-progress').length;
    this.stats.totalHours = this.tasks.reduce((sum, task) => sum + task.loggedHours, 0);
    
    // Today's hours
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.stats.todayHours = this.timeEntries
      .filter(entry => entry.startTime >= today)
      .reduce((sum, entry) => sum + entry.duration / 60, 0);

    // Efficiency (logged vs estimated)
    const totalEstimated = this.tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
    this.stats.efficiency = totalEstimated > 0 ? (this.stats.totalHours / totalEstimated) * 100 : 0;
  }

  // Utility
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getPriorityColor(priority: string): string {
    const priorityObj = this.priorities.find(p => p.value === priority);
    return priorityObj?.color || '#757575';
  }

  getTaskProgress(task: Task): number {
    return task.estimatedHours > 0 ? (task.loggedHours / task.estimatedHours) * 100 : 0;
  }

  isOverdue(task: Task): boolean {
    return new Date() > task.dueDate && task.status !== 'done';
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  navigateToAnalytics(): void {
    this.router.navigate(['/analytics']);
  }

  exportTimesheet(): void {
    const data = this.timeEntries.map(entry => {
      const task = this.tasks.find(t => t.id === entry.taskId);
      return {
        Task: task?.title || 'N/A',
        Project: task?.project || 'N/A',
        User: entry.userId,
        Date: entry.startTime.toLocaleDateString(),
        Duration: this.formatDuration(entry.duration),
        Description: entry.description
      };
    });

    const csv = this.convertToCSV(data);
    this.downloadCSV(csv, 'timesheet.csv');
  }

  private convertToCSV(data: any[]): string {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  }

  private downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Methods for template bindings
  getColumnIds(): string[] {
    return this.columns.map(c => c.id);
  }

  selectTask(task: Task): void {
    this.selectedTask = task;
  }

  getPriorityLabel(priority: string): string {
    const priorityObj = this.priorities.find(p => p.value === priority);
    return priorityObj?.label || priority;
  }
}