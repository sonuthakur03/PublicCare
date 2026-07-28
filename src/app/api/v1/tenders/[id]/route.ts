import { NextRequest, NextResponse } from 'next/server';
import { TenderModel } from '@/lib/models/tender.model';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const tender = await TenderModel.getById(id);
    if (!tender) return NextResponse.json({ error: 'Tender not found' }, { status: 404 });
    return NextResponse.json({ success: true, tender, data: tender }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const token = request.cookies.get('cp_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'municipality_admin' && payload.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tender = await TenderModel.getById(id);
    if (!tender) return NextResponse.json({ error: 'Tender not found' }, { status: 404 });

    const body = await request.json();
    if (!['ACCEPTED', 'REJECTED'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updatedTender = await TenderModel.updateStatus(id, body.status, body.responseNotes);

    return NextResponse.json({ success: true, tender: updatedTender, data: updatedTender }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
