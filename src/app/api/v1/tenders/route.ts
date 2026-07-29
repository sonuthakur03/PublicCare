import { NextRequest, NextResponse } from 'next/server';
import { TenderModel } from '@/lib/models/tender.model';
import { VendorModel } from '@/lib/models/vendor.model';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId') || undefined;
    const issueId = searchParams.get('issueId') || undefined;
    const status = searchParams.get('status') || undefined;

    const tenders = await TenderModel.getAll({ vendorId, issueId, status });

    return NextResponse.json({ success: true, tenders, data: tenders }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('cp_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'vendor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const vendor = await VendorModel.getByUserId(payload.userId);
    if (!vendor) return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });

    const body = await request.json();
    const { issueId, proposalText, estimatedCostNpr, estimatedDays } = body;

    if (!issueId || !proposalText || estimatedCostNpr === undefined || estimatedCostNpr === null || isNaN(estimatedCostNpr) || estimatedDays === undefined || estimatedDays === null || isNaN(estimatedDays)) {
      return NextResponse.json({ error: 'Required fields missing or invalid' }, { status: 400 });
    }

    const newTender = await TenderModel.create(vendor.id, issueId, {
      proposalText,
      estimatedCostNpr,
      estimatedDays
    });

    return NextResponse.json({ success: true, tender: newTender, data: newTender }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
