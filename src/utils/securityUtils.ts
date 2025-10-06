/**
 * Security Utilities
 * Input sanitization, validation, and security helpers
 */

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';
  
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate file name (prevent path traversal)
 */
export function isValidFileName(fileName: string): boolean {
  // Check for path traversal attempts
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return false;
  }
  
  // Check for valid characters
  const validFileNameRegex = /^[a-zA-Z0-9._\-\s()]+$/;
  return validFileNameRegex.test(fileName);
}

/**
 * Validate URL
 */
export function isValidURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Rate limiting helper (client-side)
 * Prevents abuse by limiting action frequency
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Check if action is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add new attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }

  /**
   * Reset attempts for a key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clear all attempts
   */
  clearAll(): void {
    this.attempts.clear();
  }
}

/**
 * Secure random string generator
 */
export function generateSecureId(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('Password should be at least 8 characters');

  if (password.length >= 12) score++;

  if (/[a-z]/.test(password)) score++;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Add uppercase letters');

  if (/\d/.test(password)) score++;
  else feedback.push('Add numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else feedback.push('Add special characters');

  return { score, feedback };
}

/**
 * Escape special characters for use in RegExp
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if string contains potential SQL injection
 */
export function containsSQLInjection(input: string): boolean {
  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE',
    'ALTER', 'EXEC', 'EXECUTE', 'UNION', 'DECLARE', '--', ';--'
  ];
  
  const upperInput = input.toUpperCase();
  return sqlKeywords.some(keyword => upperInput.includes(keyword));
}

/**
 * Validate file type based on extension and MIME type
 */
export function isValidFileType(
  fileName: string,
  mimeType: string,
  allowedTypes: string[]
): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (!extension) return false;
  
  // Check if extension is in allowed types
  const isExtensionAllowed = allowedTypes.some(type => 
    type.toLowerCase().includes(extension)
  );
  
  // Check if MIME type matches
  const isMimeTypeAllowed = allowedTypes.some(type => 
    mimeType.toLowerCase().includes(type.toLowerCase())
  );
  
  return isExtensionAllowed && isMimeTypeAllowed;
}

/**
 * Content Security Policy helpers
 */
export const CSP_DIRECTIVES = {
  DEFAULT_SRC: ["'self'"],
  SCRIPT_SRC: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdnjs.cloudflare.com'],
  STYLE_SRC: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  FONT_SRC: ["'self'", 'https://fonts.gstatic.com'],
  IMG_SRC: ["'self'", 'data:', 'blob:', 'https:'],
  CONNECT_SRC: ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'],
};

/**
 * Cookie security settings
 */
export const SECURE_COOKIE_OPTIONS = {
  secure: true, // HTTPS only
  httpOnly: true, // Not accessible via JavaScript
  sameSite: 'strict' as const, // CSRF protection
  path: '/',
  maxAge: 3600 * 24 * 7, // 7 days
};

/**
 * Headers for security
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

