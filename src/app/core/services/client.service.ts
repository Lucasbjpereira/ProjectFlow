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
}
