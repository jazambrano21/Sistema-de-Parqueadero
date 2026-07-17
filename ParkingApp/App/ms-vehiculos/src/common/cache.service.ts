import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.cacheManager.get<T>(key);
    this.logger.debug(`Cache get: ${key} -> ${value !== undefined && value !== null ? 'HIT' : 'MISS'}`);
    return value ?? null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
    this.logger.debug(`Cache set: ${key} (TTL: ${ttl ?? 'default'}s)`);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
    this.logger.debug(`Cache del: ${key}`);
  }

  async clear(): Promise<void> {
    await this.cacheManager.clear();
    this.logger.debug('Cache cleared');
  }
}
