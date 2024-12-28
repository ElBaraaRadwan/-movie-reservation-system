import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache, // Inject Cache Manager
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      this.logger.debug(`Fetching key "${key}" from Redis`);
      return (await this.cacheManager.get<T>(key)) || null;
    } catch (error) {
      this.logger.error(`Error getting key "${key}":`, error);
      throw new InternalServerErrorException(`Failed to get key "${key}"`);
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const defaultTTL = parseInt(process.env.DEFAULT_CACHE_TTL, 10) || 3600; // Configurable TTL
    try {
      if (!key) throw new InternalServerErrorException('Key must be provided');
      if (key.includes('/')) {
        this.logger.debug(`Disregarding key "${key}" with invalid characters`);
        return;
      }
      if (value === undefined || value === null)
        throw new InternalServerErrorException(
          'Value must not be null or undefined',
        );

      await this.cacheManager.set(key, value, ttl ?? defaultTTL);
      this.logger.debug(
        `Set key "${key}" in Redis with TTL ${ttl ?? defaultTTL}s`,
      );
    } catch (error) {
      this.logger.error(`Error setting key "${key}":`, error);
      throw new InternalServerErrorException(`Failed to set key "${key}"`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      this.logger.debug(`Deleting key "${key}" from Redis`);
      await this.cacheManager.del(key);
      this.logger.debug(`Key "${key}" deleted from Redis`);
    } catch (error) {
      this.logger.error(`Error deleting key "${key}":`, error);
      throw new InternalServerErrorException(`Failed to delete key "${key}"`);
    }
  }

  async cleanDB(): Promise<void> {
    this.logger.debug('Cleaning Redis database...');
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDB can only be run in test environment');
    }

    try {
      const client = (this.cacheManager.store as any).getClient();
      const keys = await client.keys('*');
      if (keys.length > 0) {
        const pipeline = client.pipeline();
        keys.forEach((key: string) => pipeline.del(key));
        await pipeline.exec();
      }
      this.logger.debug('Redis database cleaned successfully.');
    } catch (error) {
      this.logger.error('Redis CleanDB Error:', error);
      throw new InternalServerErrorException('Failed to clean Redis database');
    }
  }
}
