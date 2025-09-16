// User related exports
export * from './user.interface';

// Client related exports
export * from './client.interface';

// Project related interfaces
export * from './project.interface';

// Task related interfaces
export * from './task.interface';

// Financial related interfaces
export * from './financial.interface';

// Common interfaces
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilterOptions {
  search?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
  projectId?: string;
}

export interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  totalConsultants: number;
  availableConsultants: number;
  busyConsultants: number;
  monthlyHours: number;
  totalRevenue: number;
  averageProjectValue: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// FinancialMetrics is exported from financial.interface.ts