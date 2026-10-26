export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  phone?: string;
  address?: string;
}