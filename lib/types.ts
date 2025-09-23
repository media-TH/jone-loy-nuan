"use client";

import type { Database } from "./database.types";

// ✨ Global Types for Quiz Application

export interface QuizContent {
	type: "image" | "text" | "svg" | "component";
	data: string;
	alt?: string;
	component?: string;
	images?: {
		normal: string;
		result: string;
	};
}

export interface Answer {
	id: string;
	text: string;
	isCorrect: boolean;
}

export interface QuizResult {
	correctTitle: string;
	wrongTitle: string;
	header: string;
	explanation: string;
}

// 🆕 เพิ่ม type สำหรับ Scam Categories
export type ScamCategory =
	| "SMS_SCAM"
	| "LOAN_APP_SCAM"
	| "JOB_SCAM"
	| "INVESTMENT_SCAM"
	| "ROMANCE_SCAM"
	| "GROUP_SCAM"
	| "PIN_SCAM"
	| "POLICE_AD_SCAM"
	| "POLICE_CALL_SCAM"
	| "MULE_ACCOUNT_SCAM";

export interface QuizQuestion {
	id: string;
	question: string;
	content: QuizContent;
	answers: Answer[];
	result: QuizResult;

	category?: ScamCategory;
	difficulty?: "easy" | "medium" | "hard";
	tags?: string[];
	orderIndex: number;
}

// Component Props Types
export interface ContentAreaProps {
	content: QuizContent;
	className?: string;
	variant?: "default" | "compact" | "fullscreen";
	animate?: boolean;
	tooltipContent?: string;
	tooltipVariant?: "default" | "warning" | "danger" | "info";
	showResult?: boolean;
	onAnswer?: (isCorrect: boolean) => void;
}

// เพิ่มใหม่ - Answer Panel Layout Types
export type AnswerPanelLayout = "auto" | "vertical" | "horizontal" | "hidden";

// อัปเดต AnswerPanelProps
export interface AnswerPanelProps {
	answers?: Answer[] | null;
	selectedAnswer: string | null;
	showResult: boolean;
	hideAnswers?: boolean;
	onAnswerSelect: (answerId: string) => void;
	layout?: AnswerPanelLayout;
	className?: string;
}

export interface QuestionSectionProps {
	question: string;
	className?: string;
}

export interface ResultCardProps {
	showResult: boolean;
	isCorrect: boolean | null;
	result: QuizResult;
	onReset: () => void;
	isLoading?: boolean;
}

export interface ChatScenarioProps {
	className?: string;
	animate?: boolean;
	showResult?: boolean;
}

// Button Variants
export type ButtonVariant = "quiz" | "quiz-correct" | "quiz-wrong";

// Animation Types
export interface AnimationConfig {
	duration: number;
	delay: number;
	ease: string;
}

export interface PageTransitionProps {
	children: React.ReactNode;
	className?: string;
}

// เพิ่ม type สำหรับ interactive scenario
export interface InteractiveAdScenarioProps {
	className?: string;
	animate?: boolean;
	showResult?: boolean;
}

export interface QuestionWithAnswers {
	id: string;
	order_index: number;
	question_text: string;
	category?: string;
	content?: any;
	result?: any;
	kpi_category?: string;
	created_at: string;
	updated_at: string;
	answers?: Answer[];
}

// --- Campaign Tracking Types ---

// Campaign Traffic Interface
export interface TrafficSource {
	id: string;
	platform: 'facebook' | 'instagram' | 'twitter' | 'line';
	campaignId?: string;
	utmSource?: string;
	utmMedium?: string;
	utmCampaign?: string;
	createdAt: Date;
}

// Quiz Session Interface for Campaign Tracking
export interface QuizSession {
	id: string;
	sessionId: string;
	trafficSourceId?: string;
	anonymousUserId?: string;

	totalQuestions: number;
	completedQuestions: number;
	correctAnswers: number;
	isCompleted: boolean;
	completionTimeMs?: number;

	// KPI Scores (0.0 to 1.0)
	scamRecognitionScore?: number;
	riskAssessmentScore?: number;
	protectiveActionsScore?: number;
	responseStrategiesScore?: number;

	createdAt: Date;
	expiresAt: Date;
}

// KPI Target Interface
export interface KPITarget {
	id: string;
	kpiCategory: 'SCAM_RECOGNITION' | 'RISK_ASSESSMENT' | 'PROTECTIVE_ACTIONS' | 'RESPONSE_STRATEGIES';
	targetPercentage: number; // 0.80 for 80%
	totalQuestions: number;
	description?: string;
	isActive: boolean;
	currentSuccessRate?: number;
	isTargetMet?: boolean;
	createdAt: Date;
}

// KPI Target Status for Dashboard
export interface KPITargetStatus {
	category: string;
	currentRate: number;
	targetRate: number;
	isTargetMet: boolean;
	totalResponses: number;
	improvement?: number; // vs previous period
}

// Traffic Performance Metrics
export interface TrafficPerformance {
	platform: string;
	totalClicks: number;
	completedQuizzes: number;
	completionRate: number;
	avgKPIScore: number;
}

// Executive Dashboard Interface
export interface ExecutiveDashboard {
	totalCompletedSessions: number;
	totalStartedSessions: number;
	completionRate: number;

	kpiTargetStatus: {
		scamRecognition: KPITargetStatus;
		riskAssessment: KPITargetStatus;
		protectiveActions: KPITargetStatus;
		responseStrategies: KPITargetStatus;
	};

	trafficSourcePerformance: TrafficPerformance[];
	overallCampaignScore: number; // 0-100
}

// Question Response for Campaign Analytics
export interface QuestionResponse {
	id: string;
	quizSessionId: string;
	questionId: string;
	selectedAnswerId: string;
	isCorrect: boolean;
	responseTimeMs?: number;
	kpiCategory: string;
	questionOrder: number;
	createdAt: Date;
}

// Survey Response Interface
export interface SurveyResponse {
	id: string;
	quizSessionId: string;
	ageRange?: string;
	educationLevel?: string;
	occupationType?: string;
	contentHelpfulness?: number; // 1-5
	difficultyRating?: number; // 1-5
	additionalFeedback?: string;
	createdAt: Date;
}

// Campaign Analytics Types
export enum KPICategory {
	SCAM_RECOGNITION = 'SCAM_RECOGNITION',
	RISK_ASSESSMENT = 'RISK_ASSESSMENT',
	PROTECTIVE_ACTIONS = 'PROTECTIVE_ACTIONS',
	RESPONSE_STRATEGIES = 'RESPONSE_STRATEGIES'
}
export type SocialMediaPlatform = 'facebook' | 'instagram' | 'twitter' | 'line';

// --- Database & API Related Types ---
