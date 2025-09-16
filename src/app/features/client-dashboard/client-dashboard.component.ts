import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Client } from '../../core/models';
import { ClientService } from '../../core/services';
import { ProjectsComponent } from '../projects/projects.component';
import { ClientFormComponent } from './client-form/client-form.component';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, ProjectsComponent, ClientFormComponent],
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.scss']
})
export class ClientDashboardComponent implements OnInit {
  clients$!: Observable<Client[]>;
  selectedClient: Client | null = null;
  isModalOpen = false;
  clientToEdit: Client | null = null;

  constructor(private clientService: ClientService) { }

  ngOnInit(): void {
    this.clients$ = this.clientService.getClients();
  }

  selectClient(client: Client): void {
    this.selectedClient = client;
  }

  clearSelection(): void {
    this.selectedClient = null;
  }

  openModal(client: Client | null = null): void {
    this.clientToEdit = client;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.clientToEdit = null;
  }

  saveClient(clientData: Partial<Client>): void {
    const operation$ = this.clientToEdit
      ? this.clientService.updateClient(this.clientToEdit.id, clientData)
      : this.clientService.createClient(clientData as Client);

    operation$.subscribe({
      next: () => {
        this.clients$ = this.clientService.getClients();
        this.closeModal();
      },
      error: (err: any) => console.error('Failed to save client', err)
    });
  }
}
