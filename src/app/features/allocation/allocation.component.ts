import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipInputEvent } from '@angular/material/chips';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  skills: string[];
  hourlyRate: number;
  availability: number; // percentage
  currentProjects: string[];
  totalHours: number;
  billableHours: number;
  avatar?: string;
  status: 'available' | 'busy' | 'unavailable';
  location: string;
  timezone: string;
}

interface Project {
  id: string;
  name: string;
  client: string;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiredSkills: string[];
  estimatedHours: number;
  allocatedHours: number;
  budget: number;
  progress: number;
}

interface Allocation {
  id: string;
  memberId: string;
  projectId: string;
  role: string;
  startDate: Date;
  endDate: Date;
  hoursPerWeek: number;
  hourlyRate: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  notes?: string;
}

interface ResourceMetrics {
  totalMembers: number;
  availableMembers: number;
  utilizationRate: number;
  billableRate: number;
  averageHourlyRate: number;
  totalCapacity: number;
  allocatedCapacity: number;
}

interface SkillDemand {
  skill: string;
  demand: number;
  supply: number;
  gap: number;
  projects: string[];
}

@Component({
  selector: 'app-allocation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatCardModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatBadgeModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    DecimalPipe
  ],
  templateUrl: './allocation.component.html',
  styleUrls: ['./allocation.component.scss']
})
export class AllocationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data
  teamMembers: TeamMember[] = [];
  projects: Project[] = [];
  allocations: Allocation[] = [];
  metrics: ResourceMetrics = {
    totalMembers: 0,
    availableMembers: 0,
    utilizationRate: 0,
    billableRate: 0,
    averageHourlyRate: 0,
    totalCapacity: 0,
    allocatedCapacity: 0
  };
  skillDemands: SkillDemand[] = [];
  
  // UI State
  selectedTab = 0;
  loading = false;
  showAllocationDialog = false;
  showMemberDialog = false;
  editingAllocation: Allocation | null = null;
  editingMember: TeamMember | null = null;
  
  // Forms
  allocationForm!: FormGroup;
  memberForm!: FormGroup;
  
  // Filters
  departmentFilter = '';
  skillFilter = '';
  statusFilter = '';
  projectFilter = '';
  
  // Charts
  utilizationChart: Chart | null = null;
  skillsChart: Chart | null = null;
  capacityChart: Chart | null = null;
  
  // View options
  viewMode: 'grid' | 'timeline' | 'calendar' = 'grid';
  timeRange: 'week' | 'month' | 'quarter' = 'month';
  
  constructor(private fb: FormBuilder) {
    this.initializeForms();
  }
  
  ngOnInit(): void {
    this.loadData();
    this.calculateMetrics();
    this.analyzeSkillDemand();
    setTimeout(() => this.initializeCharts(), 100);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }
  
  private initializeForms(): void {
    this.allocationForm = this.fb.group({
      memberId: ['', Validators.required],
      projectId: ['', Validators.required],
      role: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      hoursPerWeek: [40, [Validators.required, Validators.min(1), Validators.max(60)]],
      hourlyRate: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });
    
    this.memberForm = this.fb.group({
      name: ['', Validators.required],
      role: ['', Validators.required],
      department: ['', Validators.required],
      skills: [[]],
      hourlyRate: [0, [Validators.required, Validators.min(0)]],
      availability: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
      location: ['', Validators.required],
      timezone: ['', Validators.required]
    });
  }
  
  private loadData(): void {
    this.loading = true;
    
    // Mock data - replace with actual API calls
    this.teamMembers = [
      {
        id: '1',
        name: 'Ana Silva',
        role: 'Senior Developer',
        department: 'Engineering',
        skills: ['Angular', 'TypeScript', 'Node.js', 'AWS'],
        hourlyRate: 85,
        availability: 80,
        currentProjects: ['proj-1', 'proj-2'],
        totalHours: 160,
        billableHours: 128,
        status: 'busy',
        location: 'São Paulo',
        timezone: 'GMT-3'
      },
      {
        id: '2',
        name: 'Carlos Santos',
        role: 'UX Designer',
        department: 'Design',
        skills: ['Figma', 'Sketch', 'Prototyping', 'User Research'],
        hourlyRate: 75,
        availability: 100,
        currentProjects: ['proj-3'],
        totalHours: 160,
        billableHours: 160,
        status: 'available',
        location: 'Rio de Janeiro',
        timezone: 'GMT-3'
      },
      {
        id: '3',
        name: 'Maria Oliveira',
        role: 'Project Manager',
        department: 'Management',
        skills: ['Scrum', 'Kanban', 'Risk Management', 'Stakeholder Management'],
        hourlyRate: 90,
        availability: 60,
        currentProjects: ['proj-1', 'proj-4'],
        totalHours: 160,
        billableHours: 96,
        status: 'busy',
        location: 'Brasília',
        timezone: 'GMT-3'
      }
    ];
    
    this.projects = [
      {
        id: 'proj-1',
        name: 'E-commerce Platform',
        client: 'TechCorp',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-30'),
        status: 'active',
        priority: 'high',
        requiredSkills: ['Angular', 'Node.js', 'AWS'],
        estimatedHours: 800,
        allocatedHours: 640,
        budget: 120000,
        progress: 65
      },
      {
        id: 'proj-2',
        name: 'Mobile App Redesign',
        client: 'StartupXYZ',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-04-30'),
        status: 'active',
        priority: 'medium',
        requiredSkills: ['React Native', 'UI/UX', 'Figma'],
        estimatedHours: 400,
        allocatedHours: 320,
        budget: 60000,
        progress: 40
      }
    ];
    
    this.allocations = [
      {
        id: '1',
        memberId: '1',
        projectId: 'proj-1',
        role: 'Lead Developer',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-30'),
        hoursPerWeek: 32,
        hourlyRate: 85,
        status: 'active'
      },
      {
        id: '2',
        memberId: '2',
        projectId: 'proj-2',
        role: 'UX Designer',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-04-30'),
        hoursPerWeek: 40,
        hourlyRate: 75,
        status: 'active'
      }
    ];
    
    this.loading = false;
  }
  
  private calculateMetrics(): void {
    this.metrics = {
      totalMembers: this.teamMembers.length,
      availableMembers: this.teamMembers.filter(m => m.status === 'available').length,
      utilizationRate: this.teamMembers.reduce((sum, m) => sum + (100 - m.availability), 0) / this.teamMembers.length,
      billableRate: this.teamMembers.reduce((sum, m) => sum + (m.billableHours / m.totalHours * 100), 0) / this.teamMembers.length,
      averageHourlyRate: this.teamMembers.reduce((sum, m) => sum + m.hourlyRate, 0) / this.teamMembers.length,
      totalCapacity: this.teamMembers.reduce((sum, m) => sum + m.totalHours, 0),
      allocatedCapacity: this.teamMembers.reduce((sum, m) => sum + m.billableHours, 0)
    };
  }
  
  private analyzeSkillDemand(): void {
    const skillMap = new Map<string, { demand: number; supply: number; projects: string[] }>();
    
    // Calculate demand from projects
    this.projects.forEach(project => {
      project.requiredSkills.forEach(skill => {
        if (!skillMap.has(skill)) {
          skillMap.set(skill, { demand: 0, supply: 0, projects: [] });
        }
        const data = skillMap.get(skill)!;
        data.demand += 1;
        data.projects.push(project.name);
      });
    });
    
    // Calculate supply from team members
    this.teamMembers.forEach(member => {
      member.skills.forEach(skill => {
        if (!skillMap.has(skill)) {
          skillMap.set(skill, { demand: 0, supply: 0, projects: [] });
        }
        skillMap.get(skill)!.supply += 1;
      });
    });
    
    this.skillDemands = Array.from(skillMap.entries()).map(([skill, data]) => ({
      skill,
      demand: data.demand,
      supply: data.supply,
      gap: data.demand - data.supply,
      projects: data.projects
    })).sort((a, b) => b.gap - a.gap);
  }
  
  private initializeCharts(): void {
    this.createUtilizationChart();
    this.createSkillsChart();
    this.createCapacityChart();
  }
  
  private createUtilizationChart(): void {
    const ctx = document.getElementById('utilizationChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    const data = this.teamMembers.map(member => ({
      name: member.name,
      utilization: 100 - member.availability
    }));
    
    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: {
        labels: data.map(d => d.name),
        datasets: [{
          label: 'Utilização (%)',
          data: data.map(d => d.utilization),
          backgroundColor: '#2563eb',
          borderColor: '#1d4ed8',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    };
    
    this.utilizationChart = new Chart(ctx, config);
  }
  
  private createSkillsChart(): void {
    const ctx = document.getElementById('skillsChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    const topSkills = this.skillDemands.slice(0, 8);
    
    const config: ChartConfiguration = {
      type: 'doughnut' as ChartType,
      data: {
        labels: topSkills.map(s => s.skill),
        datasets: [{
          label: 'Demanda',
          data: topSkills.map(s => s.demand),
          backgroundColor: [
            '#2563eb', '#7c3aed', '#dc2626', '#ea580c',
            '#ca8a04', '#16a34a', '#0891b2', '#c2410c'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    };
    
    this.skillsChart = new Chart(ctx, config);
  }
  
  private createCapacityChart(): void {
    const ctx = document.getElementById('capacityChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    const config: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [
          {
            label: 'Capacidade Total',
            data: [1600, 1600, 1600, 1600, 1600, 1600],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true
          },
          {
            label: 'Capacidade Alocada',
            data: [1200, 1350, 1400, 1450, 1500, 1520],
            borderColor: '#dc2626',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };
    
    this.capacityChart = new Chart(ctx, config);
  }
  
  private destroyCharts(): void {
    if (this.utilizationChart) {
      this.utilizationChart.destroy();
    }
    if (this.skillsChart) {
      this.skillsChart.destroy();
    }
    if (this.capacityChart) {
      this.capacityChart.destroy();
    }
  }
  
  // Event Handlers
  onTabChange(index: number): void {
    this.selectedTab = index;
    setTimeout(() => this.initializeCharts(), 100);
  }
  
  onViewModeChange(mode: 'grid' | 'timeline' | 'calendar'): void {
    this.viewMode = mode;
  }
  
  onTimeRangeChange(range: 'week' | 'month' | 'quarter'): void {
    this.timeRange = range;
    this.initializeCharts();
  }
  
  openAllocationDialog(allocation?: Allocation): void {
    this.editingAllocation = allocation || null;
    if (allocation) {
      this.allocationForm.patchValue(allocation);
    } else {
      this.allocationForm.reset();
    }
    this.showAllocationDialog = true;
  }
  
  closeAllocationDialog(): void {
    this.showAllocationDialog = false;
    this.editingAllocation = null;
    this.allocationForm.reset();
  }
  
  saveAllocation(): void {
    if (this.allocationForm.valid) {
      const formValue = this.allocationForm.value;
      
      if (this.editingAllocation) {
        // Update existing allocation
        const index = this.allocations.findIndex(a => a.id === this.editingAllocation!.id);
        if (index !== -1) {
          this.allocations[index] = { ...this.editingAllocation, ...formValue };
        }
      } else {
        // Create new allocation
        const newAllocation: Allocation = {
          id: Date.now().toString(),
          ...formValue,
          status: 'planned' as const
        };
        this.allocations.push(newAllocation);
      }
      
      this.calculateMetrics();
      this.closeAllocationDialog();
    }
  }
  
  deleteAllocation(allocation: Allocation): void {
    if (confirm('Tem certeza que deseja excluir esta alocação?')) {
      this.allocations = this.allocations.filter(a => a.id !== allocation.id);
      this.calculateMetrics();
    }
  }
  
  openMemberDialog(member?: TeamMember): void {
    this.editingMember = member || null;
    if (member) {
      this.memberForm.patchValue(member);
    } else {
      this.memberForm.reset();
    }
    this.showMemberDialog = true;
  }
  
  closeMemberDialog(): void {
    this.showMemberDialog = false;
    this.editingMember = null;
    this.memberForm.reset();
  }
  
  saveMember(): void {
    if (this.memberForm.valid) {
      const formValue = this.memberForm.value;
      
      if (this.editingMember) {
        // Update existing member
        const index = this.teamMembers.findIndex(m => m.id === this.editingMember!.id);
        if (index !== -1) {
          this.teamMembers[index] = { ...this.editingMember, ...formValue };
        }
      } else {
        // Create new member
        const newMember: TeamMember = {
          id: Date.now().toString(),
          ...formValue,
          currentProjects: [],
          totalHours: 160,
          billableHours: 0,
          status: 'available' as const
        };
        this.teamMembers.push(newMember);
      }
      
      this.calculateMetrics();
      this.analyzeSkillDemand();
      this.closeMemberDialog();
    }
  }
  
  deleteMember(member: TeamMember): void {
    if (confirm('Tem certeza que deseja excluir este membro da equipe?')) {
      this.teamMembers = this.teamMembers.filter(m => m.id !== member.id);
      this.allocations = this.allocations.filter(a => a.memberId !== member.id);
      this.calculateMetrics();
      this.analyzeSkillDemand();
    }
  }
  
  exportData(): void {
    const data = {
      teamMembers: this.teamMembers,
      projects: this.projects,
      allocations: this.allocations,
      metrics: this.metrics,
      skillDemands: this.skillDemands,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `allocation-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
  
  // Getters
  get filteredMembers(): TeamMember[] {
    return this.teamMembers.filter(member => {
      const matchesDepartment = !this.departmentFilter || member.department === this.departmentFilter;
      const matchesSkill = !this.skillFilter || member.skills.includes(this.skillFilter);
      const matchesStatus = !this.statusFilter || member.status === this.statusFilter;
      return matchesDepartment && matchesSkill && matchesStatus;
    });
  }
  
  get filteredAllocations(): Allocation[] {
    return this.allocations.filter(allocation => {
      const matchesProject = !this.projectFilter || allocation.projectId === this.projectFilter;
      return matchesProject;
    });
  }
  
  get departments(): string[] {
    return [...new Set(this.teamMembers.map(m => m.department))];
  }
  
  get skills(): string[] {
    return [...new Set(this.teamMembers.flatMap(m => m.skills))];
  }
  
  getMemberName(memberId: string): string {
    const member = this.teamMembers.find(m => m.id === memberId);
    return member ? member.name : 'Unknown';
  }
  
  getProjectName(projectId: string): string {
    const project = this.projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown';
  }
  
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'available': '#10b981',
      'busy': '#f59e0b',
      'unavailable': '#ef4444',
      'planned': '#6b7280',
      'active': '#2563eb',
      'completed': '#10b981',
      'cancelled': '#ef4444'
    };
    return colors[status] || '#6b7280';
  }
  
  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      'low': '#10b981',
      'medium': '#f59e0b',
      'high': '#ef4444',
      'critical': '#dc2626'
    };
    return colors[priority] || '#6b7280';
  }

  addSkill(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      console.log('Adding skill:', value);
      // Implementar lógica para adicionar skill
    }
    event.chipInput!.clear();
  }

  removeSkill(skill: string): void {
    if (skill) {
      // Remove skill logic here
      console.log('Removing skill:', skill);
    }
  }
}