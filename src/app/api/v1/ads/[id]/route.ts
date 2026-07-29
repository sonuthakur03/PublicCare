import { NextRequest, NextResponse } from 'next/server';
import { AdModel } from '@/lib/models/ad.model';
import { VendorModel } from '@/lib/models/vendor.model';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const ad = await AdModel.getById(id);
    if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    return NextResponse.json({ success: true, ad }, { status: 200 });
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
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ad = await AdModel.getById(id);
    if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });

    const vendor = await VendorModel.getById(ad.vendorId);
    
    const isOwner = payload.role === 'vendor' && vendor?.userId === payload.userId;
    const isSuperAdmin = payload.role === 'superadmin';

    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updateData: any = {};
    if (isSuperAdmin && body.isActive !== undefined) updateData.isActive = body.isActive;
    if (isSuperAdmin && body.isApproved !== undefined) updateData.isApproved = body.isApproved;

    const updatedAd = await AdModel.update(id, updateData);
    return NextResponse.json({ success: true, ad: updatedAd }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const body = await request.json();
    
    if (body.action === 'CLICK') {
      const ad = await AdModel.getById(id);
      if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
      
      await AdModel.trackClick(id);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (body.action === 'IMPRESSION') {
      await AdModel.trackImpression(id);
      return NextResponse.json({ success: true }, { status: 200 });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const token = request.cookies.get('cp_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.ad.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
