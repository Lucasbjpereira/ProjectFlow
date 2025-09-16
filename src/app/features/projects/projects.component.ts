import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { ProjectService } from '../../core/services/project.service';
import { Project, Client, Contract } from '../../core/models';
import { ProjectFormComponent } from './project-form/project-form.component';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ProjectFormComponent
  ],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit, OnChanges {
  @Input() clientId?: string;

  projects$ = new BehaviorSubject<Project[]>([]);
  clients$ = new BehaviorSubject<Client[]>([]);
  contracts$ = new BehaviorSubject<Contract[]>([]);
  
  filteredProjects$: Observable<Project[]>;
  
  displayMode: 'list' | 'grid' = 'list';
  isModalOpen = false;
  projectToEdit: Project | null = null;

  constructor(private projectService: ProjectService) {
    this.filteredProjects$ = this.projects$.asObservable();
  }
  
  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clientId']) {
      this.updateProjectFilter();
    }
  }

  setViewMode(mode: 'list' | 'grid'): void {
    this.displayMode = mode;
  }
  
  private async loadData(): Promise<void> {
    try {
      const [projects, clients, contracts] = await Promise.all([
        this.projectService.getProjects().toPromise(),
        this.projectService.getClients().toPromise(),
        this.projectService.getContracts().toPromise()
      ]);
      
      this.projects$.next(projects || []);
      this.clients$.next(clients || []);
      this.contracts$.next(contracts || []);

      this.updateProjectFilter();

    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  private updateProjectFilter(): void {
    this.filteredProjects$ = this.projects$.pipe(
      map(projects => {
        if (this.clientId) {
          return projects.filter(p => p.clientId === this.clientId);
        }
        return projects;
      })
    );
  }

  openModal(project?: Project): void {
    this.projectToEdit = project || null;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.projectToEdit = null;
  }

  async handleSave(project: Project): Promise<void> {
    try {
      if (this.projectToEdit && project.id) {
        // Update
        await this.projectService.updateProject(project.id, project).toPromise();
      } else {
        // Create
        await this.projectService.createProject(project).toPromise();
      }
      this.closeModal();
      this.loadData(); // Recarrega os dados para exibir as alterações
    } catch (error) {
      console.error('Error saving project:', error);
    }
  }

  getClientName(clientId: string): string {
    const client = this.clients$.value.find(c => c.id === clientId);
    return client?.name || 'N/A';
  }

  getContractNumber(contractId: string): string {
    const contract = this.contracts$.value.find(c => c.id === contractId);
    return contract?.contractNumber || 'N/A';
  }
}
