export interface Invoice {
  id: string;
  contractId: string;
  invoiceNumber: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface FinancialMetrics {
  totalRevenue: number;
  totalCosts: number;
  profitMargin: number;
  activeProjects: number;
  completedProjects: number;
  pendingInvoices: number;
  overdueInvoices: number;
}

export interface ProjectFinancials {
  projectId: string;
  budgetAmount: number;
  spentAmount: number;
  remainingBudget: number;
  profitMargin: number;
  hoursWorked: number;
  budgetedHours: number;
  costPerHour: number;
}