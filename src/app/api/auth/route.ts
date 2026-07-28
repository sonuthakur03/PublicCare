import { NextRequest, NextResponse } from 'next/server';
import { authSession } from '@/lib/auth';
import { verifyToken } from '@/lib/jwt';
import { UserRole } from '@/types';

// GET /api/auth - Retrieve current authenticated user session from JWT cookie or Bearer token
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('cp_access_token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: true, user: null }, { status: 200 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: true, user: null }, { status: 200 });
    }

    const users = await authSession.getUsers();
    const foundUser = users.find(u => u.id === payload.userId || u.email.toLowerCase() === payload.email.toLowerCase());

    const activeUser = foundUser || {
      id: payload.userId,
      name: payload.name,
      email: payload.email,
      role: payload.role as UserRole,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      user: activeUser
    }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/auth:', error);
    return NextResponse.json({ success: true, user: null }, { status: 200 });
  }
}

// POST /api/auth - Login, Citizen Register, NGO Register, Logout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. LOGOUT
    if (action === 'LOGOUT') {
      const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
      response.cookies.delete('cp_access_token');
      response.cookies.delete('cp_refresh_token');
      return response;
    }

    // 2. LOGIN
    if (action === 'LOGIN') {
      const { email, password } = body;
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
      }

      const result = await authSession.login(email, password);
      
      const response = NextResponse.json({
        success: true,
        message: `Welcome back, ${result.user.name}!`,
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      });

      response.cookies.set('cp_access_token', result.accessToken, { httpOnly: true, path: '/' });
      response.cookies.set('cp_refresh_token', result.refreshToken, { httpOnly: true, path: '/' });

      return response;
    }

    // 3. REGISTER CITIZEN
    if (action === 'REGISTER_CITIZEN') {
      const { name, email, password } = body;
      if (!name || !email || !password) {
        return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
      }

      const result = await authSession.registerCitizen(name, email, password);

      const response = NextResponse.json({
        success: true,
        message: 'Citizen account successfully created!',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }, { status: 201 });

      response.cookies.set('cp_access_token', result.accessToken, { httpOnly: true, path: '/' });
      response.cookies.set('cp_refresh_token', result.refreshToken, { httpOnly: true, path: '/' });

      return response;
    }

    // REGISTER VENDOR
    if (action === 'REGISTER_VENDOR') {
      const { name, email, password, companyName, businessType, description, contactPhone, website, locationLat, locationLng, address, serviceRadius } = body;
      if (!name || !email || !password || !companyName || !businessType || !description) {
        return NextResponse.json({ error: 'Required fields missing.' }, { status: 400 });
      }
      const result = await authSession.registerVendor({ name, email, password, companyName, businessType, description, contactPhone, website, locationLat: locationLat || 27.6727, locationLng: locationLng || 85.3253, address: address || 'Lalitpur', serviceRadius });
      const response = NextResponse.json({ success: true, message: 'Vendor account created! Awaiting approval.', user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken }, { status: 201 });
      response.cookies.set('cp_access_token', result.accessToken, { httpOnly: true, path: '/' });
      response.cookies.set('cp_refresh_token', result.refreshToken, { httpOnly: true, path: '/' });
      return response;
    }

    // 4. REGISTER NGO
    if (action === 'REGISTER_NGO') {
      const { name, email, password, organizationName, registrationNumber } = body;
      if (!name || !email || !password || !organizationName) {
        return NextResponse.json({ error: 'Name, email, password, and Organization Name are required.' }, { status: 400 });
      }

      const result = await authSession.registerNgo({
        name,
        email,
        password,
        organizationName,
        registrationNumber
      });

      const response = NextResponse.json({
        success: true,
        message: 'NGO Research account successfully created!',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }, { status: 201 });

      response.cookies.set('cp_access_token', result.accessToken, { httpOnly: true, path: '/' });
      response.cookies.set('cp_refresh_token', result.refreshToken, { httpOnly: true, path: '/' });

      return response;
    }

    return NextResponse.json({ error: 'Invalid auth action specified.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Authentication error.' }, { status: 400 });
  }
}
