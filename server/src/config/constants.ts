// ── Auth ──────────────────────────────────────────────────────────────
export const ACCESS_TOKEN_COOKIE_NAME  = 'transitops_access'
export const REFRESH_TOKEN_COOKIE_NAME = 'transitops_refresh'
export const ACCESS_TOKEN_MAX_AGE      = 15 * 60 * 1000          // 15 minutes
export const REFRESH_TOKEN_MAX_AGE     = 7 * 24 * 60 * 60 * 1000 // 7 days
export const REFRESH_TOKEN_REUSE_WINDOW = 30 * 1000              // 30 seconds grace for rotation

// ── Pagination ────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE        = 20
export const MAX_PAGE_SIZE            = 100

// ── Business Rules ────────────────────────────────────────────────────
export const FLAT_RATE_PER_KM         = 50   // ₹50/km — default revenue if not entered at trip completion
export const LICENSE_EXPIRY_WARNING_DAYS = 30
export const SAFETY_SCORE_DEFAULT     = 100

// ── Security ─────────────────────────────────────────────────────────
export const BCRYPT_SALT_ROUNDS       = 10
export const LOGIN_RATE_LIMIT_WINDOW  = 15 * 60 * 1000  // 15 minutes
export const LOGIN_RATE_LIMIT_MAX     = 10

// ── Infra ─────────────────────────────────────────────────────────────
export const GRACEFUL_SHUTDOWN_TIMEOUT = 10_000  // 10s force-exit on shutdown

// ── Health Check ──────────────────────────────────────────────────────
export const HEALTH_CHECK_QUERY       = 'SELECT 1'
