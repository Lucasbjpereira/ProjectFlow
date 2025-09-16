export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CONSULTANT = 'consultant',
  CLIENT = 'client'
}

export interface UserSkill {
  name: string;
  level: number;
  verified: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  hourlyRate: number;
  availability: 'available' | 'busy' | 'unavailable';
  availabilityStatus: 'available' | 'busy' | 'unavailable';
  skills: Skill[];
  rating: number;
  bio?: string;
  phone?: string;
  location?: string;
  experience: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  id: string;
  userId: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  certification?: string;
  acquiredDate: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
}