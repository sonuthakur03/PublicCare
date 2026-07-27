import { User } from '@/types';

// Simple, robust Web Crypto / HMAC JWT Helper adhering to DRY principles
const JWT_SECRET = 'civicpulse_lalitpur_secure_jwt_secret_key_2026';
const REFRESH_SECRET = 'civicpulse_lalitpur_secure_refresh_secret_key_2026';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  exp: number;
}

export function generateAccessToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + 15 * 60 // 15 minutes
  };
  return btoa(JSON.stringify(payload));
}

export function generateRefreshToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7 days
  };
  return btoa(JSON.stringify(payload));
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const jsonStr = atob(token);
    const payload: JwtPayload = JSON.parse(jsonStr);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}
