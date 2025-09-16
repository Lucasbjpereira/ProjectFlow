import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Project, Client, Contract, ProjectAllocation } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly PROJECTS_KEY = 'projectflow_projects';
  private readonly CLIENTS_KEY = 'projectflow_clients';
  private readonly CONTRACTS_KEY = 'projectflow_contracts';
  
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  private clientsSubject = new BehaviorSubject<Client[]>([]);
  private contractsSubject = new BehaviorSubject<Contract[]>([]);
  
  public projects$ = this.projectsSubject.asObservable();
  public clients$ = this.clientsSubject.asObservable();
  public contracts$ = this.contractsSubject.asObservable();

  constructor() {
    this.loadMockData();
  }

  // Projects
  getProjects(): Observable<Project[]> {
    return this.projects$.pipe(delay(500));
  }

  getProjectById(id: string): Observable<Project | undefined> {
    return this.projects$.pipe(
      map(projects => projects.find(p => p.id === id)),
      delay(300)
    );
  }

  createProject(project: Omit<Project, 'id' | 'createdAt'>): Observable<Project> {
    const newProject: Project = {
      ...project,
      id: this.generateId(),
      createdAt: new Date()
    };
    
    const currentProjects = this.projectsSubject.value;
    const updatedProjects = [...currentProjects, newProject];
    
    this.updateProjects(updatedProjects);
    return of(newProject).pipe(delay(500));
  }

  updateProject(id: string, updates: Partial<Project>): Observable<Project> {
    const currentProjects = this.projectsSubject.value;
    const projectIndex = currentProjects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      throw new Error('Projeto não encontrado');
    }
    
    const updatedProject = { ...currentProjects[projectIndex], ...updates };
    const updatedProjects = [...currentProjects];
    updatedProjects[projectIndex] = updatedProject;
    
    this.updateProjects(updatedProjects);
    return of(updatedProject).pipe(delay(500));
  }

  deleteProject(id: string): Observable<boolean> {
    const currentProjects = this.projectsSubject.value;
    const updatedProjects = currentProjects.filter(p => p.id !== id);
    
    this.updateProjects(updatedProjects);
    return of(true).pipe(delay(500));
  }

  // Clients
  getClients(): Observable<Client[]> {
    return this.clients$.pipe(delay(300));
  }

  getClientById(id: string): Observable<Client | undefined> {
    return this.clients$.pipe(
      map(clients => clients.find(c => c.id === id)),
      delay(300)
    );
  }

  createClient(client: Omit<Client, 'id' | 'createdAt'>): Observable<Client> {
    const newClient: Client = {
      ...client,
      id: this.generateId(),
      createdAt: new Date()
    };
    
    const currentClients = this.clientsSubject.value;
    const updatedClients = [...currentClients, newClient];
    
    this.updateClients(updatedClients);
    return of(newClient).pipe(delay(500));
  }

  updateClient(id: string, updates: Partial<Client>): Observable<Client | null> {
    const currentClients = this.clientsSubject.value;
    const clientIndex = currentClients.findIndex(c => c.id === id);

    if (clientIndex === -1) {
      return of(null);
    }

    const updatedClient = { ...currentClients[clientIndex], ...updates };
    const updatedClients = [...currentClients];
    updatedClients[clientIndex] = updatedClient;

    this.updateClients(updatedClients);
    return of(updatedClient).pipe(delay(500));
  }

  deleteClient(id: string): Observable<boolean> {
    const currentClients = this.clientsSubject.value;
    const updatedClients = currentClients.filter(c => c.id !== id);

    this.updateClients(updatedClients);
    return of(true).pipe(delay(500));
  }

  // Contracts
  getContracts(): Observable<Contract[]> {
    return this.contracts$.pipe(delay(300));
  }

  createContract(contract: Omit<Contract, 'id'>): Observable<Contract> {
    const newContract: Contract = {
      ...contract,
      id: this.generateId()
    };
    
    const currentContracts = this.contractsSubject.value;
    const updatedContracts = [...currentContracts, newContract];
    
    this.updateContracts(updatedContracts);
    return of(newContract).pipe(delay(500));
  }

  private updateProjects(projects: Project[]): void {
    localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));
    this.projectsSubject.next(projects);
  }

  private updateClients(clients: Client[]): void {
    localStorage.setItem(this.CLIENTS_KEY, JSON.stringify(clients));
    this.clientsSubject.next(clients);
  }

  private updateContracts(contracts: Contract[]): void {
    localStorage.setItem(this.CONTRACTS_KEY, JSON.stringify(contracts));
    this.contractsSubject.next(contracts);
  }

  private loadMockData(): void {
    // Carregar dados do localStorage ou usar dados mock
    const storedProjects = localStorage.getItem(this.PROJECTS_KEY);
    const storedClients = localStorage.getItem(this.CLIENTS_KEY);
    const storedContracts = localStorage.getItem(this.CONTRACTS_KEY);

    if (storedProjects && storedClients && storedContracts) {
      this.projectsSubject.next(JSON.parse(storedProjects));
      this.clientsSubject.next(JSON.parse(storedClients));
      this.contractsSubject.next(JSON.parse(storedContracts));
    } else {
      this.initializeMockData();
    }
  }

  private initializeMockData(): void {
    const mockClients: Client[] = [
      {
        id: '1',
        name: 'Innova Corp',
        email: 'contact@innovacorp.com',
        phone: '+1 (555) 123-4567',
        address: '123 Tech Street, Silicon Valley, CA 94000',
        contactPerson: 'John Smith',
        projects: [],
        createdAt: new Date('2024-01-15'),
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAb0jOv_-44hGgh8fK5XrdmBr2xpQ_Q8bcbGFl1xBk1YZJTql3ugxgWmWzvWfnG_On8HczYcxu3jbsrRUj_S7f1eMesIcnmkmQuwbzq9sOkiFGK6p0udxRM_7cmj-Zv5mkLV3ucpuMLojYZiGn9DdZLMMKh_tGWRVgslqZS4bWxS260gPNgnHgGNdACxuHjhtosFBeagcWh2vdTMUbeLYtEJGVMlxMaCnRP7RjDUcGIJsrVsRVPuqOpHJgouBcEEAJDMsCYyU6H4-8',
        totalProjects: 12,
        totalRevenue: 500000,
        totalHours: 1500,
        status: 'active'
      },
      {
        id: '2',
        name: 'Tech Solutions',
        email: 'info@techsolutions.com',
        phone: '+1 (555) 987-6543',
        address: '456 Innovation Ave, New York, NY 10001',
        contactPerson: 'Sarah Johnson',
        projects: [],
        createdAt: new Date('2024-02-01'),
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYioUHWvgudsB15PMiyDcrUiMRrBrHJl1Pd_PC7yBALDw7_USqXsp3xcYxjCxGZeryml1pTOweHYYHn3HXf0oljsOwpeY2Y2h52DJtGrk23jD2p8msb8Ynx0QCO4WEthp1LMHYS3_ASEZhTCsxqykmaazzEhsenFCaCJ7jgHZiBmp2BVc2_hqE3ppibvwTuTf2fjaEueTavJVPmxl4essjC5MNIg1_X2CAqvONU2PG9VR4WL25QiL9tPnl0prSgYVI5qsQS5WBiTU',
        totalProjects: 8,
        totalRevenue: 300000,
        totalHours: 1000,
        status: 'suspended'
      },
      {
        id: '3',
        name: 'Global Co.',
        email: 'contact@globalco.com',
        phone: '+1 (555) 111-2222',
        address: '789 International Blvd, London, UK',
        contactPerson: 'David Chen',
        projects: [],
        createdAt: new Date('2023-11-20'),
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDK-Vhz0Xlv69eLn91slBcLYgm2-F3BtEJC7YIKRxg4fTK0QRuP6dtk9kZfuYdM3pkEC_gpXFaN3wyttBbxfB1G72KNs_2An_2nq7EfByNfRg96q2eRmiHAmqkigHFoQK3Hcb-I1hVwzq_sCy4jW6qCx_-z7RI40L9HbJTmE65GaNLHmXmJ_U4Yf43RS59kob83ZtHUgxECHYxjOThE2WUWktRMpj7qQ9E12VUbX99_VIF0d8RXnrVv7_m99oilJ1WcmZucJSBXWiQ',
        totalProjects: 15,
        totalRevenue: 750000,
        totalHours: 2000,
        status: 'active'
      },
      {
        id: '4',
        name: 'Quantum Leap',
        email: 'info@quantumleap.com',
        phone: '+1 (555) 333-4444',
        address: '101 Future Drive, Austin, TX 78701',
        contactPerson: 'Maria Garcia',
        projects: [],
        createdAt: new Date('2024-03-10'),
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5_N2SSfhzk0PPMW1uVY3Gwo2lZNU2w4LRlYrYWZJhPqqbu65JGMs0laryqqBTd6eAeeHMO8AnCAVeQilOi2yVCfL0vOcyixB2tPTWW-aqDvk_3p6s7TYRN-QGgoGq5tQVlb-enCihXUOI8Q5mHCmiaY4eYNq0dWfvmTZruMd1-SR2o4BGig3I_VjAS0JtQC3eN65yxbTb3OTxkDidXGeru8JRCeD1W8nUaFJQIhPFSCJz0TLZRP1j066a6W9p9WZtT_mFBIdks6U',
        totalProjects: 5,
        totalRevenue: 150000,
        totalHours: 500,
        status: 'prospect'
      },
      {
        id: '5',
        name: 'Future Vision',
        email: 'hello@futurevision.com',
        phone: '+1 (555) 555-6666',
        address: '202 Visionary Way, Seattle, WA 98101',
        contactPerson: 'Emily White',
        projects: [],
        createdAt: new Date('2024-01-05'),
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB62QdfUVOyVq-12YappD-uXippv4UC4kw74PqrxmyZwUKwleZw-pGAJzHqHX_b1opzwaMe6uHtzmBna5bG2HrCrPuYhdKP0PJC9ymyRIAJvuXt0HLa9M9acuG1ADVT76eV1xbFtYcG5kjNRuesbp0AyV7DShv8PqeRoDrfcqGDl0tgCJ7gFb4L0fokCO-oXbRUEoKMKjRvGOZOBGjzbOZtkznrhCq-ZwoqbTYfNNmT5MmZctT5Q1oWT5PYTS9Baz-DExuV8V2Nm70',
        totalProjects: 10,
        totalRevenue: 400000,
        totalHours: 1200,
        status: 'active'
      }
    ];

    const mockContracts: Contract[] = [
      {
        id: '1',
        clientId: '1',
        contractNumber: 'CONT-2024-001',
        totalValue: 80000,
        billingModel: 'hourly',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        status: 'active'
      },
      {
        id: '2',
        clientId: '2',
        contractNumber: 'CONT-2024-002',
        totalValue: 120000,
        billingModel: 'fixed',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-08-31'),
        status: 'active'
      }
    ];

    const mockProjects: Project[] = [
      {
        id: '1',
        clientId: '1',
        contractId: '1',
        name: 'Sistema de E-commerce',
        description: 'Desenvolvimento de plataforma de vendas online completa',
        status: 'active',
        budgetHours: 160,
        budgetAmount: 25000,
        progress: 45,
        priority: 'high',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-03-15'),
        spentHours: 72,
        revenue: 11250,
        allocations: [],
        tasks: [],
        createdAt: new Date('2024-01-10')
      },
      {
        id: '2',
        clientId: '2',
        contractId: '2',
        name: 'App Mobile Corporativo',
        description: 'Aplicativo mobile para gestão interna da empresa',
        status: 'planning',
        budgetHours: 80,
        budgetAmount: 12000,
        progress: 0,
        priority: 'medium',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-04-30'),
        spentHours: 0,
        revenue: 0,
        allocations: [],
        tasks: [],
        createdAt: new Date('2024-02-20'),
        technologies: ['React Native', 'Firebase']
      }
    ];

    this.updateClients(mockClients);
    this.updateContracts(mockContracts);
    this.updateProjects(mockProjects);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}