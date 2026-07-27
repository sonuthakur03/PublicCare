import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { User } from '@/types';

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

// POST /api/v1/upvote - POLP Enforcement: Requires authenticated user session
export async function POST(request: NextRequest) {
  try {
    const currentUser = getAuthenticatedUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED: You must be signed in to upvote civic issues.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { issueId } = body;

    if (!issueId) {
      return NextResponse.json({ error: 'issueId is required' }, { status: 400 });
    }

    try {
      const result = await db.voteIssue(currentUser, issueId);
      return NextResponse.json({
        success: true,
        message: result.escalated 
          ? 'ALERT: Issue reached 3 upvotes and was automatically escalated to CRITICAL COMMUNITY PROBLEM!' 
          : 'Vote recorded successfully.',
        escalated: result.escalated,
        issue: result.issue
      });
    } catch (err: any) {
      if (err.message === 'ALREADY_VOTED') {
        return NextResponse.json(
          {
            error: 'ALREADY_VOTED',
            message: 'You have already upvoted this civic issue. Only one vote per citizen is permitted.'
          },
          { status: 403 }
        );
      }
      throw err;
    }
  } catch (error: any) {
    console.error('Error recording upvote:', error);
    return NextResponse.json({ error: error.message || 'Failed to record vote.' }, { status: 400 });
  }
}
