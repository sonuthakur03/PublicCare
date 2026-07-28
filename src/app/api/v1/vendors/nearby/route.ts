import { NextRequest, NextResponse } from 'next/server';
import { VendorModel } from '@/lib/models/vendor.model';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius');

    if (!latStr || !lngStr) {
      return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const radius = radiusStr ? parseFloat(radiusStr) : 10; // Default 10km

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      return NextResponse.json({ error: 'Invalid coordinates or radius' }, { status: 400 });
    }

    const vendors = await VendorModel.findNearby(lat, lng, radius);
    return NextResponse.json({ success: true, vendors, data: vendors }, { status: 200 });
  } catch (error: any) {
    console.error('Error in nearby vendors:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
