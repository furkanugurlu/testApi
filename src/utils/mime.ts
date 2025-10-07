import { env } from '../config/env';

export type MediaKind = 'image' | 'audio';
export type StorageBucket = 'images' | 'audio';

const mimeExtMap: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'audio/m4a': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
};

/**
 * Check if MIME type is allowed for given kind
 */
export function isAllowedMime(mime: string, kind: MediaKind): boolean {
  const allowed = kind === 'image' ? env.ALLOWED_IMAGE_MIME : env.ALLOWED_AUDIO_MIME;
  
  // Exact match or wildcard match (e.g., audio/x-m4a matches audio/m4a list)
  return allowed.some(allowedMime => {
    if (mime === allowedMime) return true;
    // Handle variations like audio/x-m4a
    if (kind === 'audio' && mime.startsWith('audio/')) return true;
    return false;
  });
}

/**
 * Convert MIME type to file extension
 */
export function mimeToExt(mime: string): string {
  const ext = mimeExtMap[mime.toLowerCase()];
  if (!ext) {
    throw new Error(`Unsupported MIME type: ${mime}`);
  }
  return ext;
}

/**
 * Determine kind and bucket from MIME type
 */
export function mimeToKindBucket(mime: string): { kind: MediaKind; bucket: StorageBucket } {
  if (mime.startsWith('image/')) {
    return { kind: 'image', bucket: 'images' };
  }
  if (mime.startsWith('audio/')) {
    return { kind: 'audio', bucket: 'audio' };
  }
  throw new Error(`Cannot determine kind/bucket for MIME: ${mime}`);
}

/**
 * Get MIME type from filename
 */
export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const extMimeMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'm4a': 'audio/m4a',
    'aac': 'audio/aac',
    'ogg': 'audio/ogg',
  };
  
  if (!ext || !extMimeMap[ext]) {
    throw new Error(`Unsupported file extension: ${ext}`);
  }
  
  return extMimeMap[ext];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) {
    throw new Error(`No file extension found in: ${filename}`);
  }
  return ext;
}

