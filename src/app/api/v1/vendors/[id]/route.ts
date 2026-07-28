import { NextRequest, NextResponse } from 'next/server';
import { VendorModel } from '@/lib/models/vendor.model';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest, segmentData: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await segmentData.params;
    const vendor = await VendorModel.getById(id);
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, vendor, data: vendor }, { status: 200 });
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

    const vendor = await VendorModel.getById(id);
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Check permissions
    const isOwner = payload.userId === vendor.userId;
    const isSuperAdmin = payload.role === 'superadmin';
    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updateData: any = {};
    if (body.companyName !== undefined) updateData.companyName = body.companyName;
    if (body.businessType !== undefined) updateData.businessType = body.businessType;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.locationLat !== undefined) updateData.locationLat = body.locationLat;
    if (body.locationLng !== undefined) updateData.locationLng = body.locationLng;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.serviceRadius !== undefined) updateData.serviceRadius = body.serviceRadius;

    if (isSuperAdmin && body.isApproved !== undefined) {
      updateData.isApproved = body.isApproved;
    }

    const updatedVendor = await VendorModel.update(id, updateData);
    return NextResponse.json({ success: true, vendor: updatedVendor, data: updatedVendor }, { status: 200 });
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
    if (!payload || payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const vendor = await VendorModel.getById(id);
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const deleted = await VendorModel.delete(id);
    if (deleted) {
      return NextResponse.json({ success: true, message: 'Vendor removed' }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Failed to remove vendor' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
