/**
 * In-memory sliding window rate limiter for authentication endpoints.
 * Protects against brute-force attacks and credential stuffing.
 */

interface RateLimitRecord {
  attempts: number;
  firstAttemptTime: number;
  blockedUntil: number | null;
}

const store = new Map<string, RateLimitRecord>();

// Default configuration: 5 attempts per 15 minutes, 15-minute lockout
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if an identifier (IP address or email) is currently rate-limited.
 */
export function checkRateLimit(
  key: string,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  windowMs = DEFAULT_WINDOW_MS
): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const record = store.get(key);

  if (!record) {
    return {
      allowed: true,
      remaining: maxAttempts,
      retryAfterSeconds: 0,
    };
  }

  // If currently locked out
  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  // If window has passed, reset
  if (now - record.firstAttemptTime > windowMs) {
    store.delete(key);
    return {
      allowed: true,
      remaining: maxAttempts,
      retryAfterSeconds: 0,
    };
  }

  // In active window but not locked out
  const remaining = Math.max(0, maxAttempts - record.attempts);
  const isAllowed = record.attempts < maxAttempts;

  return {
    allowed: isAllowed,
    remaining,
    retryAfterSeconds: isAllowed
      ? 0
      : Math.ceil((record.firstAttemptTime + windowMs - now) / 1000),
  };
}

/**
 * Record a failed login attempt. Locks out if threshold is reached.
 */
export function recordFailedAttempt(
  key: string,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  windowMs = DEFAULT_WINDOW_MS,
  blockDurationMs = DEFAULT_BLOCK_DURATION_MS
): {
  blocked: boolean;
  remaining: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  let record = store.get(key);

  if (!record || now - record.firstAttemptTime > windowMs) {
    record = {
      attempts: 1,
      firstAttemptTime: now,
      blockedUntil: null,
    };
  } else {
    record.attempts += 1;
  }

  if (record.attempts >= maxAttempts) {
    record.blockedUntil = now + blockDurationMs;
    store.set(key, record);
    return {
      blocked: true,
      remaining: 0,
      retryAfterSeconds: Math.ceil(blockDurationMs / 1000),
    };
  }

  store.set(key, record);
  return {
    blocked: false,
    remaining: Math.max(0, maxAttempts - record.attempts),
    retryAfterSeconds: 0,
  };
}

/**
 * Reset rate limit record on successful login.
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Helper to extract client IP address from request headers.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

