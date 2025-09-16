import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { User, Skill, UserRole } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly USERS_KEY = 'projectflow_users';
  private readonly SKILLS_KEY = 'projectflow_skills';
  
  private usersSubject = new BehaviorSubject<User[]>([]);
  private skillsSubject = new BehaviorSubject<Skill[]>([]);
  
  public users$ = this.usersSubject.asObservable();
  public skills$ = this.skillsSubject.asObservable();

  constructor() {
    this.loadMockData();
  }

  // Users
  getUsers(): Observable<User[]> {
    return this.users$.pipe(delay(300));
  }

  getUserById(id: string): Observable<User | undefined> {
    return this.users$.pipe(
      map(users => users.find(user => user.id === id)),
      delay(200)
    );
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.users$.pipe(
      map(users => users.filter(user => user.role === role)),
      delay(300)
    );
  }

  getAvailableConsultants(): Observable<User[]> {
    return this.users$.pipe(
      map(users => users.filter(user => 
        (user.role === 'consultant' || user.role === 'manager') && 
        user.availabilityStatus === 'available'
      )),
      delay(300)
    );
  }

  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Observable<User> {
    const newUser: User = {
      ...user,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const currentUsers = this.usersSubject.value;
    const updatedUsers = [...currentUsers, newUser];
    
    this.updateUsers(updatedUsers);
    return of(newUser).pipe(delay(500));
  }

  updateUser(id: string, updates: Partial<User>): Observable<User> {
    const currentUsers = this.usersSubject.value;
    const userIndex = currentUsers.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      throw new Error('Usuário não encontrado');
    }
    
    const updatedUser = { 
      ...currentUsers[userIndex], 
      ...updates, 
      updatedAt: new Date() 
    };
    const updatedUsers = [...currentUsers];
    updatedUsers[userIndex] = updatedUser;
    
    this.updateUsers(updatedUsers);
    return of(updatedUser).pipe(delay(500));
  }

  deleteUser(id: string): Observable<boolean> {
    const currentUsers = this.usersSubject.value;
    const updatedUsers = currentUsers.filter(user => user.id !== id);
    
    this.updateUsers(updatedUsers);
    return of(true).pipe(delay(300));
  }

  updateUserAvailability(id: string, status: 'available' | 'busy' | 'unavailable'): Observable<User> {
    return this.updateUser(id, { availabilityStatus: status });
  }

  // Skills
  getSkills(): Observable<Skill[]> {
    return this.skills$.pipe(delay(200));
  }

  createSkill(skill: Omit<Skill, 'id'>): Observable<Skill> {
    const newSkill: Skill = {
      ...skill,
      id: this.generateId()
    };
    
    const currentSkills = this.skillsSubject.value;
    const updatedSkills = [...currentSkills, newSkill];
    
    this.updateSkills(updatedSkills);
    return of(newSkill).pipe(delay(300));
  }

  addSkillToUser(userId: string, skillName: string, level: 'beginner' | 'intermediate' | 'advanced' | 'expert'): Observable<User> {
    const currentUsers = this.usersSubject.value;
    const user = currentUsers.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    const existingSkillIndex = user.skills.findIndex(s => s.name === skillName);
    
    if (existingSkillIndex >= 0) {
      // Atualizar nível da skill existente
      user.skills[existingSkillIndex].level = level;
    } else {
      // Adicionar nova skill
      const newSkill: Skill = {
        id: this.generateId(),
        userId: userId,
        name: skillName,
        level: level,
        acquiredDate: new Date()
      };
      user.skills.push(newSkill);
    }
    
    return this.updateUser(userId, { skills: user.skills });
  }

  removeSkillFromUser(userId: string, skillName: string): Observable<User> {
    const currentUsers = this.usersSubject.value;
    const user = currentUsers.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    const updatedSkills = user.skills.filter(s => s.name !== skillName);
    return this.updateUser(userId, { skills: updatedSkills });
  }

  searchUsersBySkill(skillName: string, minLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'beginner'): Observable<User[]> {
    const levelOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
    const minLevelValue = levelOrder[minLevel];
    
    return this.users$.pipe(
      map(users => users.filter(user => 
        user.skills.some(skill => 
          skill.name === skillName && levelOrder[skill.level] >= minLevelValue
        )
      )),
      delay(300)
    );
  }

  private updateUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    this.usersSubject.next(users);
  }

  private updateSkills(skills: Skill[]): void {
    localStorage.setItem(this.SKILLS_KEY, JSON.stringify(skills));
    this.skillsSubject.next(skills);
  }

  private loadMockData(): void {
    const storedUsers = localStorage.getItem(this.USERS_KEY);
    const storedSkills = localStorage.getItem(this.SKILLS_KEY);

    if (storedUsers && storedSkills) {
      this.usersSubject.next(JSON.parse(storedUsers));
      this.skillsSubject.next(JSON.parse(storedSkills));
    } else {
      this.initializeMockData();
    }
  }

  private initializeMockData(): void {
    const mockSkills: any[] = [
      { id: '1', name: 'Angular', category: 'Frontend' },
      { id: '2', name: 'React', category: 'Frontend' },
      { id: '3', name: 'Vue.js', category: 'Frontend' },
      { id: '4', name: 'Node.js', category: 'Backend' },
      { id: '5', name: 'Python', category: 'Backend' },
      { id: '6', name: 'Java', category: 'Backend' },
      { id: '7', name: 'PostgreSQL', category: 'Database' },
      { id: '8', name: 'MongoDB', category: 'Database' },
      { id: '9', name: 'AWS', category: 'Cloud' },
      { id: '10', name: 'Docker', category: 'DevOps' },
      { id: '11', name: 'UI/UX Design', category: 'Design' },
      { id: '12', name: 'Project Management', category: 'Management' }
    ];

    const mockUsers: User[] = [
      {
        id: '1',
        email: 'admin@projectflow.com',
        name: 'Administrador',
        role: UserRole.ADMIN,
        hourlyRate: 150,
        availability: 'available',
        availabilityStatus: 'available',
        rating: 5.0,
        experience: 10,
        skills: [
          { id: 's1', userId: '1', name: 'Project Management', level: 'expert', acquiredDate: new Date('2023-01-01') }
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        email: 'joao.silva@projectflow.com',
        name: 'João Silva',
        role: UserRole.MANAGER,
        hourlyRate: 120,
        availability: 'busy',
        availabilityStatus: 'busy',
        rating: 4.8,
        experience: 8,
        skills: [
          { id: 's2', userId: '2', name: 'Angular', level: 'expert', acquiredDate: new Date('2022-01-01') },
          { id: 's3', userId: '2', name: 'Node.js', level: 'advanced', acquiredDate: new Date('2022-06-01') },
          { id: 's4', userId: '2', name: 'PostgreSQL', level: 'advanced', acquiredDate: new Date('2022-03-01') },
          { id: 's5', userId: '2', name: 'Project Management', level: 'expert', acquiredDate: new Date('2021-01-01') }
        ],
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '3',
        email: 'maria.santos@projectflow.com',
        name: 'Maria Santos',
        role: UserRole.CONSULTANT,
        hourlyRate: 80,
        availability: 'available',
        availabilityStatus: 'available',
        rating: 4.5,
        experience: 5,
        skills: [
          { id: 's6', userId: '3', name: 'React', level: 'expert', acquiredDate: new Date('2022-02-01') },
          { id: 's7', userId: '3', name: 'Node.js', level: 'intermediate', acquiredDate: new Date('2022-08-01') },
          { id: 's8', userId: '3', name: 'MongoDB', level: 'advanced', acquiredDate: new Date('2022-04-01') },
          { id: 's9', userId: '3', name: 'UI/UX Design', level: 'advanced', acquiredDate: new Date('2021-06-01') }
        ],
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-10')
      },
      {
        id: '4',
        email: 'pedro.oliveira@projectflow.com',
        name: 'Pedro Oliveira',
        role: UserRole.CONSULTANT,
        hourlyRate: 90,
        availability: 'available',
        availabilityStatus: 'available',
        rating: 4.7,
        experience: 6,
        skills: [
          { id: 's10', userId: '4', name: 'Python', level: 'expert', acquiredDate: new Date('2021-01-01') },
          { id: 's11', userId: '4', name: 'Java', level: 'advanced', acquiredDate: new Date('2021-06-01') },
          { id: 's12', userId: '4', name: 'PostgreSQL', level: 'expert', acquiredDate: new Date('2020-01-01') },
          { id: 's13', userId: '4', name: 'AWS', level: 'intermediate', acquiredDate: new Date('2022-01-01') }
        ],
        createdAt: new Date('2024-01-04'),
        updatedAt: new Date('2024-01-12')
      },
      {
        id: '5',
        email: 'ana.costa@projectflow.com',
        name: 'Ana Costa',
        role: UserRole.CONSULTANT,
        hourlyRate: 85,
        availability: 'unavailable',
        availabilityStatus: 'unavailable',
        rating: 4.6,
        experience: 7,
        skills: [
          { id: 's14', userId: '5', name: 'Vue.js', level: 'advanced', acquiredDate: new Date('2022-03-01') },
          { id: 's15', userId: '5', name: 'Node.js', level: 'advanced', acquiredDate: new Date('2022-01-01') },
          { id: 's16', userId: '5', name: 'Docker', level: 'intermediate', acquiredDate: new Date('2022-09-01') },
          { id: 's17', userId: '5', name: 'UI/UX Design', level: 'expert', acquiredDate: new Date('2021-01-01') }
        ],
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: '6',
        email: 'carlos.oliveira@empresa.com',
        name: 'Carlos Oliveira',
        role: UserRole.CLIENT,
        hourlyRate: 0,
        availability: 'available',
        availabilityStatus: 'available',
        rating: 0,
        experience: 0,
        skills: [],
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10')
      }
    ];

    this.updateSkills(mockSkills);
    this.updateUsers(mockUsers);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}