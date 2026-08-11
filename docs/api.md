# PDFForge API

Base URL: `/api/v1`

All job endpoints accept `multipart/form-data` and return a `job_id`. Poll the job status until `completed`, then download.

## Health

```
GET /api/v1/health
```

```json
{ "status": "ok", "version": "0.1.0" }
```

---

## Compress PDF

```
POST /api/v1/compress
```

| Field | Type | Notes |
| --- | --- | --- |
| `file` | file | PDF (max `MAX_FILE_SIZE_MB`) |
| `preset` | string | `lossless` \| `balanced` \| `maximum` (default `balanced`) |

## Split PDF

```
POST /api/v1/split
```

| Field | Type | Notes |
| --- | --- | --- |
| `file` | file | PDF |
| `page_spec` | string | e.g. `1-5`, `1,3,7`, `1-3,8-10` |
| `every` | int | split every N pages (alternative to `page_spec`) |

## Merge PDFs

```
POST /api/v1/merge
```

| Field | Type | Notes |
| --- | --- | --- |
| `files` | file[] | 2–20 PDFs, order = merge order |

## PDF to Image

```
POST /api/v1/pdf-to-image
```

| Field | Type | Notes |
| --- | --- | --- |
| `file` | file | PDF |
| `image_format` | string | `png` \| `jpg` (default `png`) |
| `dpi` | int | 50–400 (default 150) |
| `pages` | string | e.g. `1-5` (empty = all) |

Returns a ZIP archive.

## Remove Metadata

```
POST /api/v1/remove-metadata
```

| Field | Type |
| --- | --- |
| `file` | file |

---

## Job status

```
GET /api/v1/jobs/{job_id}
```

```json
{
  "id": "3f9c…",
  "tool": "compress",
  "status": "completed",
  "progress": 100,
  "original_size": 26004684,
  "output_size": 6396313,
  "reduction_percent": 75.4,
  "preset": "balanced",
  "error": null,
  "created_at": "2026-08-11T00:00:00Z",
  "expires_at": "2026-08-11T00:30:00Z"
}
```

Statuses: `queued` · `processing` · `completed` · `failed` · `expired` · `deleted`

## Download result

```
GET /api/v1/jobs/{job_id}/download
```

Returns the result (`application/pdf` or `application/zip`). Only available when `status = completed`.

## Delete job

```
DELETE /api/v1/jobs/{job_id}
```

Deletes the job files immediately (they are also auto-deleted after TTL).

## Errors

Errors return `4xx/5xx` with a JSON body: `{ "detail": "..." }`.

| Code | Meaning |
| --- | --- |
| `400` | Invalid upload / parameters |
| `404` | Job not found |
| `429` | Rate limit exceeded |
| `500` | Processing failure |
