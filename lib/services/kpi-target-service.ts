import type { KPITarget, KPITargetStatus, KPICategory } from '../types';

/**
 * KPI Target Management System
 * Handles KPI target validation, achievement calculations, and status determination
 */

export class KPITargetManager {
    private static readonly DEFAULT_TARGET_PERCENTAGE = 0.80; // 80%
    private static readonly MIN_TARGET_PERCENTAGE = 0.0;
    private static readonly MAX_TARGET_PERCENTAGE = 1.0;

    /**
     * Validates KPI target percentage (must be between 0.0 and 1.0)
     */
    static validateTargetPercentage(percentage: number): boolean {
        return percentage >= this.MIN_TARGET_PERCENTAGE &&
            percentage <= this.MAX_TARGET_PERCENTAGE;
    }

    /**
     * Creates a new KPI target with validation
     */
    static createKPITarget(
        kpiCategory: KPICategory,
        totalQuestions: number,
        targetPercentage: number = this.DEFAULT_TARGET_PERCENTAGE,
        description?: string
    ): Omit<KPITarget, 'id' | 'createdAt'> {
        if (!this.validateTargetPercentage(targetPercentage)) {
            throw new Error(`Target percentage must be between ${this.MIN_TARGET_PERCENTAGE} and ${this.MAX_TARGET_PERCENTAGE}`);
        }

        if (totalQuestions <= 0) {
            throw new Error('Total questions must be greater than 0');
        }

        return {
            kpiCategory,
            targetPercentage,
            totalQuestions,
            description,
            isActive: true
        };
    }

    /**
     * Calculates KPI achievement status based on current success rate
     */
    static calculateKPIStatus(
        currentSuccessRate: number,
        targetPercentage: number,
        totalResponses: number
    ): KPITargetStatus {
        const isTargetMet = currentSuccessRate >= targetPercentage;

        return {
            category: '', // Will be set by caller
            currentRate: currentSuccessRate,
            targetRate: targetPercentage,
            isTargetMet,
            totalResponses
        };
    }

    /**
     * Determines if KPI target is met (green/red indicator logic)
     */
    static isTargetAchieved(currentRate: number, targetRate: number): boolean {
        return currentRate >= targetRate;
    }

    /**
     * Calculates success rate from correct answers and total responses
     */
    static calculateSuccessRate(correctAnswers: number, totalResponses: number): number {
        if (totalResponses === 0) {
            return 0;
        }
        return correctAnswers / totalResponses;
    }

    /**
     * Gets the status indicator (green/red) for dashboard display
     */
    static getStatusIndicator(isTargetMet: boolean): 'green' | 'red' {
        return isTargetMet ? 'green' : 'red';
    }

    /**
     * Calculates improvement percentage compared to previous period
     */
    static calculateImprovement(currentRate: number, previousRate: number): number {
        if (previousRate === 0) {
            return currentRate > 0 ? 100 : 0;
        }
        return ((currentRate - previousRate) / previousRate) * 100;
    }

    /**
     * Validates minimum sample size for reliable KPI reporting
     */
    static hasMinimumSampleSize(totalResponses: number, minimumRequired: number = 10): boolean {
        return totalResponses >= minimumRequired;
    }

    /**
     * Gets KPI category configuration with default values
     */
    static getKPICategoryConfig(): Record<KPICategory, { totalQuestions: number; description: string }> {
        return {
            'SCAM_RECOGNITION': {
                totalQuestions: 3,
                description: 'Ability to identify fraudulent content'
            },
            'RISK_ASSESSMENT': {
                totalQuestions: 2,
                description: 'Evaluating potential threats and dangers'
            },
            'PROTECTIVE_ACTIONS': {
                totalQuestions: 3,
                description: 'Knowledge of preventive measures'
            },
            'RESPONSE_STRATEGIES': {
                totalQuestions: 2,
                description: 'Appropriate reactions to scam attempts'
            }
        };
    }

