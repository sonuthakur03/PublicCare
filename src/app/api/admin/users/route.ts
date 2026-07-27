import { NextRequest, NextResponse } from 'next/server';
import { authSession } from '@/lib/auth';
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

// GET /api/admin/users - List all users (Admin only)
export async function GET(request: NextRequest) {
  const currentUser = getAuthenticatedUser(request);
  if (!currentUser || currentUser.role !== 'municipality_admin') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  const users = await authSession.getUsers();
  return NextResponse.json({ success: true, count: users.length, data: users });
}

// POST /api/admin/users - Provision a new Municipality Admin account
export async function POST(request: NextRequest) {
  try {
    const currentUser = getAuthenticatedUser(request);
    
    if (!currentUser || currentUser.role !== 'municipality_admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Only an existing Municipality Admin can create admin users.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, password.' },
        { status: 400 }
      );
    }

    const newAdmin = await authSession.createAdminUser(currentUser.role, { name, email, password });

    return NextResponse.json(
      {
        success: true,
        message: `Municipality Admin account successfully created for ${newAdmin.name}!`,
        user: newAdmin
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create admin user.' }, { status: 400 });
  }
}
