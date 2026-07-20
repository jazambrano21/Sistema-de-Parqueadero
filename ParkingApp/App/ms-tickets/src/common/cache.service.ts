import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST') || 'localhost',
      port: +(this.configService.get<string>('REDIS_PORT') || 6379),
      lazyConnect: true,
    });

    this.redis.on('connect', () => this.logger.log('Conectado a Redis'));
    this.redis.on('error', (err) => this.logger.error(`Redis error: ${err.message}`));
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value !== null) {
        this.logger.log(`Cache get: ${key} -> HIT`);
        return JSON.parse(value) as T;
      }
      this.logger.log(`Cache get: ${key} -> MISS`);
      return null;
    } catch (err) {
      this.logger.error(`Cache get error [${key}]: ${err.message}`);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      this.logger.log(`Cache set: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (err) {
      this.logger.error(`Cache set error [${key}]: ${err.message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.logger.log(`Cache del: ${key}`);
    } catch (err) {
      this.logger.error(`Cache del error [${key}]: ${err.message}`);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.logger.log('Cache cleared');
    } catch (err) {
      this.logger.error(`Cache clear error: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}