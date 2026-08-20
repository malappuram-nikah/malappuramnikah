import { ICacheService } from "../../shared/cache/ICacheService";

interface CacheRecord<T> {
  value: T;
  expiresAt?: number;
}

export class MemoryCacheService implements ICacheService {
  private store: Map<string, CacheRecord<any>> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const record = this.store.get(key);
    if (!record) return null;
    if (record.expiresAt && record.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return record.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
