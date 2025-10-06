import { supabase } from '../lib/supabase';

export const ALLOWED_FILE_TYPES = [
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
];

export const DANGEROUS_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
  'msi', 'dll', 'sys', 'drv', 'app', 'deb', 'rpm', 'sh', 'ps1'
];

export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  message?: string;
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^\w\s\.\-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 255);
}

export function sanitizeTextInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .substring(0, 1000);
}

export function validateFileSize(fileSize: number): FileValidationResult {
  if (fileSize <= 0) {
    return {
      valid: false,
      error: 'invalid_size',
      message: 'File size must be greater than 0',
    };
  }

  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'file_too_large',
      message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024} MB`,
    };
  }

  return { valid: true };
}

export function validateFileType(fileType: string): FileValidationResult {
  if (!fileType || fileType.trim() === '') {
    return {
      valid: false,
      error: 'missing_type',
      message: 'File type is required',
    };
  }

  if (!ALLOWED_FILE_TYPES.includes(fileType)) {
    return {
      valid: false,
      error: 'invalid_type',
      message: 'File type not allowed',
    };
  }

  return { valid: true };
}

export function validateFileExtension(fileName: string): FileValidationResult {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (!extension) {
    return {
      valid: false,
      error: 'missing_extension',
      message: 'File must have an extension',
    };
  }

  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: 'dangerous_extension',
      message: 'File extension not allowed for security reasons',
    };
  }

  return { valid: true };
}

export function validateFile(file: File): FileValidationResult {
  const sizeValidation = validateFileSize(file.size);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  const typeValidation = validateFileType(file.type);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  const extensionValidation = validateFileExtension(file.name);
  if (!extensionValidation.valid) {
    return extensionValidation;
  }

  return { valid: true };
}

export async function validateFileMetadataOnServer(
  fileSize: number,
  fileType: string,
  fileName: string
): Promise<FileValidationResult> {
  try {
    const { data, error } = await supabase.rpc('validate_file_metadata', {
      p_file_size: fileSize,
      p_file_type: fileType,
      p_file_name: fileName,
    });

    if (error) {
      console.error('Server validation error:', error);
      return {
        valid: false,
        error: 'server_error',
        message: 'Server validation failed',
      };
    }

    return data as FileValidationResult;
  } catch (error) {
    console.error('Error validating file metadata:', error);
    return {
      valid: false,
      error: 'validation_error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function detectSuspiciousContent(content: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\s*\(/i,
    /document\.cookie/i,
    /window\.location/i,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(content));
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function hashSharePassword(password: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('hash_share_password', {
      p_password: password,
    });

    if (error) {
      console.error('Error hashing password:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error hashing password:', error);
    return null;
  }
}

export async function verifySharePassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('verify_share_password', {
      p_password: password,
      p_hash: hash,
    });

    if (error) {
      console.error('Error verifying password:', error);
      return false;
    }

    return data;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}
