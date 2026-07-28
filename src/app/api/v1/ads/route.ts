import { NextRequest, NextResponse } from 'next/server';
import { AdModel } from '@/lib/models/ad.model';
import { VendorModel } from '@/lib/models/vendor.model';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get('placement') || undefined;
    const vendorId = searchParams.get('vendorId') || undefined;
    const active = searchParams.get('active');
    
    let filters: any = {};
    if (placement) filters.placement = placement;
    if (vendorId) filters.vendorId = vendorId;
    if (active === 'true') {
        filters.isActive = true;
        filters.isApproved = true;
    }
    
    const ads = await AdModel.getAll(filters);

    return NextResponse.json({ success: true, ads, data: ads }, { status: 200 });
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
    const { title, description, imageUrl, linkUrl, placement, startDate, endDate } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const newAd = await AdModel.create(vendor.id, {
      title,
      description,
      imageUrl,
      linkUrl,
      placement: placement || 'FEED',
      startDate: startDate || new Date(),
      endDate
    });

    return NextResponse.json({ success: true, ad: newAd, data: newAd }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
