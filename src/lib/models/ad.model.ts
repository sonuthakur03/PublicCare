import { Ad, AdPlacement } from '@/types';
import { prisma } from '../prisma';

export const AdModel = {
  toType(record: any): Ad {
    return {
      id: record.id,
      vendorId: record.vendorId,
      title: record.title,
      description: record.description,
      imageUrl: record.imageUrl || undefined,
      linkUrl: record.linkUrl || undefined,
      placement: record.placement as AdPlacement,
      isActive: record.isActive,
      isApproved: record.isApproved,
      impressions: record.impressions,
      clicks: record.clicks,
      startDate: typeof record.startDate === 'string' ? record.startDate : record.startDate.toISOString(),
      endDate: record.endDate ? (typeof record.endDate === 'string' ? record.endDate : record.endDate.toISOString()) : undefined,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : record.createdAt.toISOString(),
      vendor: record.vendor ? {
        id: record.vendor.id,
        companyName: record.vendor.companyName,
        logoUrl: record.vendor.logoUrl || undefined,
        businessType: record.vendor.businessType
      } : undefined,
    };
  },

  async getAll(filters?: { vendorId?: string; placement?: string; isActive?: boolean; isApproved?: boolean }): Promise<Ad[]> {
    const where: any = {};
    if (filters?.vendorId) where.vendorId = filters.vendorId;
    if (filters?.placement) where.placement = filters.placement;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.isApproved !== undefined) where.isApproved = filters.isApproved;

    const list = await prisma.ad.findMany({
      where,
      include: {
        vendor: { select: { id: true, companyName: true, logoUrl: true, businessType: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return list.map((a: any) => this.toType(a));
  },

  async getActive(placement?: AdPlacement): Promise<Ad[]> {
    const where: any = { isActive: true, isApproved: true };
    if (placement) where.placement = placement;
    
    // Also check endDate if applicable
    where.OR = [
      { endDate: null },
      { endDate: { gt: new Date() } }
    ];

    const list = await prisma.ad.findMany({
      where,
      include: {
        vendor: { select: { id: true, companyName: true, logoUrl: true, businessType: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return list.map((a: any) => this.toType(a));
  },

  async getById(id: string): Promise<Ad | null> {
    const found = await prisma.ad.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, companyName: true, logoUrl: true, businessType: true } }
      }
    });
    if (!found) return null;
    return this.toType(found);
  },

  async getByVendorId(vendorId: string): Promise<Ad[]> {
    return this.getAll({ vendorId });
  },

  async create(vendorId: string, data: {
    title: string;
    description: string;
    imageUrl?: string;
    linkUrl?: string;
    placement: string;
    startDate: Date | string;
    endDate?: Date | string;
  }): Promise<Ad> {
    const created = await prisma.ad.create({
      data: {
        vendorId,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        placement: data.placement,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      }
    });
    return this.toType(created);
  },

  async update(id: string, data: Partial<Ad>): Promise<Ad> {
    const validData: any = {};
    if (data.title !== undefined) validData.title = data.title;
    if (data.description !== undefined) validData.description = data.description;
    if (data.imageUrl !== undefined) validData.imageUrl = data.imageUrl;
    if (data.linkUrl !== undefined) validData.linkUrl = data.linkUrl;
    if (data.placement !== undefined) validData.placement = data.placement;
    if (data.isActive !== undefined) validData.isActive = data.isActive;
    if (data.isApproved !== undefined) validData.isApproved = data.isApproved;
    if (data.clicks !== undefined) validData.clicks = data.clicks;
    if (data.impressions !== undefined) validData.impressions = data.impressions;
    if (data.startDate !== undefined) validData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) validData.endDate = data.endDate ? new Date(data.endDate) : null;

    const updated = await prisma.ad.update({
      where: { id },
      data: validData
    });
    return this.toType(updated);
  },

  async trackImpression(id: string): Promise<void> {
    await prisma.ad.update({
      where: { id },
      data: { impressions: { increment: 1 } }
    });
  },

  async trackClick(id: string): Promise<void> {
    await prisma.ad.update({
      where: { id },
      data: { clicks: { increment: 1 } }
    });
  },

  async approve(id: string): Promise<Ad> {
    const updated = await prisma.ad.update({
      where: { id },
      data: { isApproved: true }
    });
    return this.toType(updated);
  },

  async deactivate(id: string): Promise<Ad> {
    const updated = await prisma.ad.update({
      where: { id },
      data: { isActive: false }
    });
    return this.toType(updated);
  },

  async delete(id: string): Promise<void> {
    await prisma.ad.delete({
      where: { id }
    });
  }
};
