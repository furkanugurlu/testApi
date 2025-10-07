import dotenv from 'dotenv';

dotenv.config();

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

export const env = {
  PORT: getEnvNumber('PORT', 8080),
  SUPABASE_URL: getEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  
  MAX_IMAGE_MB: getEnvNumber('MAX_IMAGE_MB', 10),
  MAX_AUDIO_MB: getEnvNumber('MAX_AUDIO_MB', 50),
  
  ALLOWED_IMAGE_MIME: getEnv('ALLOWED_IMAGE_MIME', 'image/jpeg,image/png,image/webp')
    .split(',')
    .map(m => m.trim()),
  ALLOWED_AUDIO_MIME: getEnv('ALLOWED_AUDIO_MIME', 'audio/m4a,audio/aac,audio/mp3')
    .split(',')
    .map(m => m.trim()),
};

