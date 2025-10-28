# Changelog

## [0.1.0] - 2025-10-22

### Added
- Initial release of Redis cron adapter for Motia
- Distributed locking to prevent duplicate cron job executions
- Automatic TTL for lock expiration
- Lock renewal support for long-running jobs
- Health check functionality
- Configurable retry logic for lock acquisition
- Instance tracking for monitoring
- Graceful shutdown with automatic lock cleanup
- Full TypeScript support with type definitions
- Comprehensive documentation and examples

