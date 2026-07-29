import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import { IssueCategory, IssueStatus, User } from '@/types';

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

// GET /api/v1/issues
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as IssueStatus | null;
    const category = searchParams.get('category') as IssueCategory | null;
    const query = searchParams.get('query') || undefined;
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius');

    // NGO API Key verification if provided
    const apiKeyHeader = request.headers.get('x-api-key');
    let keyInfo = null;
    if (apiKeyHeader) {
      keyInfo = await db.validateNgoApiKey(apiKeyHeader);
      if (!keyInfo) {
        return NextResponse.json(
          { error: 'Invalid or expired x-api-key header provided.' },
          { status: 401 }
        );
      }
    }

    const currentUser = getAuthenticatedUser(request);
    let issues = await db.getIssues(currentUser, {
      status: status || undefined,
      category: category || undefined,
      query
    });

    if (latStr && lngStr && radiusStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      const radius = parseFloat(radiusStr);
      
      const toRad = (v: number) => (v * Math.PI) / 180;
      const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lng2 - lng1);
        const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      };

      issues = issues.filter(i => i.locationLat && i.locationLng && haversine(lat, lng, i.locationLat, i.locationLng) <= radius);
    }

    const stats = await db.getStatsSummary();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      municipality: 'Lalitpur Municipality',
      currentUser,
      authenticatedNgo: keyInfo ? { orgName: keyInfo.orgName, tier: keyInfo.tier } : null,
      stats,
      count: issues.length,
      data: issues
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json({ error: 'Failed to retrieve civic issues.' }, { status: 500 });
  }
}

// POST /api/v1/issues - POLP Enforcement: Requires authenticated user session
export async function POST(request: NextRequest) {
  try {
    const currentUser = getAuthenticatedUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED: You must be signed in as a registered citizen to report issues.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, category, description, locationLat, locationLng, address, imageUrl, reporterName, reporterContact } = body;

    if (!title || !category || !description || locationLat === undefined || locationLng === undefined || !address) {
      return NextResponse.json(
        { error: 'Missing required fields: title, category, description, locationLat, locationLng, address' },
        { status: 400 }
      );
    }

    const newIssue = await db.createIssue(currentUser, {
      title,
      category,
      description,
      locationLat: Number(locationLat),
      locationLng: Number(locationLng),
      address,
      imageUrl,
      reporterName: reporterName || currentUser.name,
      reporterContact: reporterContact || currentUser.email
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Hygiene issue successfully logged and pinned to Lalitpur Municipality map.',
        data: newIssue
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating issue:', error);
    return NextResponse.json({ error: error.message || 'Failed to create civic issue.' }, { status: 400 });
  }
}
