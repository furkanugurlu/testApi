import { Router } from 'express';
import { PostsController } from './posts.controller';
import { authenticateToken } from '../../middlewares/auth';
import multer from 'multer';

const router = Router();
const postsController = new PostsController();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and audio files
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and audio files are allowed'));
    }
  }
});

// Public routes
router.get('/', postsController.getAllPosts.bind(postsController));
router.get('/:id', postsController.getPostById.bind(postsController));
router.get('/user/:userId', postsController.getUserPosts.bind(postsController));

// Protected routes
router.post('/', authenticateToken, upload.single('media'), postsController.createPost.bind(postsController));
router.put('/:id', authenticateToken, postsController.updatePost.bind(postsController));
router.delete('/:id', authenticateToken, postsController.deletePost.bind(postsController));

export default router;
