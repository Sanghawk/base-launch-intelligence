import { pgEnum } from 'drizzle-orm/pg-core';

export const confidenceLevel = pgEnum('confidence_level', [
  'low',
  'medium',
  'high'
]);

export const riskLevel = pgEnum('risk_level', [
  'unknown',
  'low',
  'medium',
  'high',
  'critical'
]);

export const triageLabel = pgEnum('triage_label', [
  'Ignore',
  'Risky',
  'Watch',
  'Research Deeper',
  'High Priority'
]);

export const alertType = pgEnum('alert_type', [
  'new_high_score_launch',
  'obvious_high_risk_launch'
]);

export const alertSeverity = pgEnum('alert_severity', [
  'low',
  'medium',
  'high',
  'critical'
]);

export const workerRunStatus = pgEnum('worker_run_status', [
  'running',
  'success',
  'partial_failure',
  'failure'
]);

export type ConfidenceLevel = (typeof confidenceLevel.enumValues)[number];
export type RiskLevel = (typeof riskLevel.enumValues)[number];
export type TriageLabel = (typeof triageLabel.enumValues)[number];
export type AlertType = (typeof alertType.enumValues)[number];
export type AlertSeverity = (typeof alertSeverity.enumValues)[number];
export type WorkerRunStatus = (typeof workerRunStatus.enumValues)[number];
