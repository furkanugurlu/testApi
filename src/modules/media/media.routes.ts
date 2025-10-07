import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../../middlewares/auth';
import * as controller from './media.controller';
import { env } from '../../config/env';

const router = Router();

// Configure multer with memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Math.max(env.MAX_IMAGE_MB, env.MAX_AUDIO_MB) * 1024 * 1024
  }
});

// Backend-proxy upload
router.post('/upload', authMiddleware, upload.single('file'), controller.postUpload);

// Pre-signed upload flow
router.post('/media/signed-upload', authMiddleware, controller.postSignedUpload);
router.post('/media/commit', authMiddleware, controller.postCommit);

// Get signed download URL
router.get('/media/:id/url', authMiddleware, controller.getSignedUrl);

// Download media file
router.get('/media/:id/download', controller.downloadMedia);

// List media
router.get('/media', authMiddleware, controller.listMedia);

// Public: list all media (for demo)
router.get('/media/all', controller.listAllMedia);

// Delete media
router.delete('/media/:id', authMiddleware, controller.deleteMedia);

export default router;

