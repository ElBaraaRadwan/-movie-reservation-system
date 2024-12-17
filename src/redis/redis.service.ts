import { Injectable } from '@nestjs/common';
import { Cache } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';

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
}
