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

// GET /api/v1/ngo/keys - List NGO API keys scoped to authenticated NGO user
export async function GET(request: NextRequest) {
  try {
    const currentUser = getAuthenticatedUser(request);
    
    if (!currentUser || (currentUser.role !== 'ngo' && currentUser.role !== 'municipality_admin')) {
      return NextResponse.json({ error: 'FORBIDDEN: Only registered NGO accounts can access API keys.' }, { status: 403 });
    }

    const keys = await db.getNgoApiKeys(currentUser);
    return NextResponse.json({ success: true, count: keys.length, data: keys });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve NGO keys' }, { status: 500 });
  }
}

// POST /api/v1/ngo/keys - Generate a new NGO API key linked to user
export async function POST(request: NextRequest) {
  try {
    const currentUser = getAuthenticatedUser(request);

    if (!currentUser || (currentUser.role !== 'ngo' && currentUser.role !== 'municipality_admin')) {
      return NextResponse.json({ error: 'FORBIDDEN: Only registered NGO accounts can generate API keys.' }, { status: 403 });
    }

    const body = await request.json();
    const { orgName, tier = 'COMMUNITY' } = body;

    const finalOrgName = orgName || currentUser.organizationName || currentUser.name;

    const keyObj = await db.generateNgoApiKey(currentUser, finalOrgName, tier);
    return NextResponse.json({
      success: true,
      message: 'NGO API Key generated and linked to your organization account.',
      data: keyObj
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate NGO key' }, { status: 400 });
  }
}
