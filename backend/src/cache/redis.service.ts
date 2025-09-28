import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisService {
  private sessions = new Map<string, any>();
  private sets = new Map<string, Set<string>>();

  async setSession(key: string, value: any, ttlSeconds?: number): Promise<void> {
    // TTL ignored in stub; acceptable for local dev
    this.sessions.set(key, value);
  }

  async getSession<T = any>(key: string): Promise<T | null> {
    return (this.sessions.get(key) as T) ?? null;
  }

  async deleteSession(key: string): Promise<void> {
    this.sessions.delete(key);
  }

  async sadd(key: string, member: string): Promise<void> {
    if (!this.sets.has(key)) this.sets.set(key, new Set());
    this.sets.get(key)!.add(member);
  }

  async srem(key: string, member: string): Promise<void> {
    this.sets.get(key)?.delete(member);
  }

  async del(key: string): Promise<void> {
    this.sessions.delete(key);
    this.sets.delete(key);
  }
}


