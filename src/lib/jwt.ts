import { User } from '@/types';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'PublicCare_lalitpur_secure_jwt_secret_key_2026';
const REFRESH_SECRET = 'PublicCare_lalitpur_secure_refresh_secret_key_2026';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  exp?: number;
}

export function generateAccessToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (err) {
    return null;
  }
}
