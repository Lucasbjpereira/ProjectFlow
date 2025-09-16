import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Client } from '../../core/models';
import { ProjectService } from '../../core/services';
import { ProjectsComponent } from '../projects/projects.component';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, ProjectsComponent],
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.scss']
})
export class ClientDashboardComponent implements OnInit {
  clients$!: Observable<Client[]>;
  selectedClient: Client | null = null;

  constructor(private projectService: ProjectService) { }

  ngOnInit(): void {
    this.clients$ = this.projectService.getClients();
  }

  selectClient(client: Client): void {
    this.selectedClient = client;
  }

  clearSelection(): void {
    this.selectedClient = null;
  }
}
