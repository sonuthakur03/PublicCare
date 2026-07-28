import { NextRequest, NextResponse } from 'next/server';
import { VendorModel } from '@/lib/models/vendor.model';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessType = searchParams.get('businessType') || undefined;
    const isApprovedStr = searchParams.get('isApproved');
    let isApproved: boolean | undefined = undefined;
    if (isApprovedStr === 'true') isApproved = true;
    if (isApprovedStr === 'false') isApproved = false;
    
    const query = searchParams.get('query') || undefined;

    const vendors = await VendorModel.getAll({ businessType, isApproved, query });

    return NextResponse.json({ success: true, vendors, data: vendors }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/v1/vendors:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
