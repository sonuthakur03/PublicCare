import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { UserModel } from '@/lib/models/user.model';
import { VendorModel } from '@/lib/models/vendor.model';
import { AdModel } from '@/lib/models/ad.model';
import { TenderModel } from '@/lib/models/tender.model';
import { IssueModel } from '@/lib/models/issue.model';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('cp_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const users = await UserModel.getAll();
    const usersByRole = users.reduce((acc: Record<string, number>, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const vendors = await VendorModel.getAll();
    const ads = await AdModel.getAll();
    const tenders = await TenderModel.getAll();
    const issues = await IssueModel.getAll();
    const issueStats = await IssueModel.getStats();

    const byCategoryMap = issues.reduce((acc: Record<string, number>, issue: any) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const issuesByCategory = Object.entries(byCategoryMap).map(([category, count]) => ({ category, count }));

    const byStatusMap = issues.reduce((acc: Record<string, number>, issue: any) => {
      acc[issue.status] = (acc[issue.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const STATUS_COLORS: Record<string, string> = {
      'REPORTED': '#3B82F6', // Bright Blue
      'CRITICAL': '#EF4444', // Bright Red
      'IN_PROGRESS': '#F59E0B', // Bright Orange
      'RESOLVED': '#10B981' // Bright Green
    };
    const issuesByStatus = Object.entries(byStatusMap).map(([name, value]) => ({ 
      name, 
      value, 
      color: STATUS_COLORS[name] || '#EFE9DC' 
    }));

    const byMonthMap = issues.reduce((acc: Record<string, number>, issue: any) => {
      const month = new Date(issue.createdAt).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const monthlyTrend = Object.entries(byMonthMap).map(([month, count]) => ({ month, issues: count }));

    const stats = {
      users: {
        total: users.length,
        byRole: usersByRole
      },
      vendors: {
        total: vendors.length,
        approved: vendors.filter((v: any) => v.isApproved).length,
        pending: vendors.filter((v: any) => !v.isApproved).length,
      },
      ads: {
        total: ads.length,
        active: ads.filter((a: any) => a.isActive && a.isApproved).length,
        pending: ads.filter((a: any) => !a.isApproved).length,
      },
      tenders: {
        total: tenders.length,
        accepted: tenders.filter((t: any) => t.status === 'ACCEPTED').length,
        submitted: tenders.filter((t: any) => t.status === 'SUBMITTED').length,
        rejected: tenders.filter((t: any) => t.status === 'REJECTED').length,
      },
      issues: issueStats
    };

    return NextResponse.json({ success: true, users, stats, issuesByCategory, issuesByStatus, monthlyTrend }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('cp_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { action, targetId, newRole } = body;

    if (!action || !targetId) {
      return NextResponse.json({ error: 'Missing action or targetId' }, { status: 400 });
    }

    if (action === 'UPDATE_ROLE') {
      const updatedUser = await UserModel.updateRole(targetId, newRole);
      return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });
    }

    if (action === 'DELETE_USER') {
      const deleted = await UserModel.delete(targetId);
      if (deleted) {
         return NextResponse.json({ success: true, message: 'User deleted' }, { status: 200 });
      }
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'APPROVE_VENDOR') {
      const updatedVendor = await VendorModel.update(targetId, { isApproved: true });
      return NextResponse.json({ success: true, vendor: updatedVendor }, { status: 200 });
    }

    if (action === 'APPROVE_AD') {
      const updatedAd = await AdModel.update(targetId, { isApproved: true });
      return NextResponse.json({ success: true, ad: updatedAd }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
