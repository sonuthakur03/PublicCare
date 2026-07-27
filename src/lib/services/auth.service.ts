import { User, UserRole } from '@/types';
import { UserModel } from '../models/user.model';
import { generateAccessToken, generateRefreshToken } from '../jwt';

export const AuthService = {
  async login(email: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const found = await UserModel.findByEmail(email);
    if (!found || found.passwordHash !== password) {
      throw new Error('Invalid email or password credentials.');
    }

    const { passwordHash, ...safeUser } = found;

    return {
      user: safeUser,
      accessToken: generateAccessToken(safeUser),
      refreshToken: generateRefreshToken(safeUser)
    };
  },

  async registerCitizen(data: { name: string; email: string; password: string }): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const existing = await UserModel.findByEmail(data.email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const user = await UserModel.createCitizen({
      name: data.name,
      email: data.email,
      passwordHash: data.password
    });

    return {
      user,
      accessToken: generateAccessToken(user),
      refreshToken: generateRefreshToken(user)
    };
  },

  async registerNgo(data: { name: string; email: string; password: string; organizationName: string; registrationNumber?: string }): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const existing = await UserModel.findByEmail(data.email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const user = await UserModel.createNgoUser({
      name: data.name,
      email: data.email,
      passwordHash: data.password,
      organizationName: data.organizationName,
      registrationNumber: data.registrationNumber
    });

    return {
      user,
      accessToken: generateAccessToken(user),
      refreshToken: generateRefreshToken(user)
    };
  },

  async createAdminUser(creatorRole: UserRole, data: { name: string; email: string; password: string }): Promise<User> {
    const existing = await UserModel.findByEmail(data.email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    return await UserModel.createAdminUser(creatorRole, {
      name: data.name,
      email: data.email,
      passwordHash: data.password
    });
  }
};