    /**
     * Creates all default KPI targets for the system
     */
    static createDefaultKPITargets(): Omit<KPITarget, 'id' | 'createdAt'>[] {
        const config = this.getKPICategoryConfig();

        return Object.entries(config).map(([category, { totalQuestions, description }]) =>
            this.createKPITarget(
                category as KPICategory,
                totalQuestions,
                this.DEFAULT_TARGET_PERCENTAGE,
                description
            )
        );
    }
}

/**
 * Utility functions for KPI target achievement calculations
 */
export class KPICalculationUtils {
    /**
     * Calculates KPI scores for a quiz session based on question responses
     */
    static calculateKPIScores(responses: Array<{
        kpiCategory: string;
        isCorrect: boolean;
    }>): Record<string, number> {
        const categoryStats: Record<string, { correct: number; total: number }> = {};

        // Group responses by KPI category
        responses.forEach(response => {
            if (!categoryStats[response.kpiCategory]) {
                categoryStats[response.kpiCategory] = { correct: 0, total: 0 };
            }

            categoryStats[response.kpiCategory].total++;
            if (response.isCorrect) {
                categoryStats[response.kpiCategory].correct++;
            }
        });

        // Calculate scores (0.0 to 1.0)
        const scores: Record<string, number> = {};
        Object.entries(categoryStats).forEach(([category, stats]) => {
            scores[category] = KPITargetManager.calculateSuccessRate(stats.correct, stats.total);
        });

        return scores;
    }

    /**
     * Aggregates KPI performance across multiple quiz sessions
     */
    static aggregateKPIPerformance(sessions: Array<{
        scamRecognitionScore?: number;
        riskAssessmentScore?: number;
        protectiveActionsScore?: number;
        responseStrategiesScore?: number;
    }>): Record<KPICategory, { averageScore: number; sessionCount: number }> {
        const aggregation: Record<KPICategory, { totalScore: number; sessionCount: number }> = {
            'SCAM_RECOGNITION': { totalScore: 0, sessionCount: 0 },
            'RISK_ASSESSMENT': { totalScore: 0, sessionCount: 0 },
            'PROTECTIVE_ACTIONS': { totalScore: 0, sessionCount: 0 },
            'RESPONSE_STRATEGIES': { totalScore: 0, sessionCount: 0 }
        };

        sessions.forEach(session => {
            if (session.scamRecognitionScore !== undefined) {
                aggregation['SCAM_RECOGNITION'].totalScore += session.scamRecognitionScore;
                aggregation['SCAM_RECOGNITION'].sessionCount++;
            }
            if (session.riskAssessmentScore !== undefined) {
                aggregation['RISK_ASSESSMENT'].totalScore += session.riskAssessmentScore;
                aggregation['RISK_ASSESSMENT'].sessionCount++;
            }
            if (session.protectiveActionsScore !== undefined) {
                aggregation['PROTECTIVE_ACTIONS'].totalScore += session.protectiveActionsScore;
                aggregation['PROTECTIVE_ACTIONS'].sessionCount++;
            }
            if (session.responseStrategiesScore !== undefined) {
                aggregation['RESPONSE_STRATEGIES'].totalScore += session.responseStrategiesScore;
                aggregation['RESPONSE_STRATEGIES'].sessionCount++;
            }
        });

        // Calculate averages
        const result = {} as Record<KPICategory, { averageScore: number; sessionCount: number }>;
        Object.entries(aggregation).forEach(([category, data]) => {
            result[category as KPICategory] = {
                averageScore: data.sessionCount > 0 ? data.totalScore / data.sessionCount : 0,
                sessionCount: data.sessionCount
            };
        });

        return result;
    }

    /**
     * Determines overall campaign effectiveness score (0-100)
     */
    static calculateOverallCampaignScore(kpiStatuses: Record<KPICategory, KPITargetStatus>): number {
        const categories = Object.keys(kpiStatuses) as KPICategory[];
        if (categories.length === 0) return 0;

        const totalScore = categories.reduce((sum, category) => {
            return sum + (kpiStatuses[category].currentRate * 100);
        }, 0);

        return Math.round(totalScore / categories.length);
    }
}
