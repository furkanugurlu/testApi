import { randomUUID } from 'crypto';

/**
 * Build storage path: userId/yyyy/MM/dd/uuid.ext
 */
export function buildStoragePath(userId: string, ext: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const uuid = randomUUID();
  
  return `${userId}/${year}/${month}/${day}/${uuid}.${ext}`;
}

/**
 * Generate unique path for media file
 */
export function generateUniquePath(userId: string, ext: string): string {
  return buildStoragePath(userId, ext);
}

