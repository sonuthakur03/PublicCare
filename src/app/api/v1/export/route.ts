import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { IssueModel } from '@/lib/models/issue.model';
import { VendorModel } from '@/lib/models/vendor.model';
import { TenderModel } from '@/lib/models/tender.model';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('cp_access_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'municipality_admin' && payload.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { reportType } = body;

    const data: any = {
      reportType,
      generatedAt: new Date().toISOString(),
      generatedBy: payload.name
    };

    if (reportType === 'issues_summary' || reportType === 'full_report') {
      data.issuesStats = await IssueModel.getStats();
      const issues = await IssueModel.getAll();
      
      const byCategoryMap = issues.reduce((acc: Record<string, number>, issue: any) => {
        acc[issue.category] = (acc[issue.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const byCategory = Object.entries(byCategoryMap).map(([category, count]) => ({ category, count }));
      
      const byMonth = issues.reduce((acc: Record<string, number>, issue: any) => {
        const month = new Date(issue.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      data.stats = data.issuesStats; // Map for ExportButton
      data.issuesByCategory = byCategory;
      data.issuesByMonth = byMonth;
      data.issues = issues; // Include actual issues list
    }

    if (reportType === 'vendor_performance' || reportType === 'full_report') {
      const vendors = await VendorModel.getAll();
      const tenders = await TenderModel.getAll();
      
      data.vendorsStats = {
        total: vendors.length,
        approved: vendors.filter((v: any) => v.isApproved).length,
        pending: vendors.filter((v: any) => !v.isApproved).length
      };

      data.tendersStats = {
        total: tenders.length,
        accepted: tenders.filter((t: any) => t.status === 'ACCEPTED').length,
        rejected: tenders.filter((t: any) => t.status === 'REJECTED').length,
        pending: tenders.filter((t: any) => t.status === 'SUBMITTED' || t.status === 'UNDER_REVIEW').length,
      };
      
      data.vendors = vendors; // For vendor performance table
      if (reportType === 'vendor_performance') {
        data.stats = data.vendorsStats;
      } else if (reportType === 'full_report') {
        data.stats = { ...data.issuesStats, Vendors: data.vendorsStats.total, Tenders: data.tendersStats.total };
      }
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
