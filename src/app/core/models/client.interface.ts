export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  company?: string;
  website?: string;
  projects: string[];
  createdAt: Date;
  imageUrl?: string;
  totalProjects: number;
  totalRevenue: number;
  totalHours: number;
  status: 'active' | 'suspended' | 'prospect';
}