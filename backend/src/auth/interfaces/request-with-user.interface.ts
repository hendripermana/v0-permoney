import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    name: string;
    householdId?: string;
    isActive: boolean;
    roles?: string[];
  };
}
