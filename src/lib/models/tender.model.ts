import { Tender, TenderStatus } from '@/types';
import { prisma } from '../prisma';

export const TenderModel = {
  toType(record: any): Tender {
    return {
      id: record.id,
      vendorId: record.vendorId,
      issueId: record.issueId,
      proposalText: record.proposalText,
      estimatedCostNpr: record.estimatedCostNpr,
      estimatedDays: record.estimatedDays,
      status: record.status as TenderStatus,
      submittedAt: typeof record.submittedAt === 'string' ? record.submittedAt : record.submittedAt.toISOString(),
      respondedAt: record.respondedAt ? (typeof record.respondedAt === 'string' ? record.respondedAt : record.respondedAt.toISOString()) : undefined,
      responseNotes: record.responseNotes || undefined,
      vendor: record.vendor ? {
        id: record.vendor.id,
        companyName: record.vendor.companyName,
        businessType: record.vendor.businessType,
        contactPhone: record.vendor.contactPhone || undefined,
        logoUrl: record.vendor.logoUrl || undefined,
      } : undefined,
      issue: record.issue ? {
        id: record.issue.id,
        title: record.issue.title,
        category: record.issue.category,
        status: record.issue.status,
        address: record.issue.address,
      } : undefined,
    };
  },

  async getAll(filters?: { vendorId?: string; issueId?: string; status?: string }): Promise<Tender[]> {
    const where: any = {};
    if (filters?.vendorId) where.vendorId = filters.vendorId;
    if (filters?.issueId) where.issueId = filters.issueId;
    if (filters?.status) where.status = filters.status;

    const list = await prisma.tender.findMany({
      where,
      include: {
        vendor: { select: { id: true, companyName: true, businessType: true, contactPhone: true, logoUrl: true } },
        issue: { select: { id: true, title: true, category: true, status: true, address: true } }
      },
      orderBy: { submittedAt: 'desc' }
    });
    return list.map((t: any) => this.toType(t));
  },

  async getById(id: string): Promise<Tender | null> {
    const found = await prisma.tender.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, companyName: true, businessType: true, contactPhone: true, logoUrl: true } },
        issue: { select: { id: true, title: true, category: true, status: true, address: true } }
      }
    });
    if (!found) return null;
    return this.toType(found);
  },

  async getByVendorId(vendorId: string): Promise<Tender[]> {
    return this.getAll({ vendorId });
  },

  async getByIssueId(issueId: string): Promise<Tender[]> {
    return this.getAll({ issueId });
  },

  async create(vendorId: string, issueId: string, data: { proposalText: string; estimatedCostNpr: number; estimatedDays: number }): Promise<Tender> {
    const created = await prisma.tender.create({
      data: {
        vendor: { connect: { id: vendorId } },
        issue: { connect: { id: issueId } },
        proposalText: data.proposalText,
        estimatedCostNpr: data.estimatedCostNpr,
        estimatedDays: data.estimatedDays,
        status: 'SUBMITTED',
      }
    });
    return this.toType(created);
  },

  async updateStatus(id: string, status: TenderStatus, responseNotes?: string): Promise<Tender> {
    const updated = await prisma.tender.update({
      where: { id },
      data: {
        status,
        responseNotes,
        respondedAt: new Date()
      }
    });
    return this.toType(updated);
  }
};
