# Security Policy

## Supported versions

Aurelia is a demonstration project. Only the latest release receives fixes.

| Version            | Supported |
| ------------------ | --------- |
| latest (>= 0.13.0) | Yes       |
| older releases     | No        |

## Reporting a vulnerability

Please **do not** open a public issue for security-sensitive findings. Report
them privately so they can be triaged before disclosure.

- Preferred channel: email the repository maintainer directly (see the
  commit history / GitHub profile for contact details).
- Include:
  - Affected version and commit hash.
  - A minimal reproduction (steps, relevant code, or a failing test).
  - Impact assessment if known.

A maintainer will acknowledge receipt within 5 business days and coordinate a
disclosure timeline. Public fix announcements go in the
[Changelog](CHANGELOG.md).

## Security notes for this project

- **This app never handles real money, credentials, or personal data.**
  Balances, settings, and profiles are stored client-side only, under a
  namespaced prefixed key, and can be cleared from the Settings screen.
- The project pins dependencies via the `pnpm-lock.yaml`; run `pnpm audit`
  before releases and keep `next`/`react` up to date.
- `core/randomness` offers both a crypto-backed source and a seeded source.
  Seeded randomness is intended for testing and replay, **never** for
  anything security-sensitive.
- Environment variables in this repo are placeholders only and must not
  contain secrets. See `.gitignore` - `.env*` files are never committed
  (except an optional `.env.example`).