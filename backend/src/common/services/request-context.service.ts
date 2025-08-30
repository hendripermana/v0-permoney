import { Injectable, Scope } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  private requestId: string;
  private userId?: string;
  private householdId?: string;
  private startTime: number;
  private metadata: Record<string, any> = {};

  constructor() {
    this.requestId = uuidv4();
    this.startTime = Date.now();
  }

  getRequestId(): string {
    return this.requestId;
  }

  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  getHouseholdId(): string | undefined {
    return this.householdId;
  }

  setHouseholdId(householdId: string): void {
    this.householdId = householdId;
  }

  getStartTime(): number {
    return this.startTime;
  }

  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }

  getMetadata(key: string): any {
    return this.metadata[key];
  }

  getAllMetadata(): Record<string, any> {
    return { ...this.metadata };
  }

  getContext(): {
    requestId: string;
    userId?: string;
    householdId?: string;
    elapsedTime: number;
    metadata: Record<string, any>;
  } {
    return {
      requestId: this.requestId,
      userId: this.userId,
      householdId: this.householdId,
      elapsedTime: this.getElapsedTime(),
      metadata: this.getAllMetadata(),
    };
  }
}
