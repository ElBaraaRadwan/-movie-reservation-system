import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Cache } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { promisify } from 'util';

@Injectable()
export class RedisService {
  constructor(
    @Inject('CACHE_MANAGER') private readonly cacheManager: Cache, // Inject Cache Manager
  ) {}

  /**
   * Get a value from Redis by key.
   * @param key Redis key
   * @returns The value associated with the key or null if not found.
   */
  async get<T>(key: string): Promise<T | null> {
    return (await this.cacheManager.get<T>(key)) || null;
  }

  /**
   * Set a value in Redis with an optional TTL.
   * @param key Redis key
   * @param value Value to store
   * @param ttl Time-to-live in seconds (optional)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * Delete a value from Redis by key.
   * @param key Redis key
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Clean the Redis database.
   * This function should only be run in the test environment.
   */
  async cleanDB(): Promise<void> {
    console.log('Environment:', process.env.NODE_ENV);
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDB can only be run in test environment');
    }
    console.log('Cleaning Redis database...');

    try {
      const client = (this.cacheManager as any).store.getClient();
      const keysAsync = promisify(client.keys).bind(client);
      const delAsync = promisify(client.del).bind(client);

      const keys = await keysAsync('*');
      if (keys.length > 0) {
        await delAsync(keys);
      }

      console.log('Redis database cleaned successfully.');
    } catch (error) {
      console.error('Redis CleanDB Error:', error);
      throw new InternalServerErrorException('Failed to clean Redis database');
    }
  }
}
