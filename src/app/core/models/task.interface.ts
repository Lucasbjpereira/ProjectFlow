export interface Task {
  id: string;
  projectId: string;
  assignedUserId: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours: number;
  dueDate: Date;
  timeEntries: TimeEntry[];
  createdAt: Date;
}

export interface TimeEntry {
  id: string;
  userId: string;
  taskId: string;
  projectId: string;
  hours: number;
  description: string;
  entryDate: Date;
  createdAt: Date;
}

export interface TimerSession {
  id: string;
  taskId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  description?: string;
}