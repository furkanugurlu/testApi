# GoZoom - Social Media Platform

A modern social media platform built with Node.js, Express, TypeScript, and Supabase.

## Features

- 🔐 **User Authentication**: Register and login with email/password
- 👥 **User Management**: View all users and their profiles
- 📝 **Posts System**: Create, read, update, and delete posts
- 🎵 **Media Upload**: Upload and manage images and audio files
- 🌐 **Web Interface**: Beautiful, responsive web UI
- 🔒 **Security**: JWT-based authentication with Supabase

## Setup

### 1. Database Setup

First, run the SQL script in your Supabase project:

```bash
# Copy the contents of setup.sql and run in Supabase SQL Editor
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=3000
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/:id/stats` - Get user statistics
- `PUT /api/users/profile` - Update user profile (protected)

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get post by ID
- `GET /api/posts/user/:userId` - Get posts by user
- `POST /api/posts` - Create new post (protected)
- `PUT /api/posts/:id` - Update post (protected)
- `DELETE /api/posts/:id` - Delete post (protected)

### Media
- `GET /media` - Get user's media files
- `POST /upload` - Upload media file
- `GET /media/:id/download` - Download media file
- `DELETE /media/:id` - Delete media file

## Web Interface

Visit `http://localhost:3000` to access the web interface.

### Features:
- **Login/Register**: Create account or sign in
- **Posts Feed**: View all posts from all users
- **User Discovery**: Browse all registered users
- **Media Management**: Upload and manage your media files
- **Profile Management**: Update your profile information

## Authentication

The API uses JWT tokens from Supabase for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (Text, Unique)
- `username` (Text, Unique)
- `full_name` (Text)
- `avatar_url` (Text)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Posts Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `title` (Text)
- `content` (Text)
- `media_id` (UUID, Foreign Key, Optional)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Media Table
- `id` (UUID, Primary Key)
- `user_id` (UUID)
- `bucket` (Text: 'images' or 'audio')
- `path` (Text, Unique)
- `mime` (Text)
- `size_bytes` (BigInt)
- `kind` (Text: 'image' or 'audio')
- `duration_sec` (Numeric, Optional)
- `width` (Integer, Optional)
- `height` (Integer, Optional)
- `created_at` (Timestamp)

## Development

### Project Structure
```
src/
├── app.ts                 # Main Express app
├── server.ts             # Server entry point
├── config/
│   └── env.ts           # Environment configuration
├── lib/
│   └── supabase.ts      # Supabase client
├── middlewares/
│   ├── auth.ts          # Authentication middleware
│   └── error.ts         # Error handling middleware
├── modules/
│   ├── auth/            # Authentication module
│   ├── users/           # Users management
│   ├── posts/           # Posts management
│   ├── media/           # Media management
│   └── health/          # Health check
└── utils/               # Utility functions
```

### Adding New Features

1. Create a new module in `src/modules/`
2. Add routes to `src/app.ts`
3. Update the web interface in `public/index.html`

## Security

- Row Level Security (RLS) enabled on all tables
- JWT token validation
- CORS enabled
- Helmet security headers
- Input validation and sanitization

## License

MIT License# testApi
