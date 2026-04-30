import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface CustomerTokenPayload {
  customerId: string;
  phone: string;
  type: 'customer';
}

export interface AdminTokenPayload {
  adminId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'CONTENT_MANAGER' | 'ORDER_MANAGER' | 'STUDIO_MANAGER';
  type: 'admin';
}

type TokenPayload = CustomerTokenPayload | AdminTokenPayload;

export function signToken(payload: TokenPayload, expiresIn: string = config.jwt.expiresIn): string {
  return jwt.sign(payload, config.jwt.secret, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

export function decodeToken(token: string): TokenPayload | null {
  return jwt.decode(token) as TokenPayload | null;
}
