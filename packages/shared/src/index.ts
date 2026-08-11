/**
 * Shared constants & types between web and api.
 * Keep this dependency-free so it can be imported anywhere.
 */

export const API_PREFIX = '/api/v1';

export const TOOLS = [
  'compress',
  'merge',
  'split',
  'organize',
  'image-to-pdf',
  'pdf-to-image',
  'remove-metadata',
] as const;

export type ToolName = (typeof TOOLS)[number];

export const JOB_STATUSES = [
  'queued',
  'processing',
  'completed',
  'failed',
  'expired',
  'deleted',
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export type JobStatusResponse = {
  id: string;
  tool: string;
  status: JobStatus;
  progress: number;
  original_filename: string | null;
  original_size: number | null;
  output_size: number | null;
  reduction_percent: number | null;
  preset: string | null;
  error: string | null;
  created_at: string | null;
  expires_at: string | null;
};

export type JobCreateResponse = {
  job_id: string;
  status: string;
};

export type BatchJobItem = {
  job_id: string;
  filename: string | null;
  original_size: number | null;
};

export type BatchCompressResponse = {
  jobs: BatchJobItem[];
};

export const COMPRESS_PRESETS = ['lossless', 'balanced', 'maximum'] as const;
export type CompressPreset = (typeof COMPRESS_PRESETS)[number];

export const DEFAULT_CLIENT_SIDE_MAX_MB = 40;
