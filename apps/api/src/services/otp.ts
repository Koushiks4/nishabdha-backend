import { randomInt, createHash } from 'crypto';
import { redis } from '../utils/redis';
import { sendSMS } from '../integrations/msg91';
import { logger } from '../utils/logger';

const OTP_EXPIRY = 10 * 60; // 10 minutes in seconds
const MAX_ATTEMPTS = 3;

interface OTPSession {
  otp: string;
  attempts: number;
  createdAt: number;
}

function generateOTP(): string {
  return randomInt(100000, 1000000).toString();
}

function hashOTP(otp: string): string {
  return createHash('sha256').update(otp).digest('hex');
}

function getOTPKey(phone: string): string {
  return `otp:${phone}`;
}

export async function sendOTP(phone: string): Promise<void> {
  const otp = generateOTP();
  const key = getOTPKey(phone);

  const session: OTPSession = {
    otp: hashOTP(otp),
    attempts: 0,
    createdAt: Date.now(),
  };

  // Store in Redis with TTL
  await redis.setex(key, OTP_EXPIRY, JSON.stringify(session));

  try {
    // Send via MSG91
    await sendSMS(phone, `Your Nishabdha verification code is: ${otp}. Valid for 10 minutes.`);
    logger.info(`OTP sent to ${phone}`);
  } catch (error) {
    await redis.del(key); // Clean up on SMS failure
    throw error;
  }
}

export async function verifyOTP(phone: string, inputOTP: string): Promise<boolean> {
  const key = getOTPKey(phone);
  const hashedInput = hashOTP(inputOTP);

  const luaScript = `
    local data = redis.call('GET', KEYS[1])
    if not data then return 'NOT_FOUND' end

    local session = cjson.decode(data)

    if session.attempts >= tonumber(ARGV[1]) then
      redis.call('DEL', KEYS[1])
      return 'MAX_ATTEMPTS'
    end

    session.attempts = session.attempts + 1
    local ttl = redis.call('TTL', KEYS[1])
    if ttl > 0 then
      redis.call('SETEX', KEYS[1], ttl, cjson.encode(session))
    end

    if session.otp == ARGV[2] then
      redis.call('DEL', KEYS[1])
      return 'MATCH'
    end

    return 'NO_MATCH'
  `;

  const result = await redis.eval(
    luaScript,
    1,
    key,
    MAX_ATTEMPTS.toString(),
    hashedInput
  ) as string;

  if (result === 'NOT_FOUND') {
    throw new Error('OTP expired or not found');
  }

  if (result === 'MAX_ATTEMPTS') {
    throw new Error('Maximum OTP attempts exceeded');
  }

  if (result === 'MATCH') {
    logger.info(`OTP verified for ${phone}`);
    return true;
  }

  logger.warn(`Invalid OTP attempt for ${phone}`);
  return false;
}

export async function revokeOTP(phone: string): Promise<void> {
  const key = getOTPKey(phone);
  await redis.del(key);
  logger.info(`OTP revoked for ${phone}`);
}
