import { Vendor, VendorBusinessType } from '@/types';
import { prisma } from '../prisma';

export const VendorModel = {
  toType(record: any): Vendor {
    return {
      id: record.id,
      userId: record.userId,
      companyName: record.companyName,
      businessType: record.businessType as VendorBusinessType,
      description: record.description,
      contactPhone: record.contactPhone || undefined,
      website: record.website || undefined,
      logoUrl: record.logoUrl || undefined,
      locationLat: record.locationLat,
      locationLng: record.locationLng,
      address: record.address,
      serviceRadius: record.serviceRadius,
      isApproved: record.isApproved,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : record.createdAt.toISOString(),
      updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : record.updatedAt.toISOString(),
      user: record.user ? {
        id: record.user.id,
        name: record.user.name,
        email: record.user.email
      } : undefined,
      ads: record.ads || [],
      tenders: record.tenders || [],
      _count: record._count || undefined,
      distance: record.distance,
    };
  },

  async getAll(filters?: { businessType?: string; isApproved?: boolean; query?: string }): Promise<Vendor[]> {
    const where: any = {};
    if (filters?.businessType) where.businessType = filters.businessType;
    if (filters?.isApproved !== undefined) where.isApproved = filters.isApproved;
    if (filters?.query) {
      where.OR = [
        { companyName: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
      ];
    }
    
    const list = await prisma.vendor.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { ads: true, tenders: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return list.map((v: any) => this.toType(v));
  },

  async getById(id: string): Promise<Vendor | null> {
    const found = await prisma.vendor.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { ads: true, tenders: true } }
      }
    });
    if (!found) return null;
    return this.toType(found);
  },

  async getByUserId(userId: string): Promise<Vendor | null> {
    const found = await prisma.vendor.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { ads: true, tenders: true } }
      }
    });
    if (!found) return null;
    return this.toType(found);
  },

  async create(userId: string, data: {
    companyName: string;
    businessType: string;
    description: string;
    contactPhone?: string;
    website?: string;
    logoUrl?: string;
    locationLat: number;
    locationLng: number;
    address: string;
    serviceRadius?: number;
  }): Promise<Vendor> {
    const created = await prisma.vendor.create({
      data: {
        userId,
        companyName: data.companyName,
        businessType: data.businessType,
        description: data.description,
        contactPhone: data.contactPhone,
        website: data.website,
        logoUrl: data.logoUrl,
        locationLat: data.locationLat,
        locationLng: data.locationLng,
        address: data.address,
        serviceRadius: data.serviceRadius || 5.0,
      }
    });
    return this.toType(created);
  },

  async update(id: string, data: Partial<Vendor>): Promise<Vendor> {
    const validData: any = {};
    if (data.companyName !== undefined) validData.companyName = data.companyName;
    if (data.businessType !== undefined) validData.businessType = data.businessType;
    if (data.description !== undefined) validData.description = data.description;
    if (data.contactPhone !== undefined) validData.contactPhone = data.contactPhone;
    if (data.website !== undefined) validData.website = data.website;
    if (data.logoUrl !== undefined) validData.logoUrl = data.logoUrl;
    if (data.locationLat !== undefined) validData.locationLat = data.locationLat;
    if (data.locationLng !== undefined) validData.locationLng = data.locationLng;
    if (data.address !== undefined) validData.address = data.address;
    if (data.serviceRadius !== undefined) validData.serviceRadius = data.serviceRadius;
    if (data.isApproved !== undefined) validData.isApproved = data.isApproved;

    const updated = await prisma.vendor.update({
      where: { id },
      data: validData
    });
    return this.toType(updated);
  },

  async approve(id: string): Promise<Vendor> {
    const updated = await prisma.vendor.update({
      where: { id },
      data: { isApproved: true }
    });
    return this.toType(updated);
  },

  async reject(id: string): Promise<Vendor> {
    const updated = await prisma.vendor.update({
      where: { id },
      data: { isApproved: false }
    });
    return this.toType(updated);
  },

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.$transaction([
        prisma.ad.deleteMany({ where: { vendorId: id } }),
        prisma.tender.deleteMany({ where: { vendorId: id } }),
        prisma.vendor.delete({ where: { id } })
      ]);
      return true;
    } catch (e) {
      console.error('Failed to delete vendor:', e);
      return false;
    }
  },

  async findNearby(lat: number, lng: number, radiusKm: number = 10): Promise<Vendor[]> {
    const vendors = await prisma.vendor.findMany({ where: { isApproved: true } });
    
    const toRad = (value: number) => (value * Math.PI) / 180;
    
    const vendorsWithDistance = vendors.map((v: any) => {
      const R = 6371; // km
      const dLat = toRad(v.locationLat - lat);
      const dLon = toRad(v.locationLng - lng);
      const lat1 = toRad(lat);
      const lat2 = toRad(v.locationLat);

      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      return { ...v, distance };
    });

    const filtered = vendorsWithDistance.filter(v => v.distance <= radiusKm && v.distance <= v.serviceRadius);
    return filtered.map(v => this.toType(v));
  }
};
