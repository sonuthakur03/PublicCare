import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { IssueStatus, User } from '@/types';

function getAuthenticatedUser(request: NextRequest): User | null {
  const token = request.cookies.get('cp_access_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.userId,
    name: payload.name,
    email: payload.email,
    role: payload.role as any,
    createdAt: new Date().toISOString()
  };
}

// POST /api/v1/admin/status - POLP Enforcement: Requires municipality_admin role
export async function POST(request: NextRequest) {
  try {
    const currentUser = getAuthenticatedUser(request);
    if (!currentUser || currentUser.role !== 'municipality_admin') {
      return NextResponse.json(
        { error: 'FORBIDDEN: Only authorized Sanitation Officers (municipality_admin) can update workorders.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { issueId, status, notes } = body;

    if (!issueId || !status) {
      return NextResponse.json({ error: 'issueId and status are required' }, { status: 400 });
    }

    const updatedIssue = await db.updateIssueStatus(currentUser, issueId, status as IssueStatus, notes);

    return NextResponse.json({
      success: true,
      message: `Issue ${issueId} status successfully updated to ${status}.`,
      data: updatedIssue
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update issue status.' }, { status: 400 });
  }
}
