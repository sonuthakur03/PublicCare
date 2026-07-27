import { User, UserRole } from '@/types';
import { prisma } from '../prisma';

export const UserModel = {
  // Convert DB user record to User type from @/types
  toType(record: any): User {
    return {
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role as UserRole,
      organizationName: record.organizationName || undefined,
      registrationNumber: record.registrationNumber || undefined,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : record.createdAt.toISOString()
    };
  },

  async findByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    try {
      const found = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
      if (!found) return null;
      return {
        ...this.toType(found),
        passwordHash: found.passwordHash
      };
    } catch (err) {
      console.warn('Prisma findByEmail fallback:', err);
      return null;
    }
  },

  async findById(id: string): Promise<User | null> {
    try {
      const found = await prisma.user.findUnique({
        where: { id }
      });
      if (!found) return null;
      return this.toType(found);
    } catch (err) {
      return null;
    }
  },

  async createCitizen(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    try {
      const created = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash: data.passwordHash,
          role: 'user'
        }
      });
      return this.toType(created);
    } catch (err) {
      throw err;
    }
  },

  async createNgoUser(data: { name: string; email: string; passwordHash: string; organizationName: string; registrationNumber?: string }): Promise<User> {
    try {
      const created = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash: data.passwordHash,
          role: 'ngo',
          organizationName: data.organizationName,
          registrationNumber: data.registrationNumber
        }
      });
      return this.toType(created);
    } catch (err) {
      throw err;
    }
  },

  async createAdminUser(creatorRole: UserRole, data: { name: string; email: string; passwordHash: string }): Promise<User> {
    if (creatorRole !== 'municipality_admin') {
      throw new Error('FORBIDDEN: Only an existing Municipality Admin can create admin users.');
    }

    const created = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        role: 'municipality_admin'
      }
    });
    return this.toType(created);
  },

  async getAll(): Promise<User[]> {
    try {
      const list = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return list.map(u => this.toType(u));
    } catch (err) {
      return [];
    }
  }
};
