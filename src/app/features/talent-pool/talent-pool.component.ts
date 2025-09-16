import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSliderModule } from '@angular/material/slider';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { UserService } from '../../core/services/user.service';
import { User, UserRole, UserSkill, Skill } from '../../core/models';

@Component({
  selector: 'app-talent-pool',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTabsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatSliderModule
  ],
  templateUrl: './talent-pool.component.html',
  styleUrls: ['./talent-pool.component.scss']
})
export class TalentPoolComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data sources
  dataSource = new MatTableDataSource<User>();
  availableUsers: User[] = [];
  filteredUsers: User[] = [];
  
  // Form controls
  searchForm!: FormGroup;
  userForm!: FormGroup;
  
  // UI state
  isLoading = false;
  selectedUser: User | null = null;
  isEditMode = false;
  selectedTabIndex = 0;
  
  // Table configuration
  displayedColumns: string[] = ['avatar', 'name', 'role', 'skills', 'availability', 'hourlyRate', 'rating', 'actions'];
  
  // Filter options
  roles = Object.values(UserRole);
  availabilityOptions = [
    { value: 'available', label: 'Disponível' },
    { value: 'busy', label: 'Ocupado' },
    { value: 'unavailable', label: 'Indisponível' }
  ];
  
  skillLevels = [
    { value: 1, label: 'Iniciante' },
    { value: 2, label: 'Básico' },
    { value: 3, label: 'Intermediário' },
    { value: 4, label: 'Avançado' },
    { value: 5, label: 'Expert' }
  ];
  
  // Statistics
  stats = {
    total: 0,
    available: 0,
    busy: 0,
    avgRating: 0,
    topSkills: [] as { skill: string; count: number }[]
  };
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.initializeForms();
  }
  
  ngOnInit(): void {
    this.loadUsers();
    this.setupSearch();
    this.calculateStats();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initializeForms(): void {
    this.searchForm = this.fb.group({
      search: [''],
      role: [''],
      availability: [''],
      skills: [''],
      minRating: [0],
      maxHourlyRate: [1000]
    });
    
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      hourlyRate: [0, [Validators.required, Validators.min(0)]],
      availability: ['available', Validators.required],
      skills: [[]],
      bio: [''],
      phone: [''],
      location: [''],
      experience: [0, [Validators.min(0)]]
    });
  }
  
  private setupSearch(): void {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }
  
  private loadUsers(): void {
    this.isLoading = true;
    
    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.availableUsers = users;
          this.filteredUsers = [...users];
          this.dataSource.data = this.filteredUsers;
          this.setupTableFeatures();
          this.calculateStats();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar usuários:', error);
          this.showMessage('Erro ao carregar usuários', 'error');
          this.isLoading = false;
        }
      });
  }
  
  private setupTableFeatures(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
    
    // Custom filter predicate
    this.dataSource.filterPredicate = (data: User, filter: string) => {
      const searchTerm = filter.toLowerCase();
      return data.name.toLowerCase().includes(searchTerm) ||
             data.email.toLowerCase().includes(searchTerm) ||
             data.role.toLowerCase().includes(searchTerm) ||
             data.skills.some((skill: Skill) => skill.name.toLowerCase().includes(searchTerm));
    };
  }
  
  private applyFilters(): void {
    const filters = this.searchForm.value;
    
    this.filteredUsers = this.availableUsers.filter(user => {
      // Text search
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = user.name.toLowerCase().includes(searchTerm) ||
                            user.email.toLowerCase().includes(searchTerm) ||
                            user.skills.some((skill: Skill) => skill.name.toLowerCase().includes(searchTerm));
        if (!matchesSearch) return false;
      }
      
      // Role filter
      if (filters.role && user.role !== filters.role) {
        return false;
      }
      
      // Availability filter
      if (filters.availability && user.availability !== filters.availability) {
        return false;
      }
      
      // Skills filter
      if (filters.skills) {
        const requiredSkills = filters.skills.toLowerCase();
        const hasSkill = user.skills.some((skill: Skill) => 
          skill.name.toLowerCase().includes(requiredSkills)
        );
        if (!hasSkill) return false;
      }
      
      // Rating filter
      if (filters.minRating && user.rating < filters.minRating) {
        return false;
      }
      
      // Hourly rate filter
      if (filters.maxHourlyRate && user.hourlyRate > filters.maxHourlyRate) {
        return false;
      }
      
      return true;
    });
    
    this.dataSource.data = this.filteredUsers;
    this.calculateStats();
  }
  
  private calculateStats(): void {
    const users = this.filteredUsers;
    
    this.stats.total = users.length;
    this.stats.available = users.filter(u => u.availability === 'available').length;
    this.stats.busy = users.filter(u => u.availability === 'busy').length;
    this.stats.avgRating = users.length > 0 ? 
      users.reduce((sum, u) => sum + u.rating, 0) / users.length : 0;
    
    // Calculate top skills
    const skillCounts = new Map<string, number>();
    users.forEach(user => {
      user.skills.forEach((skill: Skill) => {
        skillCounts.set(skill.name, (skillCounts.get(skill.name) || 0) + 1);
      });
    });
    
    this.stats.topSkills = Array.from(skillCounts.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
  
  // User management methods
  onAddUser(): void {
    this.selectedUser = null;
    this.isEditMode = false;
    this.userForm.reset({
      availability: 'available',
      skills: [],
      hourlyRate: 0,
      experience: 0
    });
    this.selectedTabIndex = 1;
  }
  
  onEditUser(user: User): void {
    this.selectedUser = user;
    this.isEditMode = true;
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      role: user.role,
      hourlyRate: user.hourlyRate,
      availability: user.availability,
      skills: user.skills,
      bio: user.bio,
      phone: user.phone,
      location: user.location,
      experience: user.experience
    });
    this.selectedTabIndex = 1;
  }
  
  onDeleteUser(user: User): void {
    if (confirm(`Tem certeza que deseja excluir ${user.name}?`)) {
      this.userService.deleteUser(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showMessage('Usuário excluído com sucesso!');
            this.loadUsers();
          },
          error: (error) => {
            console.error('Erro ao excluir usuário:', error);
            this.showMessage('Erro ao excluir usuário', 'error');
          }
        });
    }
  }
  
  onSaveUser(): void {
    if (this.userForm.valid) {
      const userData = this.userForm.value;
      
      const operation = this.isEditMode ?
        this.userService.updateUser(this.selectedUser!.id, userData) :
        this.userService.createUser(userData);
      
      operation.pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            const message = this.isEditMode ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!';
            this.showMessage(message);
            this.loadUsers();
            this.selectedTabIndex = 0;
          },
          error: (error) => {
            console.error('Erro ao salvar usuário:', error);
            this.showMessage('Erro ao salvar usuário', 'error');
          }
        });
    } else {
      this.showMessage('Por favor, preencha todos os campos obrigatórios', 'error');
    }
  }
  
  onCancelEdit(): void {
    this.selectedUser = null;
    this.isEditMode = false;
    this.userForm.reset();
    this.selectedTabIndex = 0;
  }
  
  // Skill management
  onAddSkill(skillName: string, level: number): void {
    if (skillName.trim()) {
      const currentSkills = this.userForm.get('skills')?.value || [];
      const newSkill: UserSkill = {
        name: skillName.trim(),
        level,
        verified: false
      };
      
      // Check if skill already exists
      const existingIndex = currentSkills.findIndex((s: UserSkill) => 
        s.name.toLowerCase() === newSkill.name.toLowerCase()
      );
      
      if (existingIndex >= 0) {
        currentSkills[existingIndex] = newSkill;
      } else {
        currentSkills.push(newSkill);
      }
      
      this.userForm.patchValue({ skills: currentSkills });
    }
  }
  
  onRemoveSkill(index: number): void {
    const currentSkills = this.userForm.get('skills')?.value || [];
    currentSkills.splice(index, 1);
    this.userForm.patchValue({ skills: currentSkills });
  }
  
  // Utility methods
  getSkillLevelText(level: number): string {
    const levelObj = this.skillLevels.find(l => l.value === level);
    return levelObj ? levelObj.label : 'Desconhecido';
  }
  
  getAvailabilityText(availability: string): string {
    const availObj = this.availabilityOptions.find(a => a.value === availability);
    return availObj ? availObj.label : availability;
  }
  
  getAvailabilityColor(availability: string): string {
    switch (availability) {
      case 'available': return 'success';
      case 'busy': return 'warning';
      case 'unavailable': return 'error';
      default: return 'default';
    }
  }
  
  getRatingStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('star');
    }
    
    if (hasHalfStar) {
      stars.push('star_half');
    }
    
    while (stars.length < 5) {
      stars.push('star_border');
    }
    
    return stars;
  }
  
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
  
  clearFilters(): void {
    this.searchForm.reset({
      search: '',
      role: '',
      availability: '',
      skills: '',
      minRating: 0,
      maxHourlyRate: 1000
    });
  }
  
  exportUsers(): void {
    // Implementar exportação de dados
    this.showMessage('Funcionalidade de exportação em desenvolvimento');
  }
  
  private showMessage(message: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: type === 'error' ? 'error-snackbar' : 'success-snackbar'
    });
  }
}