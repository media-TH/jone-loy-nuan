/**
 * 🚀 Cache Service - Client-side caching for better performance
 * 
 * Provides in-memory caching for:
 * - Quiz questions
 * - Session data
 * - KPI data
 */

interface CacheItem<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

interface CacheConfig {
    questions: number;    // 5 minutes
    sessions: number;     // 1 minute
    kpi: number;         // 30 seconds
}

export class CacheService {
    private static cache = new Map<string, CacheItem<any>>();

    // Cache TTL configuration (in milliseconds)
    private static readonly TTL: CacheConfig = {
        questions: 5 * 60 * 1000,  // 5 minutes
        sessions: 1 * 60 * 1000,   // 1 minute
        kpi: 30 * 1000,            // 30 seconds
    };

    /**
     * Set cache item with TTL
     */
    static set<T>(key: string, data: T, category: keyof CacheConfig): void {
        const ttl = this.TTL[category];
        const item: CacheItem<T> = {
            data,
            timestamp: Date.now(),
            ttl
        };

        this.cache.set(key, item);

        // Auto cleanup expired items
        this.scheduleCleanup();
    }

    /**
     * Get cache item if not expired
     */
    static get<T>(key: string): T | null {
        const item = this.cache.get(key);

        if (!item) {
            return null;
        }

        // Check if expired
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.data as T;
    }

    /**
     * Check if cache has valid item
     */
    static has(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Delete specific cache item
     */
    static delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    static clear(): void {
        this.cache.clear();
    }

    /**
     * Clear cache by category pattern
     */
    static clearByPattern(pattern: string): void {
        const keysToDelete: string[] = [];

        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));
    }

    /**
     * Get cache statistics
     */
    static getStats(): {
        size: number;
        keys: string[];
        expired: number;
    } {
        const now = Date.now();
        let expired = 0;

        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > item.ttl) {
                expired++;
            }
        }

        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            expired
        };
    }

    /**
     * Cleanup expired items
     */
    private static cleanupExpired(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > item.ttl) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));

        if (keysToDelete.length > 0) {
            console.log(`[CacheService] Cleaned up ${keysToDelete.length} expired items`);
        }
    }

    /**
     * Schedule periodic cleanup
     */
    private static scheduleCleanup(): void {
        // Only schedule if not already scheduled
        if (!this.cleanupScheduled) {
            this.cleanupScheduled = true;

            setTimeout(() => {
                this.cleanupExpired();
                this.cleanupScheduled = false;
            }, 60000); // Cleanup every minute
        }
    }

    private static cleanupScheduled = false;

    /**
     * Cache key generators
     */
    static keys = {
        questions: () => 'quiz:questions:all',
        questionById: (id: string) => `quiz:question:${id}`,
        session: (sessionId: string) => `quiz:session:${sessionId}`,
        kpiScores: () => 'quiz:kpi:scores',
        userSessions: (userId: string) => `quiz:user:${userId}:sessions`,
    };
}
