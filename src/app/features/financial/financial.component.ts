import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense' | 'investment' | 'refund';
  category: string;
  description: string;
  amount: number;
  date: Date;
  project?: string;
  client?: string;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  paymentMethod: string;
  reference: string;
  attachments: string[];
  createdBy: string;
  approvedBy?: string;
  tags: string[];
}

export interface Budget {
  id: string;
  name: string;
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  status: 'active' | 'exceeded' | 'completed';
  alerts: BudgetAlert[];
}

export interface BudgetAlert {
  id: string;
  type: 'warning' | 'critical';
  threshold: number;
  message: string;
  triggered: boolean;
  date?: Date;
}

export interface FinancialReport {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  cashFlow: number;
  projectProfitability: ProjectProfitability[];
  expensesByCategory: CategoryExpense[];
  monthlyTrends: MonthlyTrend[];
}

export interface ProjectProfitability {
  projectId: string;
  projectName: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  status: string;
}

export interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  profit: number;
}

export interface Invoice {
  id: string;
  number: string;
  client: string;
  project: string;
  amount: number;
  issueDate: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  taxes: number;
  discount: number;
  total: number;
  notes: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

@Component({
  selector: 'app-financial',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './financial.component.html',
  styleUrls: ['./financial.component.scss']
})
export class FinancialComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('revenueChart', { static: false }) revenueChartRef!: ElementRef;
  @ViewChild('expenseChart', { static: false }) expenseChartRef!: ElementRef;
  @ViewChild('profitChart', { static: false }) profitChartRef!: ElementRef;
  @ViewChild('cashFlowChart', { static: false }) cashFlowChartRef!: ElementRef;
  @ViewChild('budgetChart', { static: false }) budgetChartRef!: ElementRef;

  private destroy$ = new Subject<void>();
  private charts: Chart[] = [];

  // Forms
  transactionForm!: FormGroup;
  budgetForm!: FormGroup;
  invoiceForm!: FormGroup;
  filterForm!: FormGroup;

  // Data
  transactions: FinancialTransaction[] = [];
  budgets: Budget[] = [];
  invoices: Invoice[] = [];
  financialReport: FinancialReport = {
    period: '',
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    cashFlow: 0,
    projectProfitability: [],
    expensesByCategory: [],
    monthlyTrends: []
  };

  // Filters and Options
  transactionTypes = [
    { value: 'income', label: 'Receita', icon: 'trending_up', color: '#10b981' },
    { value: 'expense', label: 'Despesa', icon: 'trending_down', color: '#ef4444' },
    { value: 'investment', label: 'Investimento', icon: 'savings', color: '#8b5cf6' },
    { value: 'refund', label: 'Reembolso', icon: 'undo', color: '#f59e0b' }
  ];

  categories = [
    'Desenvolvimento', 'Design', 'Marketing', 'Infraestrutura', 'Recursos Humanos',
    'Equipamentos', 'Software', 'Treinamento', 'Viagem', 'Escritório', 'Outros'
  ];

  paymentMethods = [
    'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência Bancária',
    'PIX', 'Boleto', 'Cheque', 'PayPal', 'Outros'
  ];

  statusOptions = [
    { value: 'pending', label: 'Pendente', color: '#f59e0b' },
    { value: 'approved', label: 'Aprovado', color: '#2563eb' },
    { value: 'paid', label: 'Pago', color: '#10b981' },
    { value: 'cancelled', label: 'Cancelado', color: '#ef4444' }
  ];

  // Table columns
  transactionColumns: string[] = ['date', 'type', 'description', 'category', 'amount', 'status', 'actions'];
  budgetColumns: string[] = ['name', 'category', 'allocated', 'spent', 'remaining', 'status', 'actions'];
  invoiceColumns: string[] = ['number', 'client', 'amount', 'issueDate', 'dueDate', 'status', 'actions'];

