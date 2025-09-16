import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Client } from '../models';
import { ProjectService } from './project.service';

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  constructor(private projectService: ProjectService) { }

  getClients(): Observable<Client[]> {
    return this.projectService.getClients();
  }

  getClientById(id: string): Observable<Client | undefined> {
    return this.projectService.getClientById(id);
  }

  createClient(client: Omit<Client, 'id' | 'createdAt'>): Observable<Client> {
    return this.projectService.createClient(client);
  }

  updateClient(id: string, updates: Partial<Client>): Observable<Client | null> {
    return this.projectService.updateClient(id, updates);
  }
}
