import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Project, Client, Contract } from '../../../core/models';
import { ProjectService } from '../../../core/services';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss']
})
export class ProjectFormComponent implements OnInit, OnChanges {
  @Input() project: Project | null = null;
  @Input() initialClientId?: string;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Project>();

  projectForm: FormGroup;
  clients$: Observable<Client[]>;
  contracts$: Observable<Contract[]>;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService
  ) {
    this.projectForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      clientId: ['', Validators.required],
      contractId: ['', Validators.required],
      description: ['', Validators.required],
      budgetHours: [0, [Validators.required, Validators.min(0)]],
      budgetAmount: [0, [Validators.required, Validators.min(0)]],
      spentHours: [0, [Validators.required, Validators.min(0)]],
      revenue: [0, [Validators.required, Validators.min(0)]],
      status: ['planning', Validators.required],
      priority: ['medium', Validators.required],
      startDate: [new Date().toISOString().split('T')[0], Validators.required],
      endDate: [new Date().toISOString().split('T')[0], Validators.required],
      technologies: ['']
    });

    this.clients$ = this.projectService.getClients();
    this.contracts$ = this.projectService.getContracts();
  }

  ngOnInit(): void {
    if (this.initialClientId) {
      this.projectForm.patchValue({ clientId: this.initialClientId });
      this.projectForm.get('clientId')?.disable();
    } else {
      this.projectForm.get('clientId')?.enable();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['project'] && this.project) {
      this.isEditMode = true;
      this.projectForm.patchValue({
        ...this.project,
        technologies: this.project.technologies?.join(', '),
        startDate: this.project.startDate ? new Date(this.project.startDate).toISOString().split('T')[0] : '',
        endDate: this.project.endDate ? new Date(this.project.endDate).toISOString().split('T')[0] : ''
      });
       if (this.initialClientId) {
        this.projectForm.get('clientId')?.disable();
      }
    } else {
      this.isEditMode = false;
      this.projectForm.reset({
        status: 'planning',
        priority: 'medium',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        clientId: this.initialClientId || ''
      });
    }
  }

  onSubmit(): void {
    if (this.projectForm.valid) {
      const formValue = this.projectForm.value;
      const projectData: Project = {
        ...this.project,
        ...formValue,
        technologies: formValue.technologies ? formValue.technologies.split(',').map((t: string) => t.trim()) : [],
        // Ensure fields that are not in the form but are required by the interface are handled
        id: this.project?.id || null,
        progress: this.project?.progress || 0,
        allocations: this.project?.allocations || [],
        tasks: this.project?.tasks || [],
        createdAt: this.project?.createdAt || new Date()
      };
      this.save.emit(projectData);
    }
  }
}
