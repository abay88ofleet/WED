export interface SecurityConfig {
  maxFileSize: number;
  allowedFileTypes: string[];
  dangerousExtensions: string[];
  rateLimits: {
    uploads: { max: number; window: string };
    downloads: { max: number; window: string };
    shares: { max: number; window: string };
  };
  sessionTimeout: number;
  passwordRequirements: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  csp: {
    enabled: boolean;
    directives: Record<string, string[]>;
  };
}

export const SECURITY_CONFIG: SecurityConfig = {
  maxFileSize: 500 * 1024 * 1024, // 500MB

  allowedFileTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/tiff',
    'text/plain',
    'text/csv',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
  ],

  dangerousExtensions: [
    'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
    'msi', 'dll', 'sys', 'drv', 'app', 'deb', 'rpm', 'sh', 'ps1',
  ],

  rateLimits: {
    uploads: { max: 50, window: '1h' },
    downloads: { max: 100, window: '1h' },
    shares: { max: 30, window: '1h' },
  },

  sessionTimeout: 60 * 60 * 1000, // 1 hour in milliseconds

  passwordRequirements: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },

  csp: {
    enabled: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdnjs.cloudflare.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      'media-src': ["'self'", 'blob:'],
      'connect-src': ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co', 'https://api.ipify.org'],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': [],
    },
  },
};

export function getSecurityConfig(): SecurityConfig {
  return SECURITY_CONFIG;
}

export function generateCSPHeader(): string {
  const { directives } = SECURITY_CONFIG.csp;

  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key;
      }
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

export function isFileTypeAllowed(fileType: string): boolean {
  return SECURITY_CONFIG.allowedFileTypes.includes(fileType);
}

export function isExtensionDangerous(extension: string): boolean {
  return SECURITY_CONFIG.dangerousExtensions.includes(extension.toLowerCase());
}

export function isFileSizeValid(fileSize: number): boolean {
  return fileSize > 0 && fileSize <= SECURITY_CONFIG.maxFileSize;
}

export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('password') || message.includes('token')) {
      return 'Authentication error occurred';
    }

    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'You do not have permission to perform this action';
    }

    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error occurred. Please check your connection';
    }

    return 'An error occurred. Please try again';
  }

  return 'An unexpected error occurred';
}

export function maskSensitiveData(data: string, visibleChars = 4): string {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }

  const masked = '*'.repeat(data.length - visibleChars);
  const visible = data.slice(-visibleChars);

  return `${masked}${visible}`;
}

export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export class SessionManager {
  private sessionId: string;
  private lastActivity: number;

  constructor() {
    this.sessionId = this.loadOrCreateSession();
    this.lastActivity = Date.now();
    this.setupActivityTracking();
  }

  private loadOrCreateSession(): string {
    const stored = sessionStorage.getItem('session_id');
    if (stored) {
      return stored;
    }

    const newSessionId = generateSessionId();
    sessionStorage.setItem('session_id', newSessionId);
    return newSessionId;
  }

  private setupActivityTracking(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    events.forEach(event => {
      document.addEventListener(event, () => {
        this.updateActivity();
      }, { passive: true });
    });

    setInterval(() => {
      this.checkTimeout();
    }, 60000); // Check every minute
  }

  private updateActivity(): void {
    this.lastActivity = Date.now();
  }

  private checkTimeout(): void {
    const timeSinceActivity = Date.now() - this.lastActivity;

    if (timeSinceActivity > SECURITY_CONFIG.sessionTimeout) {
      this.handleTimeout();
    }
  }

  private handleTimeout(): void {
    sessionStorage.removeItem('session_id');
    window.location.href = '/auth?reason=timeout';
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public renewSession(): void {
    this.sessionId = generateSessionId();
    sessionStorage.setItem('session_id', this.sessionId);
    this.lastActivity = Date.now();
  }

  public endSession(): void {
    sessionStorage.removeItem('session_id');
  }
}

export const sessionManager = new SessionManager();
