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

  async registerVendor(data: { name: string; email: string; password: string; companyName: string; businessType: string; description: string; contactPhone?: string; website?: string; locationLat: number; locationLng: number; address: string; serviceRadius?: number }): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const existing = await UserModel.findByEmail(data.email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const user = await UserModel.createVendorUser({
      name: data.name,
      email: data.email,
      passwordHash: data.password,
      organizationName: data.companyName
    });

    const { VendorModel } = await import('../models/vendor.model');
    await VendorModel.create(user.id, {
      companyName: data.companyName,
      businessType: data.businessType,
      description: data.description,
      contactPhone: data.contactPhone,
      website: data.website,
      locationLat: data.locationLat,
      locationLng: data.locationLng,
      address: data.address,
      serviceRadius: data.serviceRadius || 5.0
    });

    return {
      user,
      accessToken: generateAccessToken(user),
      refreshToken: generateRefreshToken(user)
    };
  },

  async createAdminUser(creatorRole: UserRole, data: { name: string; email: string; password: string; role?: UserRole }): Promise<User> {
    const existing = await UserModel.findByEmail(data.email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    return await UserModel.createAdminUser(creatorRole, {
      name: data.name,
      email: data.email,
      passwordHash: data.password,
      role: data.role
    });
  }
};
