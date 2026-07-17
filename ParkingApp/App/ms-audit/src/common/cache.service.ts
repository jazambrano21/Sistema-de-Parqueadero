import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);

      if (value === undefined || value === null) {
        this.logger.log(`Cache get: ${key} -> MISS`);
        return null;
      }

      this.logger.log(`Cache get: ${key} -> HIT`);

      return value;
    } catch (error) {
      this.logger.error(
        `Error obteniendo la clave ${key}: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );

      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttlMilliseconds = 300000,
  ): Promise<void> {
    try {
      await this.cacheManager.set(
        key,
        value,
        ttlMilliseconds,
      );

      this.logger.log(
        `Cache set: ${key} (TTL: ${
          ttlMilliseconds / 1000
        }s)`,
      );
    } catch (error) {
      this.logger.error(
        `Error guardando la clave ${key}: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);

      this.logger.log(`Cache del: ${key}`);
    } catch (error) {
      this.logger.error(
        `Error eliminando la clave ${key}: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`,
      );
    }
  }
}