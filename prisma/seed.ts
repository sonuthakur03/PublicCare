import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding Neon Postgres via Prisma ORM...');

  // 1. Seed Users
  const citizen = await prisma.user.upsert({
    where: { email: 'citizen@lalitpur.gov.np' },
    update: {},
    create: {
      id: 'usr-citizen-1',
      name: 'Aayush Shrestha',
      email: 'citizen@lalitpur.gov.np',
      passwordHash: 'pass123',
      role: 'user'
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: 'officer@lalitpur.gov.np' },
    update: {},
    create: {
      id: 'usr-admin-1',
      name: 'Er. Rajesh Maharjan',
      email: 'officer@lalitpur.gov.np',
      passwordHash: 'admin123',
      role: 'municipality_admin',
      organizationName: 'Lalitpur Sanitation Dept',
      registrationNumber: 'GOV-LPT-001'
    }
  });

  const ngo = await prisma.user.upsert({
    where: { email: 'ngo@cleanworld.org' },
    update: {},
    create: {
      id: 'usr-ngo-1',
      name: 'Sujata Thapa',
      email: 'ngo@cleanworld.org',
      passwordHash: 'ngo123',
      role: 'ngo',
      organizationName: 'Himalayan Climate Alliance',
      registrationNumber: 'NGO-LPT-2026-042'
    }
  });

  console.log('✅ Users seeded:', { citizen: citizen.email, admin: admin.email, ngo: ngo.email });

  // 2. Seed Civic Issues
  const issue1 = await prisma.issue.upsert({
    where: { id: 'iss-lpt-101' },
    update: {},
    create: {
      id: 'iss-lpt-101',
      userId: citizen.id,
      title: 'Uncollected Solid Waste Heap near Patan Durbar Square',
      category: 'GARBAGE_DUMP',
      description: 'Accumulation of unmanaged plastic bottles, bio-waste, and ritual debris near the heritage temple walkway.',
      locationLat: 27.6727,
      locationLng: 85.3253,
      address: 'Mangal Bazar Heritage Walk, Patan Ward 16',
      imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
      status: 'CRITICAL',
      netUpvotes: 5,
      reporterName: 'Aayush Shrestha',
      reporterContact: 'aayush@patan.org'
    }
  });

  const issue2 = await prisma.issue.upsert({
    where: { id: 'iss-lpt-102' },
    update: {},
    create: {
      id: 'iss-lpt-102',
      userId: admin.id,
      title: 'Clogged Drainage & Sewage Spill at Jawalakhel Roundabout',
      category: 'SEWAGE_OVERFLOW',
      description: 'Heavy rain runoff causing storm drain overflow near Central Zoo entrance.',
      locationLat: 27.6740,
      locationLng: 85.3170,
      address: 'Jawalakhel Chowk, Lalitpur Ward 4',
      imageUrl: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80',
      status: 'IN_PROGRESS',
      netUpvotes: 4,
      resolutionNotes: 'Lalitpur City Sanitation Jetting Truck #03 deployed for pipe clearing.',
      reporterName: 'Rabindra Maharjan'
    }
  });

  console.log('✅ Issues seeded:', [issue1.id, issue2.id]);

  // 3. Seed NGO API Keys
  const ngoKey = await prisma.ngoApiKey.upsert({
    where: { apiKey: 'cp_lpt_himalayan_984102934' },
    update: {},
    create: {
      id: 'key-1',
      userId: ngo.id,
      orgName: 'Himalayan Climate Alliance',
      apiKey: 'cp_lpt_himalayan_984102934',
      tier: 'ENTERPRISE',
      rateLimit: 50000,
      subscriptionCostNpr: 5000.0
    }
  });

  console.log('✅ NGO API Key seeded:', ngoKey.apiKey);
  console.log('🎉 Prisma Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Prisma seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
