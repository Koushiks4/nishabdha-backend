import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  // Existing from Phase 1-2
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32).refine(
    (val) => process.env.NODE_ENV === 'production'
      ? val !== 'your-secret-key-change-in-production'
      : true,
    { message: 'JWT_SECRET must be changed in production' }
  ),
  JWT_EXPIRES_IN: z.string().default('30d'),
  ALLOWED_ORIGINS: z.string().transform(val => val.split(',')),

  // Phase 3: Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().transform(val => val || undefined),

  // Phase 3: MSG91
  MSG91_AUTH_KEY: z.string(),
  MSG91_SENDER_ID: z.string(),
  MSG91_TEMPLATE_ID: z.string(),

  // Phase 3: Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string(),
  ADMIN_URL: z.string().url().default('http://localhost:3002'),

  // Cashfree Payment Gateway (optional for development)
  CASHFREE_APP_ID: z.string().default('test_app_id'),
  CASHFREE_SECRET_KEY: z.string().default('test_secret_key'),
  CASHFREE_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  CASHFREE_WEBHOOK_SECRET: z.string().default('test_webhook_secret'),

  // Frontend URL for payment redirects
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:3001'),
});

const parseConfig = () => {
  try {
    const env = configSchema.parse(process.env);

    return {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      databaseUrl: env.DATABASE_URL,
      jwt: {
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN,
      },
      allowedOrigins: env.ALLOWED_ORIGINS,
      redis: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
      },
      msg91: {
        authKey: env.MSG91_AUTH_KEY,
        senderId: env.MSG91_SENDER_ID,
        templateId: env.MSG91_TEMPLATE_ID,
      },
      supabase: {
        url: env.SUPABASE_URL,
        serviceKey: env.SUPABASE_SERVICE_KEY,
      },
      adminUrl: env.ADMIN_URL,
      cashfree: {
        appId: env.CASHFREE_APP_ID,
        secretKey: env.CASHFREE_SECRET_KEY,
        environment: env.CASHFREE_ENVIRONMENT,
        webhookSecret: env.CASHFREE_WEBHOOK_SECRET,
      },
      frontendUrl: env.FRONTEND_URL,
      apiUrl: env.API_URL,
    };
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
};

export const config = parseConfig();
