import { supabase } from '../../lib/supabase';
import { env } from '../../config/env';
import { isAllowedMime, mimeToExt, mimeToKindBucket, MediaKind, StorageBucket } from '../../utils/mime';
import { buildStoragePath } from '../../utils/path';

// Re-export types for controllers
export type { MediaKind, StorageBucket };

export interface MediaRecord {
  id: string;
  user_id: string;
  bucket: string;
  path: string;
  mime: string;
  size_bytes: number;
  kind: string;
  duration_sec?: number;
  width?: number;
  height?: number;
  created_at: string;
}

/**
 * Validate file size based on kind
 */
export function validateFileSize(sizeBytes: number, kind: MediaKind): void {
  const maxMB = kind === 'image' ? env.MAX_IMAGE_MB : env.MAX_AUDIO_MB;
  const maxBytes = maxMB * 1024 * 1024;
  
  if (sizeBytes > maxBytes) {
    throw new Error(`File size exceeds ${maxMB}MB limit for ${kind}`);
  }
}

/**
 * Validate MIME type
 */
export function validateMime(mime: string, kind: MediaKind): void {
  if (!isAllowedMime(mime, kind)) {
    throw new Error(`MIME type ${mime} not allowed for ${kind}`);
  }
}

/**
 * Upload file buffer to Supabase Storage
 */
export async function uploadToStorage(
  bucket: StorageBucket,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      upsert: false
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }
}

/**
 * Create signed upload URL
 */
export async function createSignedUploadUrl(
  bucket: StorageBucket,
  path: string
): Promise<{ uploadUrl: string; token: string }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(`Failed to create signed upload URL: ${error?.message}`);
  }

  return {
    uploadUrl: data.signedUrl,
    token: data.token
  };
}

/**
 * Create signed download URL
 */
export async function createSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error || !data) {
    throw new Error(`Failed to create signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}

/**
 * Remove file from storage
 */
export async function removeFromStorage(bucket: StorageBucket, path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`Storage deletion failed: ${error.message}`);
  }
}

/**
 * Insert media record to database
 */
export async function insertMediaRecord(record: Omit<MediaRecord, 'id' | 'created_at'>): Promise<MediaRecord> {
  const { data, error } = await supabase
    .from('media')
    .insert(record)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to insert media record: ${error?.message}`);
  }

  return data as MediaRecord;
}

/**
 * Get media record by ID
 */
export async function getMediaRecord(id: string, userId: string): Promise<MediaRecord | null> {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get media record: ${error.message}`);
  }

  return data as MediaRecord;
}

/**
 * List media records for a user
 */
export async function listMediaRecords(userId: string): Promise<MediaRecord[]> {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list media records: ${error.message}`);
  }

  return (data || []) as MediaRecord[];
}

/**
 * List all media records (admin/public listing)
 */
export async function listAllMediaRecords(): Promise<MediaRecord[]> {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list media records: ${error.message}`);
  }

  return (data || []) as MediaRecord[];
}

/**
 * Delete media record from database
 */
export async function deleteMediaRecord(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('media')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete media record: ${error.message}`);
  }
}

/**
 * Prepare upload path and validate
 */
export function prepareUpload(userId: string, mime: string) {
  const { kind, bucket } = mimeToKindBucket(mime);
  validateMime(mime, kind);
  
  const ext = mimeToExt(mime);
  const path = buildStoragePath(userId, ext);
  
  return { kind, bucket, path, ext };
}

/**
 * Get media record by ID
 */
export async function getMediaById(id: string): Promise<MediaRecord | null> {
  try {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Get media by ID error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Get media by ID error:', error);
    return null;
  }
}

