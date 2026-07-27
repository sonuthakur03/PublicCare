import { NgoApiKey, User } from '@/types';
import { prisma } from '../prisma';

export const NgoModel = {
  toType(record: any): NgoApiKey {
    return {
      id: record.id,
      userId: record.userId,
      orgName: record.orgName,
      apiKey: record.apiKey,
      tier: record.tier as 'COMMUNITY' | 'ENTERPRISE',
      rateLimit: record.rateLimit,
      subscriptionCostNpr: record.subscriptionCostNpr,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : record.createdAt.toISOString(),
      requestCount: record.requestCount
    };
  },

  async getKeys(user: User | null): Promise<NgoApiKey[]> {
    if (!user) return [];
    try {
      const where = user.role === 'municipality_admin' ? {} : { userId: user.id };
      const list = await prisma.ngoApiKey.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
      return list.map(item => this.toType(item));
    } catch (err) {
      return [];
    }
  },

  async generateKey(user: User | null, orgName: string, tier: 'COMMUNITY' | 'ENTERPRISE'): Promise<NgoApiKey> {
    if (!user || (user.role !== 'ngo' && user.role !== 'municipality_admin')) {
      throw new Error('FORBIDDEN: Only registered NGO accounts or Admins can generate NGO API keys.');
    }

    const keyString = `cp_lpt_${orgName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Math.random().toString(36).substring(2, 10)}`;
    const cost = tier === 'ENTERPRISE' ? 5000 : 0;

    const created = await prisma.ngoApiKey.create({
      data: {
        userId: user.id,
        orgName,
        apiKey: keyString,
        tier: tier as any,
        rateLimit: tier === 'ENTERPRISE' ? 50000 : 5000,
        subscriptionCostNpr: cost
      }
    });

    return this.toType(created);
  },

  async validateKey(apiKey: string): Promise<NgoApiKey | null> {
    try {
      const found = await prisma.ngoApiKey.findUnique({
        where: { apiKey }
      });
      if (!found) return null;

      // Increment request count
      const updated = await prisma.ngoApiKey.update({
        where: { id: found.id },
        data: { requestCount: found.requestCount + 1 }
      });

      return this.toType(updated);
    } catch (err) {
      return null;
    }
  }
};