  // UI State
  selectedTab = 0;
  isLoading = false;
  showTransactionDialog = false;
  showBudgetDialog = false;
  showInvoiceDialog = false;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadFinancialData();
    this.setupFilters();
    this.calculateFinancialReport();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  // Form Initialization
  initializeForms(): void {
    this.transactionForm = this.fb.group({
      type: ['', Validators.required],
      category: ['', Validators.required],
      description: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      date: [new Date(), Validators.required],
      project: [''],
      client: [''],
      paymentMethod: ['', Validators.required],
      reference: [''],
      tags: [[]]
    });

    this.budgetForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      allocated: ['', [Validators.required, Validators.min(0.01)]],
      period: ['monthly', Validators.required],
      startDate: [new Date(), Validators.required],
      endDate: ['', Validators.required]
    });

    this.invoiceForm = this.fb.group({
      client: ['', Validators.required],
      project: ['', Validators.required],
      dueDate: ['', Validators.required],
      items: this.fb.array([]),
      taxes: [0],
      discount: [0],
      notes: ['']
    });

    this.filterForm = this.fb.group({
      type: ['all'],
      category: ['all'],
      status: ['all'],
      dateRange: ['thisMonth'],
      startDate: [''],
      endDate: ['']
    });
  }

  // Data Loading
  loadFinancialData(): void {
    this.isLoading = true;
    this.generateMockData();
    this.isLoading = false;
  }

  generateMockData(): void {
    // Transactions
    this.transactions = [
      {
        id: '1',
        type: 'income',
        category: 'Desenvolvimento',
        description: 'Pagamento - Website Corporativo',
        amount: 25000,
        date: new Date('2024-02-15'),
        project: 'Website Corporativo',
        client: 'Empresa ABC',
        status: 'paid',
        paymentMethod: 'Transferência Bancária',
        reference: 'TRF-2024-001',
        attachments: [],
        createdBy: 'João Silva',
        approvedBy: 'Maria Santos',
        tags: ['projeto', 'desenvolvimento']
      },
      {
        id: '2',
        type: 'expense',
        category: 'Infraestrutura',
        description: 'Servidor AWS - Fevereiro',
        amount: 1200,
        date: new Date('2024-02-01'),
        status: 'paid',
        paymentMethod: 'Cartão de Crédito',
        reference: 'AWS-2024-02',
        attachments: [],
        createdBy: 'Pedro Costa',
        tags: ['infraestrutura', 'mensal']
      },
      {
        id: '3',
        type: 'expense',
        category: 'Recursos Humanos',
        description: 'Salários - Fevereiro 2024',
        amount: 45000,
        date: new Date('2024-02-28'),
        status: 'approved',
        paymentMethod: 'Transferência Bancária',
        reference: 'SAL-2024-02',
        attachments: [],
        createdBy: 'Ana Oliveira',
        tags: ['salário', 'mensal']
      },
      {
        id: '4',
        type: 'income',
        category: 'Design',
        description: 'Pagamento - App Mobile',
        amount: 40000,
        date: new Date('2024-01-31'),
        project: 'App Mobile',
        client: 'Empresa XYZ',
        status: 'paid',
        paymentMethod: 'PIX',
        reference: 'PIX-2024-003',
        attachments: [],
        createdBy: 'Lucas Ferreira',
        approvedBy: 'Maria Santos',
        tags: ['projeto', 'design']
      }
    ];

    // Budgets
    this.budgets = [
      {
        id: '1',
        name: 'Desenvolvimento de Software',
        category: 'Desenvolvimento',
        allocated: 50000,
        spent: 37500,
        remaining: 12500,
        period: 'monthly',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29'),
        status: 'active',
        alerts: [
          {
            id: '1',
            type: 'warning',
            threshold: 80,
            message: 'Orçamento atingiu 80% do limite',
            triggered: true,
            date: new Date('2024-02-20')
          }
        ]
      },
      {
        id: '2',
        name: 'Marketing Digital',
        category: 'Marketing',
        allocated: 15000,
        spent: 8500,
        remaining: 6500,
        period: 'monthly',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29'),
        status: 'active',
        alerts: []
      },
      {
        id: '3',
        name: 'Infraestrutura',
        category: 'Infraestrutura',
        allocated: 5000,
        spent: 5200,
        remaining: -200,
        period: 'monthly',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29'),
        status: 'exceeded',
        alerts: [
          {
            id: '2',
            type: 'critical',
            threshold: 100,
            message: 'Orçamento excedido em R$ 200',
            triggered: true,
            date: new Date('2024-02-25')
          }
        ]
      }
    ];

    // Invoices
    this.invoices = [
      {
        id: '1',
        number: 'INV-2024-001',
        client: 'Empresa ABC',
        project: 'Website Corporativo',
        amount: 25000,
        issueDate: new Date('2024-02-01'),
        dueDate: new Date('2024-02-15'),
        status: 'paid',
        items: [
          { description: 'Desenvolvimento Frontend', quantity: 1, rate: 15000, amount: 15000 },
          { description: 'Desenvolvimento Backend', quantity: 1, rate: 10000, amount: 10000 }
        ],
        taxes: 2500,
        discount: 0,
        total: 27500,
        notes: 'Pagamento via transferência bancária'
      },
      {
        id: '2',
        number: 'INV-2024-002',
        client: 'Empresa XYZ',
        project: 'Sistema de Gestão',
        amount: 60000,
        issueDate: new Date('2024-02-15'),
        dueDate: new Date('2024-03-01'),
        status: 'sent',
        items: [
          { description: 'Análise de Requisitos', quantity: 1, rate: 20000, amount: 20000 },
          { description: 'Desenvolvimento do Sistema', quantity: 1, rate: 40000, amount: 40000 }
        ],
        taxes: 6000,
        discount: 0,
        total: 66000,
        notes: 'Primeira parcela do projeto'
      }
    ];
  }

  // Financial Report Calculation
  calculateFinancialReport(): void {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = this.transactions.filter(t => 
      t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear
    );

    const totalIncome = monthlyTransactions
      .filter(t => t.type === 'income' && t.status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = monthlyTransactions
      .filter(t => t.type === 'expense' && t.status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    this.financialReport = {
      period: `${currentMonth + 1}/${currentYear}`,
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin,
      cashFlow: netProfit,
      projectProfitability: this.calculateProjectProfitability(),
      expensesByCategory: this.calculateExpensesByCategory(),
      monthlyTrends: this.calculateMonthlyTrends()
    };
  }

  calculateProjectProfitability(): ProjectProfitability[] {
    const projects = ['Website Corporativo', 'App Mobile', 'Sistema de Gestão'];
    return projects.map(project => {
      const revenue = this.transactions
        .filter(t => t.project === project && t.type === 'income' && t.status === 'paid')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const costs = this.transactions
        .filter(t => t.project === project && t.type === 'expense' && t.status === 'paid')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const profit = revenue - costs;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      
      return {
        projectId: project.toLowerCase().replace(/\s+/g, '-'),
        projectName: project,
        revenue,
        costs,
        profit,
        margin,
        status: 'active'
      };
    });
  }

  calculateExpensesByCategory(): CategoryExpense[] {
    const categoryTotals = new Map<string, number>();
    
    this.transactions
      .filter(t => t.type === 'expense' && t.status === 'paid')
      .forEach(t => {
        const current = categoryTotals.get(t.category) || 0;
        categoryTotals.set(t.category, current + t.amount);
      });

    const totalExpenses = Array.from(categoryTotals.values()).reduce((sum, amount) => sum + amount, 0);
    
    return Array.from(categoryTotals.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      trend: 'stable' as const
    }));
  }

  calculateMonthlyTrends(): MonthlyTrend[] {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    return months.map(month => ({
      month,
      income: Math.random() * 50000 + 20000,
      expenses: Math.random() * 40000 + 15000,
      profit: 0
    })).map(trend => ({
      ...trend,
      profit: trend.income - trend.expenses
    }));
  }

  // Charts
  initializeCharts(): void {
    this.createRevenueChart();
    this.createExpenseChart();
    this.createProfitChart();
    this.createCashFlowChart();
    this.createBudgetChart();
  }

  createRevenueChart(): void {
    if (!this.revenueChartRef?.nativeElement) return;

    const ctx = this.revenueChartRef.nativeElement.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.financialReport.monthlyTrends.map(t => t.month),
        datasets: [{
          label: 'Receita',
          data: this.financialReport.monthlyTrends.map(t => t.income),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R$ ' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
    
    this.charts.push(chart);
  }

  createExpenseChart(): void {
    if (!this.expenseChartRef?.nativeElement) return;

    const ctx = this.expenseChartRef.nativeElement.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.financialReport.expensesByCategory.map(e => e.category),
        datasets: [{
          data: this.financialReport.expensesByCategory.map(e => e.amount),
          backgroundColor: ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
    
    this.charts.push(chart);
  }

  createProfitChart(): void {
    if (!this.profitChartRef?.nativeElement) return;

    const ctx = this.profitChartRef.nativeElement.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.financialReport.projectProfitability.map(p => p.projectName),
        datasets: [
          {
            label: 'Receita',
            data: this.financialReport.projectProfitability.map(p => p.revenue),
            backgroundColor: '#10B981',
            borderRadius: 4
          },
          {
            label: 'Custos',
            data: this.financialReport.projectProfitability.map(p => p.costs),
            backgroundColor: '#EF4444',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R$ ' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
    
    this.charts.push(chart);
  }

  createCashFlowChart(): void {
    if (!this.cashFlowChartRef?.nativeElement) return;

    const ctx = this.cashFlowChartRef.nativeElement.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.financialReport.monthlyTrends.map(t => t.month),
        datasets: [
          {
            label: 'Receita',
            data: this.financialReport.monthlyTrends.map(t => t.income),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4
          },
          {
            label: 'Despesas',
            data: this.financialReport.monthlyTrends.map(t => t.expenses),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4
          },
          {
            label: 'Lucro',
            data: this.financialReport.monthlyTrends.map(t => t.profit),
            borderColor: '#2563EB',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R$ ' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
    
    this.charts.push(chart);
  }

  createBudgetChart(): void {
    if (!this.budgetChartRef?.nativeElement) return;

    const ctx = this.budgetChartRef.nativeElement.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.budgets.map(b => b.name),
        datasets: [
          {
            label: 'Orçado',
            data: this.budgets.map(b => b.allocated),
            backgroundColor: '#E5E7EB',
            borderRadius: 4
          },
          {
            label: 'Gasto',
            data: this.budgets.map(b => b.spent),
            backgroundColor: '#2563EB',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R$ ' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
    
    this.charts.push(chart);
  }

  destroyCharts(): void {
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];
  }

  // Filters
  setupFilters(): void {
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  applyFilters(): void {
    // Apply filters to transactions, budgets, and invoices
    // This would filter the data based on form values
  }

  // CRUD Operations
  addTransaction(): void {
    if (this.transactionForm.valid) {
      const newTransaction: FinancialTransaction = {
        id: Date.now().toString(),
        ...this.transactionForm.value,
        status: 'pending',
        attachments: [],
        createdBy: 'Current User'
      };
      
      this.transactions.unshift(newTransaction);
      this.transactionForm.reset();
      this.showTransactionDialog = false;
      this.calculateFinancialReport();
      
      this.snackBar.open('Transação adicionada com sucesso!', 'Fechar', {
        duration: 3000
      });
    }
  }

  editTransaction(transaction: FinancialTransaction): void {
    this.transactionForm.patchValue(transaction);
    this.showTransactionDialog = true;
  }

  deleteTransaction(id: string): void {
    this.transactions = this.transactions.filter(t => t.id !== id);
    this.calculateFinancialReport();
    
    this.snackBar.open('Transação removida com sucesso!', 'Fechar', {
      duration: 3000
    });
  }

  addBudget(): void {
    if (this.budgetForm.valid) {
      const newBudget: Budget = {
        id: Date.now().toString(),
        ...this.budgetForm.value,
        spent: 0,
        remaining: this.budgetForm.value.allocated,
        status: 'active',
        alerts: []
      };
      
      this.budgets.unshift(newBudget);
      this.budgetForm.reset();
      this.showBudgetDialog = false;
      
      this.snackBar.open('Orçamento criado com sucesso!', 'Fechar', {
        duration: 3000
      });
    }
  }

  // Utility Methods
  getTransactionTypeInfo(type: string) {
    return this.transactionTypes.find(t => t.value === type);
  }

  getStatusInfo(status: string) {
    return this.statusOptions.find(s => s.value === status);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getBudgetUtilization(budget: Budget): number {
    return Math.round((budget.spent / budget.allocated) * 100);
  }

  getBudgetStatus(budget: Budget): 'good' | 'warning' | 'danger' {
    const utilization = this.getBudgetUtilization(budget);
    if (utilization <= 70) return 'good';
    if (utilization <= 90) return 'warning';
    return 'danger';
  }

  exportReport(): void {
    const reportData = {
      report: this.financialReport,
      transactions: this.transactions,
      budgets: this.budgets,
      invoices: this.invoices,
      generatedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  // Property for template binding
  new: any = {};

  // Propriedade para usar no template
  currentDate = new Date();
}