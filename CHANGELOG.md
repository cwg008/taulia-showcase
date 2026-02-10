# Changelog

All notable changes to the Taulia Prototype Showcase will be documented in this file.

## [1.1.0] - 2026-02-09

### Security
- Enhanced Helmet configuration with Content Security Policy, HSTS, referrer policy
- Restricted CORS to specific allowed origins (no longer `origin: true` in production)
- Removed unauthenticated `/uploads` static file serving; files now only served through validated viewer route
- Added rate limiting on invite validation, invite acceptance, prospect, and viewer endpoints
- Strengthened password requirements: minimum 8 characters, must include uppercase, lowercase, and number
- Added timing-safe comparison for invite token validation to prevent timing attacks
- Hardened path traversal protection in viewer file serving with `path.resolve` and null-byte rejection
- Added security headers (X-Content-Type-Options, CSP) to served prototype files
- Hardened Dockerfile: pinned Node.js version (22.13), added non-root user, added HEALTHCHECK
- Error handler no longer leaks stack traces in production
- Added audit logging for all authentication events (login success, login failure, logout)
- Removed demo credentials from login page

### Added
- Version number displayed on login page
- Version number in admin sidebar footer
- Comprehensive audit trail for auth events (login, logout, failed attempts with reasons)

### Changed
- Bumped version to 1.1.0
- Password validation now enforces complexity requirements for invite acceptance

## [1.0.0] - 2026-02-09

### Added
- Initial release of Taulia Prototype Showcase
- Admin authentication with JWT httpOnly cookies
- Prototype management (create, update, delete, publish)
- Magic link generation for sharing prototypes with prospects
- Public viewer for prototype access via magic links
- Prospect portal with feedback submission
- User management with invite flow
- Audit logging for all admin actions
- Analytics dashboard with usage statistics
- Railway deployment with auto-deploy from GitHub
- SQLite database with Knex.js migrations
- Docker multi-stage build for production
