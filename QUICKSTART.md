# 🚀 Quick Start Guide

Get your API running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
PORT=8080
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

> **Where to find these:**
> - Go to your Supabase project dashboard
> - Settings → API
> - Copy `URL` and `service_role` key (NOT anon key!)

## Step 3: Setup Supabase

### A) Create Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Click "Create Bucket"
3. Create bucket named `images` - set to **PRIVATE** ✓
4. Create bucket named `audio` - set to **PRIVATE** ✓

### B) Run SQL Setup

1. Go to **SQL Editor** in Supabase Dashboard
2. Open the `setup.sql` file from this project
3. Copy all contents and paste into SQL Editor
4. Click "Run" to execute

## Step 4: Start Development Server

```bash
npm run dev
```

You should see:
```
🚀 Server running on port 8080
📍 Health check: http://localhost:8080/health
```

## Step 5: Test with Web UI

Open your browser and go to:

```
http://localhost:8080
```

You'll see a beautiful upload interface where you can:
- Enter a User ID (or generate a test UUID)
- Select an image or audio file
- Test both upload methods (Proxy & Pre-Signed)
- See upload results in real-time

## Step 6: Test with API (Alternative)

### Test Health Endpoint

```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "ok",
  "time": "2025-01-07T12:00:00.000Z"
}
```

### Test Upload (requires valid user UUID)

```bash
# Replace USER_UUID with a real UUID
curl -X POST http://localhost:8080/upload \
  -H "x-user-id: YOUR_USER_UUID" \
  -F "file=@path/to/image.jpg"
```

## 🎉 Done!

Your API is ready to accept uploads from your React Native app!

---

## Next Steps

1. **Implement Real Auth**: Replace `x-user-id` header with JWT validation
2. **Add Rate Limiting**: Install `express-rate-limit`
3. **Deploy**: Deploy to Railway, Render, or Fly.io
4. **Monitor**: Add logging and error tracking

## Common Issues

### "Missing environment variable"
- Make sure you copied `.env.example` to `.env`
- Check all values are filled in (no `YOUR_*` placeholders)

### "Storage upload failed"
- Verify buckets exist and are named exactly `images` and `audio`
- Make sure buckets are set to **PRIVATE**
- Check your `SUPABASE_SERVICE_ROLE_KEY` is correct

### "Failed to insert media record"
- Make sure you ran the `setup.sql` script
- Verify the `media` table exists in your database
- Check RLS policies are enabled

## 📚 More Help

See `README.md` for:
- Complete API documentation
- React Native client examples
- Security best practices
- Production deployment guide

