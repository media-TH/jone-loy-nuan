import { describe, it, expect } from 'vitest';
import { KPITargetManager, KPICalculationUtils } from '../kpi-target-service';
import type { KPICategory, KPITargetStatus } from '../../types';

describe('KPITargetManager', () => {
    describe('validateTargetPercentage', () => {
        it('should validate correct target percentages', () => {
            expect(KPITargetManager.validateTargetPercentage(0.0)).toBe(true);
            expect(KPITargetManager.validateTargetPercentage(0.5)).toBe(true);
            expect(KPITargetManager.validateTargetPercentage(0.8)).toBe(true);
            expect(KPITargetManager.validateTargetPercentage(1.0)).toBe(true);
        });

        it('should reject invalid target percentages', () => {
            expect(KPITargetManager.validateTargetPercentage(-0.1)).toBe(false);
            expect(KPITargetManager.validateTargetPercentage(1.1)).toBe(false);
            expect(KPITargetManager.validateTargetPercentage(2.0)).toBe(false);
        });
    });

    describe('createKPITarget', () => {
        it('should create a valid KPI target with default 80% threshold', () => {
            const target = KPITargetManager.createKPITarget('SCAM_RECOGNITION', 3);

            expect(target.kpiCategory).toBe('SCAM_RECOGNITION');
            expect(target.totalQuestions).toBe(3);
            expect(target.targetPercentage).toBe(0.8);
            expect(target.isActive).toBe(true);
        });

        it('should create a KPI target with custom threshold', () => {
            const target = KPITargetManager.createKPITarget('RISK_ASSESSMENT', 2, 0.9, 'Custom description');

            expect(target.kpiCategory).toBe('RISK_ASSESSMENT');
            expect(target.totalQuestions).toBe(2);
            expect(target.targetPercentage).toBe(0.9);
            expect(target.description).toBe('Custom description');
        });

        it('should throw error for invalid target percentage', () => {
            expect(() => {
                KPITargetManager.createKPITarget('SCAM_RECOGNITION', 3, 1.5);
            }).toThrow('Target percentage must be between 0 and 1');
        });

        it('should throw error for invalid total questions', () => {
            expect(() => {
                KPITargetManager.createKPITarget('SCAM_RECOGNITION', 0);
            }).toThrow('Total questions must be greater than 0');
        });
    });

    describe('calculateKPIStatus', () => {
        it('should calculate status for target met scenario (green indicator)', () => {
            const status = KPITargetManager.calculateKPIStatus(0.85, 0.8, 100);

            expect(status.currentRate).toBe(0.85);
            expect(status.targetRate).toBe(0.8);
            expect(status.isTargetMet).toBe(true);
            expect(status.totalResponses).toBe(100);
        });

        it('should calculate status for target not met scenario (red indicator)', () => {
            const status = KPITargetManager.calculateKPIStatus(0.75, 0.8, 50);

            expect(status.currentRate).toBe(0.75);
            expect(status.targetRate).toBe(0.8);
            expect(status.isTargetMet).toBe(false);
            expect(status.totalResponses).toBe(50);
        });

        it('should handle exact target achievement', () => {
            const status = KPITargetManager.calculateKPIStatus(0.8, 0.8, 25);

            expect(status.isTargetMet).toBe(true);
        });
    });

    describe('isTargetAchieved', () => {
        it('should return true when target is achieved', () => {
            expect(KPITargetManager.isTargetAchieved(0.85, 0.8)).toBe(true);
            expect(KPITargetManager.isTargetAchieved(0.8, 0.8)).toBe(true);
        });

        it('should return false when target is not achieved', () => {
            expect(KPITargetManager.isTargetAchieved(0.75, 0.8)).toBe(false);
            expect(KPITargetManager.isTargetAchieved(0.0, 0.8)).toBe(false);
        });
    });

    describe('calculateSuccessRate', () => {
        it('should calculate correct success rate', () => {
            expect(KPITargetManager.calculateSuccessRate(8, 10)).toBe(0.8);
            expect(KPITargetManager.calculateSuccessRate(2, 3)).toBeCloseTo(0.667, 3);
            expect(KPITargetManager.calculateSuccessRate(10, 10)).toBe(1.0);
        });

        it('should handle zero total responses', () => {
            expect(KPITargetManager.calculateSuccessRate(0, 0)).toBe(0);
        });
    });

    describe('getStatusIndicator', () => {
        it('should return green for target met', () => {
            expect(KPITargetManager.getStatusIndicator(true)).toBe('green');
        });

        it('should return red for target not met', () => {
            expect(KPITargetManager.getStatusIndicator(false)).toBe('red');
        });
    });

    describe('calculateImprovement', () => {
        it('should calculate positive improvement', () => {
            expect(KPITargetManager.calculateImprovement(0.9, 0.8)).toBeCloseTo(12.5, 1);
        });

        it('should calculate negative improvement', () => {
            expect(KPITargetManager.calculateImprovement(0.7, 0.8)).toBeCloseTo(-12.5, 1);
        });

        it('should handle zero previous rate', () => {
            expect(KPITargetManager.calculateImprovement(0.8, 0)).toBe(100);
            expect(KPITargetManager.calculateImprovement(0, 0)).toBe(0);
        });
    });

    describe('hasMinimumSampleSize', () => {
        it('should validate minimum sample size', () => {
            expect(KPITargetManager.hasMinimumSampleSize(15, 10)).toBe(true);
            expect(KPITargetManager.hasMinimumSampleSize(10, 10)).toBe(true);
            expect(KPITargetManager.hasMinimumSampleSize(5, 10)).toBe(false);
        });

        it('should use default minimum of 10', () => {
            expect(KPITargetManager.hasMinimumSampleSize(15)).toBe(true);
            expect(KPITargetManager.hasMinimumSampleSize(5)).toBe(false);
        });
    });

    describe('getKPICategoryConfig', () => {
        it('should return correct configuration for all KPI categories', () => {
            const config = KPITargetManager.getKPICategoryConfig();

            expect(config['SCAM_RECOGNITION'].totalQuestions).toBe(3);
            expect(config['RISK_ASSESSMENT'].totalQuestions).toBe(2);
            expect(config['PROTECTIVE_ACTIONS'].totalQuestions).toBe(3);
            expect(config['RESPONSE_STRATEGIES'].totalQuestions).toBe(2);

            expect(config['SCAM_RECOGNITION'].description).toContain('identify fraudulent');
            expect(config['RISK_ASSESSMENT'].description).toContain('threats and dangers');
        });
    });

    describe('createDefaultKPITargets', () => {
        it('should create all 4 default KPI targets with 80% threshold', () => {
            const targets = KPITargetManager.createDefaultKPITargets();

            expect(targets).toHaveLength(4);

            const categories = targets.map(t => t.kpiCategory);
            expect(categories).toContain('SCAM_RECOGNITION');
            expect(categories).toContain('RISK_ASSESSMENT');
            expect(categories).toContain('PROTECTIVE_ACTIONS');
            expect(categories).toContain('RESPONSE_STRATEGIES');

            targets.forEach(target => {
                expect(target.targetPercentage).toBe(0.8);
                expect(target.isActive).toBe(true);
            });
        });
    });
});

