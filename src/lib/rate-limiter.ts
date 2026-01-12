/**
 * Client-side rate limiter untuk login attempts
 * Menggunakan localStorage untuk persistence
 */

interface RateLimitData {
  attempts: number;
  resetAt: number;
  lockedUntil?: number;
}

const RATE_LIMIT_KEY = 'login_rate_limit';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const RESET_DURATION = 15 * 60 * 1000; // 15 minutes

export class RateLimiter {
  private static getKey(identifier: string): string {
    return `${RATE_LIMIT_KEY}_${identifier}`;
  }

  private static getData(identifier: string): RateLimitData | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = localStorage.getItem(this.getKey(identifier));
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  private static setData(identifier: string, data: RateLimitData): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.getKey(identifier), JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save rate limit data', err);
    }
  }

  /**
   * Check if identifier is currently rate limited
   */
  static isLocked(identifier: string): { locked: boolean; remainingTime?: number } {
    const data = this.getData(identifier);
    if (!data) return { locked: false };

    const now = Date.now();

    // Check if locked
    if (data.lockedUntil && data.lockedUntil > now) {
      return {
        locked: true,
        remainingTime: Math.ceil((data.lockedUntil - now) / 1000), // in seconds
      };
    }

    // Reset if past reset time
    if (data.resetAt < now) {
      this.reset(identifier);
      return { locked: false };
    }

    return { locked: false };
  }

  /**
   * Record a failed login attempt
   */
  static recordAttempt(identifier: string): { 
    locked: boolean; 
    attemptsRemaining: number;
    remainingTime?: number;
  } {
    const now = Date.now();
    let data = this.getData(identifier);

    if (!data || data.resetAt < now) {
      // Start new tracking period
      data = {
        attempts: 1,
        resetAt: now + RESET_DURATION,
      };
    } else {
      // Increment attempts
      data.attempts += 1;
    }

    // Check if should be locked
    if (data.attempts >= MAX_ATTEMPTS) {
      data.lockedUntil = now + LOCKOUT_DURATION;
      this.setData(identifier, data);
      return {
        locked: true,
        attemptsRemaining: 0,
        remainingTime: Math.ceil(LOCKOUT_DURATION / 1000),
      };
    }

    this.setData(identifier, data);
    return {
      locked: false,
      attemptsRemaining: MAX_ATTEMPTS - data.attempts,
    };
  }

  /**
   * Reset rate limit for identifier (e.g., after successful login)
   */
  static reset(identifier: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.getKey(identifier));
  }

  /**
   * Get remaining attempts
   */
  static getRemainingAttempts(identifier: string): number {
    const data = this.getData(identifier);
    if (!data) return MAX_ATTEMPTS;

    const now = Date.now();
    if (data.resetAt < now) {
      return MAX_ATTEMPTS;
    }

    return Math.max(0, MAX_ATTEMPTS - data.attempts);
  }

  /**
   * Format remaining time as human-readable string
   */
  static formatRemainingTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes} menit ${secs} detik`;
    }
    return `${secs} detik`;
  }
}
