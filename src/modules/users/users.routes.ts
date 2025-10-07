import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticateToken } from '../../middlewares/auth';

const router = Router();
const usersController = new UsersController();

// Public routes
router.get('/', usersController.getAllUsers.bind(usersController));
router.get('/:id', usersController.getUserById.bind(usersController));
router.get('/:id/stats', usersController.getUserStats.bind(usersController));

// Protected routes
router.put('/profile', authenticateToken, usersController.updateProfile.bind(usersController));

export default router;
