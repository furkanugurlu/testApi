import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import hpp from 'hpp';
import path from 'path';
import healthRoutes from './modules/health/health.routes';
import mediaRoutes from './modules/media/media.routes';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import postsRoutes from './modules/posts/posts.routes';
import { errorMiddleware } from './middlewares/error';

const app = express();

// Security & optimization middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for test page
}));
app.use(cors());
app.use(compression());
app.use(hpp());

// Serve static files (test web UI)
app.use(express.static(path.join(__dirname, '../public')));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/', mediaRoutes);

// Error handling (must be last)
app.use(errorMiddleware);

export default app;