describe('KPICalculationUtils', () => {
    describe('calculateKPIScores', () => {
        it('should calculate correct KPI scores from responses', () => {
            const responses = [
                { kpiCategory: 'SCAM_RECOGNITION', isCorrect: true },
                { kpiCategory: 'SCAM_RECOGNITION', isCorrect: true },
                { kpiCategory: 'SCAM_RECOGNITION', isCorrect: false },
                { kpiCategory: 'RISK_ASSESSMENT', isCorrect: true },
                { kpiCategory: 'RISK_ASSESSMENT', isCorrect: true }
            ];

            const scores = KPICalculationUtils.calculateKPIScores(responses);

            expect(scores['SCAM_RECOGNITION']).toBeCloseTo(0.667, 3); // 2/3
            expect(scores['RISK_ASSESSMENT']).toBe(1.0); // 2/2
        });

        it('should handle empty responses', () => {
            const scores = KPICalculationUtils.calculateKPIScores([]);
            expect(Object.keys(scores)).toHaveLength(0);
        });
    });

    describe('aggregateKPIPerformance', () => {
        it('should aggregate KPI performance across multiple sessions', () => {
            const sessions = [
                {
                    scamRecognitionScore: 0.67,
                    riskAssessmentScore: 1.0,
                    protectiveActionsScore: 0.33,
                    responseStrategiesScore: 0.5
                },
                {
                    scamRecognitionScore: 1.0,
                    riskAssessmentScore: 0.5,
                    protectiveActionsScore: 0.67,
                    responseStrategiesScore: 1.0
                }
            ];

            const aggregation = KPICalculationUtils.aggregateKPIPerformance(sessions);

            expect(aggregation['SCAM_RECOGNITION'].averageScore).toBeCloseTo(0.835, 3);
            expect(aggregation['SCAM_RECOGNITION'].sessionCount).toBe(2);
            expect(aggregation['RISK_ASSESSMENT'].averageScore).toBe(0.75);
            expect(aggregation['PROTECTIVE_ACTIONS'].averageScore).toBe(0.5);
            expect(aggregation['RESPONSE_STRATEGIES'].averageScore).toBe(0.75);
        });

        it('should handle sessions with missing scores', () => {
            const sessions = [
                { scamRecognitionScore: 0.8 },
                { riskAssessmentScore: 0.5 }
            ];

            const aggregation = KPICalculationUtils.aggregateKPIPerformance(sessions);

            expect(aggregation['SCAM_RECOGNITION'].averageScore).toBe(0.8);
            expect(aggregation['SCAM_RECOGNITION'].sessionCount).toBe(1);
            expect(aggregation['RISK_ASSESSMENT'].averageScore).toBe(0.5);
            expect(aggregation['RISK_ASSESSMENT'].sessionCount).toBe(1);
            expect(aggregation['PROTECTIVE_ACTIONS'].averageScore).toBe(0);
            expect(aggregation['PROTECTIVE_ACTIONS'].sessionCount).toBe(0);
        });
    });

    describe('calculateOverallCampaignScore', () => {
        it('should calculate overall campaign score from KPI statuses', () => {
            const kpiStatuses: Record<KPICategory, KPITargetStatus> = {
                'SCAM_RECOGNITION': { currentRate: 0.85, targetRate: 0.8, isTargetMet: true, totalResponses: 100, category: 'SCAM_RECOGNITION' },
                'RISK_ASSESSMENT': { currentRate: 0.75, targetRate: 0.8, isTargetMet: false, totalResponses: 100, category: 'RISK_ASSESSMENT' },
                'PROTECTIVE_ACTIONS': { currentRate: 0.90, targetRate: 0.8, isTargetMet: true, totalResponses: 100, category: 'PROTECTIVE_ACTIONS' },
                'RESPONSE_STRATEGIES': { currentRate: 0.70, targetRate: 0.8, isTargetMet: false, totalResponses: 100, category: 'RESPONSE_STRATEGIES' }
            };

            const score = KPICalculationUtils.calculateOverallCampaignScore(kpiStatuses);

            // (85 + 75 + 90 + 70) / 4 = 80
            expect(score).toBe(80);
        });

        it('should handle empty KPI statuses', () => {
            const score = KPICalculationUtils.calculateOverallCampaignScore({} as Record<KPICategory, KPITargetStatus>);
            expect(score).toBe(0);
        });
    });
});
