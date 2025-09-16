import { Task } from './task.interface';

export interface Project {
  id: string;
  clientId: string;
  contractId: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  budgetHours: number;
  budgetAmount: number;
  budget?: number;
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate: Date;
  endDate: Date;
  spentHours: number;
  revenue: number;
  allocations: ProjectAllocation[];
  tasks: Task[];
  createdAt: Date;
  technologies?: string[];
}

export interface ProjectAllocation {
  id: string;
  userId: string;
  projectId: string;
  allocationPercentage: number;
  startDate: Date;
  endDate: Date;
}

// Client interface moved to client.interface.ts to avoid conflicts

export interface Contract {
  id: string;
  clientId: string;
  contractNumber: string;
  totalValue: number;
  billingModel: 'hourly' | 'fixed' | 'monthly';
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
}