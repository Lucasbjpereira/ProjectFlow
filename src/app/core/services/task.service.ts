import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, interval } from 'rxjs';
import { delay, map, takeWhile } from 'rxjs/operators';
import { Task, TimeEntry, TimerSession } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly TASKS_KEY = 'projectflow_tasks';
  private readonly TIME_ENTRIES_KEY = 'projectflow_time_entries';
  private readonly TIMER_SESSION_KEY = 'projectflow_timer_session';
  
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private timeEntriesSubject = new BehaviorSubject<TimeEntry[]>([]);
  private timerSessionSubject = new BehaviorSubject<TimerSession | null>(null);
  private timerSubject = new BehaviorSubject<number>(0);
  
  public tasks$ = this.tasksSubject.asObservable();
  public timeEntries$ = this.timeEntriesSubject.asObservable();
  public timerSession$ = this.timerSessionSubject.asObservable();
  public timer$ = this.timerSubject.asObservable();

  constructor() {
    this.loadMockData();
    this.loadTimerSession();
  }

  // Tasks CRUD
  getTasks(): Observable<Task[]> {
    return this.tasks$.pipe(delay(300));
  }

  getTasksByProject(projectId: string): Observable<Task[]> {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => task.projectId === projectId)),
      delay(300)
    );
  }

  getTaskById(id: string): Observable<Task | undefined> {
    return this.tasks$.pipe(
      map(tasks => tasks.find(task => task.id === id)),
      delay(200)
    );
  }

  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Observable<Task> {
    const newTask: Task = {
      ...task,
      id: this.generateId(),
      createdAt: new Date(),

    };
    
    const currentTasks = this.tasksSubject.value;
    const updatedTasks = [...currentTasks, newTask];
    
    this.updateTasks(updatedTasks);
    return of(newTask).pipe(delay(500));
  }

  updateTask(id: string, updates: Partial<Task>): Observable<Task> {
    const currentTasks = this.tasksSubject.value;
    const taskIndex = currentTasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) {
      throw new Error('Tarefa não encontrada');
    }
    
    const updatedTask = { 
      ...currentTasks[taskIndex], 
      ...updates, 
      updatedAt: new Date() 
    };
    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex] = updatedTask;
    
    this.updateTasks(updatedTasks);
    return of(updatedTask).pipe(delay(500));
  }

  deleteTask(id: string): Observable<boolean> {
    const currentTasks = this.tasksSubject.value;
    const updatedTasks = currentTasks.filter(task => task.id !== id);
    
    this.updateTasks(updatedTasks);
    return of(true).pipe(delay(300));
  }

  // Time Entries
  getTimeEntries(): Observable<TimeEntry[]> {
    return this.timeEntries$.pipe(delay(300));
  }

  getTimeEntriesByTask(taskId: string): Observable<TimeEntry[]> {
    return this.timeEntries$.pipe(
      map(entries => entries.filter(entry => entry.taskId === taskId)),
      delay(200)
    );
  }

  createTimeEntry(entry: Omit<TimeEntry, 'id'>): Observable<TimeEntry> {
    const newEntry: TimeEntry = {
      ...entry,
      id: this.generateId()
    };
    
    const currentEntries = this.timeEntriesSubject.value;
    const updatedEntries = [...currentEntries, newEntry];
    
    this.updateTimeEntries(updatedEntries);
    return of(newEntry).pipe(delay(500));
  }

  // Timer functionality
  startTimer(taskId: string, userId: string): Observable<TimerSession> {
    const session: TimerSession = {
      id: this.generateId(),
      taskId,
      userId,
      startTime: new Date(),
      isActive: true
    };
    
    this.timerSessionSubject.next(session);
    this.saveTimerSession(session);
    this.startTimerInterval();
    
    return of(session).pipe(delay(100));
  }

  stopTimer(): Observable<TimeEntry | null> {
    const session = this.timerSessionSubject.value;
    
    if (!session || !session.isActive) {
      return of(null);
    }
    
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);
    
    const timeEntry: TimeEntry = {
      id: this.generateId(),
      taskId: session.taskId,
      userId: session.userId,
      projectId: '',
      hours: duration / 3600,
      description: 'Tempo registrado automaticamente',
      entryDate: new Date(),
      createdAt: new Date()
    };
    
    // Salvar entrada de tempo
    const currentEntries = this.timeEntriesSubject.value;
    this.updateTimeEntries([...currentEntries, timeEntry]);
    
    // Limpar sessão do timer
    this.clearTimerSession();
    
    return of(timeEntry).pipe(delay(300));
  }

  pauseTimer(): Observable<boolean> {
    const session = this.timerSessionSubject.value;
    
    if (session) {
      const updatedSession = { ...session, isActive: false };
      this.timerSessionSubject.next(updatedSession);
      this.saveTimerSession(updatedSession);
    }
    
    return of(true);
  }

  resumeTimer(): Observable<boolean> {
    const session = this.timerSessionSubject.value;
    
    if (session) {
      const updatedSession = { ...session, isActive: true };
      this.timerSessionSubject.next(updatedSession);
      this.saveTimerSession(updatedSession);
      this.startTimerInterval();
    }
    
    return of(true);
  }

  getCurrentTimerDuration(): number {
    return this.timerSubject.value;
  }

  private startTimerInterval(): void {
    const session = this.timerSessionSubject.value;
    
    if (!session || !session.isActive) return;
    
    interval(1000).pipe(
      takeWhile(() => {
        const currentSession = this.timerSessionSubject.value;
        return currentSession?.isActive === true;
      })
    ).subscribe(() => {
      const currentSession = this.timerSessionSubject.value;
      if (currentSession && currentSession.isActive) {
        const elapsed = Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000);
        this.timerSubject.next(elapsed);
      }
    });
  }

  private updateTasks(tasks: Task[]): void {
    localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
    this.tasksSubject.next(tasks);
  }

  private updateTimeEntries(entries: TimeEntry[]): void {
    localStorage.setItem(this.TIME_ENTRIES_KEY, JSON.stringify(entries));
    this.timeEntriesSubject.next(entries);
  }

  private saveTimerSession(session: TimerSession): void {
    localStorage.setItem(this.TIMER_SESSION_KEY, JSON.stringify(session));
  }

  private clearTimerSession(): void {
    localStorage.removeItem(this.TIMER_SESSION_KEY);
    this.timerSessionSubject.next(null);
    this.timerSubject.next(0);
  }

  private loadTimerSession(): void {
    const stored = localStorage.getItem(this.TIMER_SESSION_KEY);
    if (stored) {
      try {
        const session = JSON.parse(stored);
        session.startTime = new Date(session.startTime);
        this.timerSessionSubject.next(session);
        
        if (session.isActive) {
          this.startTimerInterval();
        }
      } catch {
        this.clearTimerSession();
      }
    }
  }

  private loadMockData(): void {
    const storedTasks = localStorage.getItem(this.TASKS_KEY);
    const storedEntries = localStorage.getItem(this.TIME_ENTRIES_KEY);

    if (storedTasks && storedEntries) {
      this.tasksSubject.next(JSON.parse(storedTasks));
      this.timeEntriesSubject.next(JSON.parse(storedEntries));
    } else {
      this.initializeMockData();
    }
  }

  private initializeMockData(): void {
    const mockTasks: Task[] = [
      {
        id: '1',
        projectId: '1',
        title: 'Configurar ambiente de desenvolvimento',
        description: 'Configurar Docker, banco de dados e dependências',
        status: 'done',
        priority: 'high',
        assignedUserId: '2',
        estimatedHours: 8,
        dueDate: new Date('2024-01-20'),
        timeEntries: [],
        createdAt: new Date('2024-01-15')
      },
      {
        id: '2',
        projectId: '1',
        title: 'Desenvolver API de autenticação',
        description: 'Implementar login, logout e middleware de autenticação',
        status: 'in_progress',
        priority: 'high',
        assignedUserId: '3',
        estimatedHours: 16,
        dueDate: new Date('2024-01-25'),
        timeEntries: [],
        createdAt: new Date('2024-01-16')
      },
      {
        id: '3',
        projectId: '1',
        title: 'Criar interface do usuário',
        description: 'Desenvolver componentes React para o frontend',
        status: 'todo',
        priority: 'medium',
        assignedUserId: '2',
        estimatedHours: 24,
        dueDate: new Date('2024-02-05'),
        timeEntries: [],
        createdAt: new Date('2024-01-17')
      }
    ];

    const mockTimeEntries: TimeEntry[] = [
      {
        id: '1',
        taskId: '1',
        userId: '2',
        projectId: '1',
        hours: 3,
        description: 'Configuração inicial do Docker',
        entryDate: new Date('2024-01-18'),
        createdAt: new Date('2024-01-18T09:00:00')
      },
      {
        id: '2',
        taskId: '1',
        userId: '2',
        projectId: '1',
        hours: 3,
        description: 'Setup do banco de dados',
        entryDate: new Date('2024-01-18'),
        createdAt: new Date('2024-01-18T14:00:00')
      }
    ];

    this.updateTasks(mockTasks);
    this.updateTimeEntries(mockTimeEntries);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}