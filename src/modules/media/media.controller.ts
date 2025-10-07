import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as service from './media.service';

/**
 * POST /upload - Backend proxy upload
 */
export async function postUpload(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file provided' } });
    }

    const userId = req.user!.id;
    const file = req.file;
    const mime = file.mimetype;

    // Prepare and validate
    const { kind, bucket, path } = service.prepareUpload(userId, mime);
    service.validateFileSize(file.size, kind);

    // Upload to storage
    await service.uploadToStorage(bucket, path, file.buffer, mime);

    // Insert metadata
    const media = await service.insertMediaRecord({
      user_id: userId,
      bucket,
      path,
      mime,
      size_bytes: file.size,
      kind
    });

    // Generate preview URL (10 min expiry)
    const previewUrl = await service.createSignedUrl(bucket, path, 600);

    res.status(201).json({
      media,
      previewUrl
    });
  } catch (error: any) {
    res.status(400).json({ error: { message: error.message } });
  }
}

/**
 * POST /media/signed-upload - Create pre-signed upload URL
 */
export async function postSignedUpload(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    const { mime } = req.body;
    
    if (!mime || typeof mime !== 'string') {
      return res.status(400).json({ error: { message: 'Missing or invalid mime type' } });
    }

    const userId = req.user!.id;
    const { kind, bucket, path } = service.prepareUpload(userId, mime);

    // Create signed upload URL
    const { uploadUrl, token } = await service.createSignedUploadUrl(bucket, path);

    res.json({
      bucket,
      path,
      uploadUrl,
      token
    });
  } catch (error: any) {
    res.status(400).json({ error: { message: error.message } });
  }
}

/**
 * POST /media/commit - Commit metadata after pre-signed upload
 */
export async function postCommit(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    const { bucket, path, mime, size_bytes, kind, width, height, duration_sec } = req.body;

    // Validate required fields
    if (!bucket || !path || !mime || !size_bytes || !kind) {
      return res.status(400).json({ 
        error: { message: 'Missing required fields: bucket, path, mime, size_bytes, kind' } 
      });
    }

    // Validate bucket value
    if (bucket !== 'images' && bucket !== 'audio') {
      return res.status(400).json({ error: { message: 'Invalid bucket' } });
    }

    // Validate kind value
    if (kind !== 'image' && kind !== 'audio') {
      return res.status(400).json({ error: { message: 'Invalid kind' } });
    }

    const userId = req.user!.id;

    // Insert metadata
    const media = await service.insertMediaRecord({
      user_id: userId,
      bucket,
      path,
      mime,
      size_bytes: parseInt(size_bytes, 10),
      kind,
      width: width ? parseInt(width, 10) : undefined,
      height: height ? parseInt(height, 10) : undefined,
      duration_sec: duration_sec ? parseFloat(duration_sec) : undefined
    });

    res.status(201).json({ media });
  } catch (error: any) {
    res.status(400).json({ error: { message: error.message } });
  }
}

/**
 * GET /media/:id/url - Get signed download URL
 */
export async function getSignedUrl(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const media = await service.getMediaRecord(id, userId);
    
    if (!media) {
      return res.status(404).json({ error: { message: 'Media not found' } });
    }

    // Create signed URL (10 min expiry)
    const url = await service.createSignedUrl(
      media.bucket as service.StorageBucket,
      media.path,
      600
    );

    res.json({ url });
  } catch (error: any) {
    res.status(400).json({ error: { message: error.message } });
  }
}

/**
 * DELETE /media/:id - Delete media
 */
export async function deleteMedia(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const media = await service.getMediaRecord(id, userId);
    
    if (!media) {
      return res.status(404).json({ error: { message: 'Media not found' } });
    }

    // Remove from storage
    await service.removeFromStorage(
      media.bucket as service.StorageBucket,
      media.path
    );

    // Remove from database
    await service.deleteMediaRecord(id, userId);

    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: { message: error.message } });
  }
}

/**
 * GET /media - List media with signed URLs
 */
export async function listMedia(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const items = await service.listMediaRecords(userId);

    // Attach signed URL for each item
    const withUrls = await Promise.all(items.map(async (m) => {
      const url = await service.createSignedUrl(m.bucket as service.StorageBucket, m.path, 600);
      return { ...m, url };
    }));

    res.json({ items: withUrls });
  } catch (error: any) {
    res.status(400).json({ error: { message: error.message } });
  }
}

/**
 * GET /media/all - List all media with signed URLs (no auth)
 */
export async function listAllMedia(_req: any, res: Response) {
  try {
    const items = await service.listAllMediaRecords();

    const withUrls = await Promise.all(items.map(async (m) => {
      const url = await service.createSignedUrl(m.bucket as service.StorageBucket, m.path, 600);
      return { ...m, url };
    }));

    res.json({ items: withUrls });
  } catch (error: any) {
    res.status(400).json({ error: { message: error.message } });
  }
}

/**
 * GET /media/:id/download - Download media file
 */
export async function downloadMedia(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
      return res.status(400).json({ error: { message: 'Media ID is required' } });
    }

    // Get media record
    const media = await service.getMediaById(id);
    if (!media) {
      return res.status(404).json({ error: { message: 'Media not found' } });
    }

    // Check if user has access (either owner or public access)
    if (userId && media.user_id !== userId) {
      // For now, allow public access to all media
      // In the future, you might want to add privacy settings
    }

    // Create signed URL for download
    const downloadUrl = await service.createSignedUrl(
      media.bucket as service.StorageBucket, 
      media.path, 
      3600 // 1 hour expiry
    );

    // Redirect to the signed URL
    res.redirect(downloadUrl);
  } catch (error: any) {
    console.error('Download media error:', error);
    res.status(500).json({ error: { message: 'Failed to download media' } });
  }
}

