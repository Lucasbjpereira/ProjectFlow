import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap, delay } from 'rxjs/operators';
import { User, LoginRequest, LoginResponse, UserRole } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'projectflow_auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    // Simular dados mock para autenticação
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'admin@projectflow.com',
        name: 'Admin User',
        role: UserRole.ADMIN,
        hourlyRate: 0,
        availability: 'available',
        availabilityStatus: 'available',
        skills: [],
        rating: 5.0,
        experience: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        email: 'manager@projectflow.com',
        name: 'Manager User',
        role: UserRole.MANAGER,
        hourlyRate: 150,
        availability: 'available',
        availabilityStatus: 'available',
        skills: [],
        rating: 4.8,
        experience: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        email: 'consultant@projectflow.com',
        name: 'Consultant User',
        role: UserRole.CONSULTANT,
        hourlyRate: 100,
        availability: 'available',
        availabilityStatus: 'available',
        skills: [],
        rating: 4.5,
        experience: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '4',
        email: 'client@projectflow.com',
        name: 'Client User',
        role: UserRole.CLIENT,
        hourlyRate: 0,
        availability: 'available',
        availabilityStatus: 'available',
        skills: [],
        rating: 0,
        experience: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const user = mockUsers.find(u => u.email === credentials.email);
    
    if (user && credentials.password === 'senha123') {
      const token = this.generateToken();
      const response: LoginResponse = {
        success: true,
        user,
        token
      };
      
      return of(response).pipe(
        delay(1000), // Simular delay de rede
        tap(() => this.setCurrentUser(user, token))
      );
    }

    return throwError(() => new Error('Credenciais inválidas'));
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  private setCurrentUser(user: User, token: string): void {
    const authData = { user, token, timestamp: Date.now() };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
    this.currentUserSubject.next(user);
  }

  private loadUserFromStorage(): void {
    const authData = localStorage.getItem(this.STORAGE_KEY);
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        // Verificar se o token não expirou (24 horas)
        const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000;
        if (!isExpired && parsed.user) {
          this.currentUserSubject.next(parsed.user);
        } else {
          this.logout();
        }
      } catch {
        this.logout();
      }
    }
  }

  private generateToken(): string {
    return 'mock-jwt-token-' + Math.random().toString(36).substr(2, 9);
  }
}