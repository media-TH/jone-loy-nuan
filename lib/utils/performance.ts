/**
 * 🚀 Performance Monitoring Utilities
 * 
 * Provides performance tracking for:
 * - API calls
 * - Database queries
 * - User interactions
 * - Component rendering
 */

interface PerformanceMetric {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, any>;
}

interface PerformanceStats {
    totalCalls: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    lastCall: number;
}

export class PerformanceMonitor {
    private static metrics = new Map<string, PerformanceMetric[]>();
    private static activeTimers = new Map<string, number>();

    /**
     * Start timing an operation
     */
    static startTimer(name: string, metadata?: Record<string, any>): string {
        const timerId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = performance.now();

        this.activeTimers.set(timerId, startTime);

        // Store initial metric
        const metric: PerformanceMetric = {
            name,
            startTime,
            metadata
        };

        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }

        this.metrics.get(name)!.push(metric);

        return timerId;
    }

    /**
     * End timing an operation
     */
    static endTimer(timerId: string): number | null {
        const startTime = this.activeTimers.get(timerId);
        if (!startTime) {
            console.warn(`[PerformanceMonitor] Timer ${timerId} not found`);
            return null;
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        // Find and update the metric
        for (const [name, metrics] of this.metrics.entries()) {
            const metric = metrics.find(m => m.startTime === startTime);
            if (metric) {
                metric.endTime = endTime;
                metric.duration = duration;
                break;
            }
        }

        this.activeTimers.delete(timerId);

        // Log slow operations (> 1 second)
        if (duration > 1000) {
            console.warn(`[PerformanceMonitor] Slow operation detected: ${timerId} took ${duration.toFixed(2)}ms`);
        }

        return duration;
    }

    /**
     * Measure a function execution
     */
    static async measure<T>(
        name: string,
        fn: () => Promise<T> | T,
        metadata?: Record<string, any>
    ): Promise<T> {
        const timerId = this.startTimer(name, metadata);

        try {
            const result = await fn();
            this.endTimer(timerId);
            return result;
        } catch (error) {
            this.endTimer(timerId);
            throw error;
        }
    }

    /**
     * Get performance statistics for an operation
     */
    static getStats(name: string): PerformanceStats | null {
        const metrics = this.metrics.get(name);
        if (!metrics || metrics.length === 0) {
            return null;
        }

        const completedMetrics = metrics.filter(m => m.duration !== undefined);
        if (completedMetrics.length === 0) {
            return null;
        }

        const durations = completedMetrics.map(m => m.duration!);
        const totalCalls = completedMetrics.length;
        const averageDuration = durations.reduce((a, b) => a + b, 0) / totalCalls;
        const minDuration = Math.min(...durations);
        const maxDuration = Math.max(...durations);
        const lastCall = Math.max(...completedMetrics.map(m => m.startTime));

        return {
            totalCalls,
            averageDuration,
            minDuration,
            maxDuration,
            lastCall
        };
    }

    /**
     * Get all performance statistics
     */
    static getAllStats(): Record<string, PerformanceStats> {
        const stats: Record<string, PerformanceStats> = {};

        for (const name of this.metrics.keys()) {
            const stat = this.getStats(name);
            if (stat) {
                stats[name] = stat;
            }
        }

        return stats;
    }

    /**
     * Clear metrics for a specific operation
     */
    static clearMetrics(name: string): void {
        this.metrics.delete(name);
    }

    /**
     * Clear all metrics
     */
    static clearAllMetrics(): void {
        this.metrics.clear();
        this.activeTimers.clear();
    }

    /**
     * Export metrics for analysis
     */
    static exportMetrics(): Record<string, PerformanceMetric[]> {
        const exported: Record<string, PerformanceMetric[]> = {};

        for (const [name, metrics] of this.metrics.entries()) {
            exported[name] = [...metrics];
        }

        return exported;
    }

    /**
     * Log performance summary
     */
    static logSummary(): void {
        const stats = this.getAllStats();

        if (Object.keys(stats).length === 0) {
            console.log('[PerformanceMonitor] No performance data available');
            return;
        }

        console.group('[PerformanceMonitor] Performance Summary');

        for (const [name, stat] of Object.entries(stats)) {
            console.log(`${name}:`, {
                calls: stat.totalCalls,
                avg: `${stat.averageDuration.toFixed(2)}ms`,
                min: `${stat.minDuration.toFixed(2)}ms`,
                max: `${stat.maxDuration.toFixed(2)}ms`
            });
        }

        console.groupEnd();
    }
}

/**
 * Decorator for measuring method performance
 */
export function measurePerformance(name?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        const metricName = name || `${target.constructor.name}.${propertyKey}`;

        descriptor.value = async function (...args: any[]) {
            return PerformanceMonitor.measure(
                metricName,
                () => originalMethod.apply(this, args),
                { args: args.length }
            );
        };

        return descriptor;
    };
}

/**
 * Quiz-specific performance helpers
 */
export const QuizPerformance = {
    /**
     * Measure question loading time
     */
    measureQuestionLoad: (questionId: string) =>
        PerformanceMonitor.startTimer('quiz.question.load', { questionId }),

    /**
     * Measure answer submission time
     */
    measureAnswerSubmit: (questionId: string, answerId: string) =>
        PerformanceMonitor.startTimer('quiz.answer.submit', { questionId, answerId }),

    /**
     * Measure session creation time
     */
    measureSessionCreate: () =>
        PerformanceMonitor.startTimer('quiz.session.create'),

    /**
     * Measure database query time
     */
    measureDbQuery: (queryName: string) =>
        PerformanceMonitor.startTimer(`db.${queryName}`),

    /**
     * Get quiz performance summary
     */
    getQuizSummary: () => {
        const stats = PerformanceMonitor.getAllStats();
        const quizStats = Object.entries(stats)
            .filter(([name]) => name.startsWith('quiz.'))
            .reduce((acc, [name, stat]) => {
                acc[name] = stat;
                return acc;
            }, {} as Record<string, PerformanceStats>);

        return quizStats;
    }
};
