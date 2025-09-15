# Implementation Plan: Media Fund Content Effectiveness System

- [x] 1. Database Schema Setup for Campaign Tracking
  - Create database migration files for campaign-focused tables (traffic_sources, quiz_sessions, question_responses, survey_responses, kpi_targets)
  - Add kpi_category_id column to existing questions table
  - Insert KPI targets configuration (4 categories: 3/2/3/2 questions, 80% targets)
  - Create indexes for performance optimization on analytics queries
  - _Requirements: 1.1, 1.2, 2.1, 9.1_

- [x] 2. Campaign Tracking Data Models





- [x] 2.1 Implement TypeScript interfaces for campaign system


  - Create TrafficSource, QuizSession, KPITarget, and ExecutiveDashboard interfaces
  - Add campaign-focused types to lib/types.ts for traffic tracking and KPI monitoring
  - Update database.types.ts with new campaign-focused table definitions
  - _Requirements: 1.1, 2.1, 5.1_

- [x] 2.2 Create KPI target management system


  - Implement KPITarget class with 80% threshold validation
  - Create utility functions for KPI target achievement calculations
  - Write unit tests for KPI target status determination (green/red indicators)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3. Traffic Source Tracking System
- [ ] 3.1 Implement UTM parameter capture and traffic source attribution
  - Create service for capturing UTM parameters from campaign links
  - Implement traffic source identification (Facebook, Instagram, Twitter, LINE)
  - Add anonymous user ID generation and browser localStorage persistence
  - Write unit tests for traffic source attribution accuracy
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 3.2 Integrate traffic tracking with quiz initialization
  - Modify quiz components to capture referrer information on quiz start
  - Update quiz state management to include traffic source data
  - Implement session linking between traffic source and quiz responses
  - _Requirements: 2.1, 2.2_

- [ ] 4. Quiz Session and Response Recording
- [ ] 4.1 Create quiz session management service
  - Implement service to create and manage quiz sessions with traffic source linking
  - Add KPI score calculation for 4 categories (3/2/3/2 question distribution)
  - Create functions for tracking completion status and calculating overall scores
  - Write unit tests for session management and KPI score accuracy
  - _Requirements: 1.1, 1.2, 4.1, 4.2_

- [ ] 4.2 Integrate response recording with KPI tracking
  - Modify quiz answer handling to record responses and update KPI scores
  - Add real-time KPI score calculation as users progress through questions
  - Implement completion tracking and final score calculation
  - Update quiz components to display individual scores (e.g., "7/10 total", "SCAM_RECOGNITION: 2/3")
  - _Requirements: 1.2, 5.2, 5.3_

- [ ] 5. Executive Dashboard Implementation
- [ ] 5.1 Create executive dashboard API endpoints
  - Implement REST API endpoints for executive dashboard metrics
  - Add KPI target achievement status calculation (green/red indicators for 80% targets)
  - Create endpoints for traffic source performance and completion rates
  - Write unit tests for dashboard data accuracy and target status determination
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 5.2 Build executive dashboard UI components
  - Create React components for executive dashboard layout showing key metrics
  - Implement KPI target status visualization with clear green/red indicators
  - Add traffic source performance charts and completion rate displays
  - Create responsive dashboard design optimized for BOT presentation
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 6. Content Gap Analysis System
- [ ] 6.1 Implement wrong answer pattern analysis
  - Create functions to identify frequently selected incorrect answers per question
  - Implement analysis of which KPIs are falling below 80% targets and why
  - Add common misconception identification for content development guidance
  - Write unit tests for wrong answer pattern detection accuracy
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 6.2 Create content recommendation engine
  - Implement system to suggest content priorities based on KPI performance gaps
  - Add analysis of which social media campaigns are most/least effective
  - Create recommendations for improving underperforming KPI categories
  - Build reporting interface for content team to identify improvement areas
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7. Campaign Engagement Measurement
- [ ] 7.1 Implement completion rate tracking by traffic source
  - Create service to calculate completion rates by social media platform
  - Implement analysis of drop-off points and engagement patterns
  - Add tracking of which campaigns drive highest completion rates
  - Write unit tests for engagement metric calculations
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 7.2 Create campaign performance visualization
  - Build React components for displaying traffic source performance
  - Implement completion rate charts by social media platform
  - Add engagement metrics visualization for campaign optimization
  - Create mobile-responsive design for campaign managers
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 8. Optional Survey Integration
- [ ] 8.1 Create survey component and data collection
  - Implement optional survey component displayed after quiz completion
  - Add survey questions for demographics and content feedback
  - Create service to link survey responses with quiz performance data
  - Write unit tests for survey data collection and linking
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 8.2 Integrate survey insights with campaign analytics
  - Implement correlation analysis between survey data and KPI performance
  - Add demographic segmentation for campaign targeting insights
  - Create survey feedback integration with content gap analysis
  - Build reporting interface showing survey insights for campaign optimization
  - _Requirements: 7.1, 7.3, 7.4_

- [ ] 9. Data Seeding Support and Volume Management
- [ ] 9.1 Create database utilities for data seeding
  - Implement SQL scripts for seeding quiz response data to reach target volumes
  - Add utilities to generate realistic response patterns for testing
  - Create data validation functions to ensure seeded data quality
  - Write documentation for manual data seeding process via SQL Editor
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 9.2 Implement high-volume data handling optimization
  - Optimize database queries for handling 1000+ quiz responses efficiently
  - Add database indexing and query optimization for large datasets
  - Implement pagination and data loading optimization for dashboard performance
  - Create monitoring for system performance with high data volumes
  - _Requirements: 6.1, 6.4_

- [ ] 10. Data Privacy and Retention Management
- [ ] 10.1 Implement anonymous data handling and auto-cleanup
  - Create anonymous user identification system using browser localStorage
  - Implement automatic data expiration after 45 days
  - Add data aggregation methods that prevent individual user identification
  - Write privacy compliance tests for anonymous data handling
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 10.2 Create data transparency and management tools
  - Implement clear data composition reporting (organic vs seeded data)
  - Add data quality validation and integrity checks
  - Create utilities for data cleanup and maintenance
  - Build monitoring for data retention policy compliance
  - _Requirements: 9.1, 9.3, 9.4_

- [ ] 11. BOT Reporting and Export Functionality
- [ ] 11.1 Create BOT-focused reporting system
  - Implement executive report generation showing campaign effectiveness
  - Add KPI achievement summary with clear success/failure indicators
  - Create traffic source ROI analysis for campaign budget justification
  - Write unit tests for report accuracy and data consistency
  - _Requirements: 5.1, 5.2, 5.4_

- [ ] 11.2 Build data export functionality for research
  - Implement CSV/Excel export of anonymized campaign performance data
  - Add aggregated statistics export for policy development research
  - Create comparative analysis exports across different time periods
  - Build automated report scheduling for regular BOT updates
  - _Requirements: 5.1, 5.4_

- [ ] 12. Integration Testing and Campaign Validation
- [ ] 12.1 Create end-to-end campaign flow testing
  - Write integration tests for complete social media → quiz → dashboard flow
  - Implement tests for UTM parameter capture and traffic source attribution
  - Create tests for KPI target achievement calculation accuracy
  - Add performance tests for high-volume social media traffic handling
  - _Requirements: All campaign flow requirements validation_

- [ ] 12.2 Implement system monitoring and error handling
  - Create monitoring for campaign performance and system health
  - Implement graceful error handling for traffic tracking failures
  - Add fallback mechanisms for dashboard data loading issues
  - Create alerting for KPI target achievement status changes
  - _Requirements: System reliability and campaign effectiveness monitoring_