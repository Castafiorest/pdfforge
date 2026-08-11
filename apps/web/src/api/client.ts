import {
  API_PREFIX,
  type BatchCompressResponse,
  type JobCreateResponse,
  type JobStatusResponse,
} from '@pdfforge/shared';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseError(res: Response): Promise<never> {
  let detail = res.statusText;
  try {
    const body = await res.json();
    if (typeof body.detail === 'string') detail = body.detail;
  } catch {
    /* keep default */
  }
  throw new ApiError(detail, res.status);
}

export function downloadUrl(jobId: string): string {
  return `${API_PREFIX}/jobs/${jobId}/download`;
}

export async function createJob(
  tool: string,
  file: File,
  params?: Record<string, string>,
): Promise<JobCreateResponse> {
  const form = new FormData();
  form.append('file', file);
  for (const [key, value] of Object.entries(params ?? {})) {
    form.append(key, value);
  }
  const res = await fetch(`${API_PREFIX}/${tool}`, { method: 'POST', body: form });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function createMergeJob(files: File[]): Promise<JobCreateResponse> {
  const form = new FormData();
  for (const file of files) form.append('files', file);
  const res = await fetch(`${API_PREFIX}/merge`, { method: 'POST', body: form });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function createCompressBatch(
  files: File[],
  preset: string,
): Promise<BatchCompressResponse> {
  const form = new FormData();
  for (const file of files) form.append('files', file);
  form.append('preset', preset);
  const res = await fetch(`${API_PREFIX}/compress-batch`, { method: 'POST', body: form });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function getJob(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`${API_PREFIX}/jobs/${jobId}`);
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function deleteJob(jobId: string): Promise<void> {
  await fetch(`${API_PREFIX}/jobs/${jobId}`, { method: 'DELETE' });
}

export function apiErrorMessage(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

export async function fetchPagePreview(
  file: File,
  page: number,
  width = 180,
): Promise<Blob> {
  const form = new FormData();
  form.append('file', file);
  form.append('page', String(page));
  form.append('width', String(width));
  const res = await fetch(`${API_PREFIX}/preview`, { method: 'POST', body: form });
  if (!res.ok) await parseError(res);
  return res.blob();
}
