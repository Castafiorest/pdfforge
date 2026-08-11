# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| Latest release | ✅ |
| Older releases | ❌ |

## Reporting a vulnerability

Please **do not open a public issue** for security vulnerabilities.

Email the maintainers privately (or open a private advisory via GitHub → Security → Report a vulnerability) with:

- Affected version(s).
- Description of the vulnerability.
- Steps to reproduce (as much detail as possible).
- Impact assessment.

You should receive a response within **7 days**. If the issue is confirmed, we will:

1. Fix it on a private branch.
2. Release a patched version.
3. Credit the reporter (unless they prefer anonymity).

## Security design notes

- Uploads are validated: MIME type, PDF magic bytes (`%PDF-`), size limits, page-count limits, zip-bomb protection.
- Uploaded filenames are never trusted — internal UUID names are used.
- Workers run as **non-root** with CPU/memory limits and read-only filesystems where practical.
- Ghostscript runs sandboxed (`-dSAFER`, disabled unsafe devices) in an isolated process.
- Files are stored in a temp dir and automatically deleted after TTL (default 30 minutes).
- Document contents are never logged, stored in the database, or used for analytics/AI training.
- Rate limiting is enforced per IP; limits are configurable.

## Responsible disclosure

Please give us reasonable time to fix and release before public disclosure.
