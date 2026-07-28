import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding Neon Postgres via Prisma ORM for Lalitpur CivicPulse...');

  // 1. Seed Users (POLP compliant roles)
  const citizen1 = await prisma.user.upsert({
    where: { email: 'citizen@lalitpur.gov.np' },
    update: {
      name: 'Aayush Shrestha',
      passwordHash: 'pass123',
      role: 'user'
    },
    create: {
      id: 'usr-citizen-1',
      name: 'Aayush Shrestha',
      email: 'citizen@lalitpur.gov.np',
      passwordHash: 'pass123',
      role: 'user'
    }
  });

  const citizen2 = await prisma.user.upsert({
    where: { email: 'prashant.joshi@gmail.com' },
    update: {
      name: 'Prashant Joshi',
      passwordHash: 'pass123',
      role: 'user'
    },
    create: {
      id: 'usr-citizen-2',
      name: 'Prashant Joshi',
      email: 'prashant.joshi@gmail.com',
      passwordHash: 'pass123',
      role: 'user'
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: 'officer@lalitpur.gov.np' },
    update: {
      name: 'Er. Rajesh Maharjan',
      passwordHash: 'admin123',
      role: 'municipality_admin',
      organizationName: 'Lalitpur Metropolitan Environment Dept',
      registrationNumber: 'GOV-LPT-001'
    },
    create: {
      id: 'usr-admin-1',
      name: 'Er. Rajesh Maharjan',
      email: 'officer@lalitpur.gov.np',
      passwordHash: 'admin123',
      role: 'municipality_admin',
      organizationName: 'Lalitpur Metropolitan Environment Dept',
      registrationNumber: 'GOV-LPT-001'
    }
  });

  const ngo = await prisma.user.upsert({
    where: { email: 'ngo@cleanworld.org' },
    update: {
      name: 'Sujata Thapa',
      passwordHash: 'ngo123',
      role: 'ngo',
      organizationName: 'Himalayan Climate & Hygiene Alliance',
      registrationNumber: 'NGO-LPT-2026-042'
    },
    create: {
      id: 'usr-ngo-1',
      name: 'Sujata Thapa',
      email: 'ngo@cleanworld.org',
      passwordHash: 'ngo123',
      role: 'ngo',
      organizationName: 'Himalayan Climate & Hygiene Alliance',
      registrationNumber: 'NGO-LPT-2026-042'
    }
  });

  console.log('✅ Users seeded:', { citizen1: citizen1.email, citizen2: citizen2.email, admin: admin.email, ngo: ngo.email });

  // 2. Seed Lalitpur Specific Civic Issues
  const issuesData = [
    {
      id: 'iss-lpt-101',
      userId: citizen1.id,
      title: 'Uncollected Solid Waste Heap near Patan Durbar Square Walkway',
      category: 'GARBAGE_DUMP',
      description: 'Accumulation of unmanaged plastic packaging, bio-waste, and ritual debris near the heritage temple walkway blocking tourist access.',
      locationLat: 27.6727,
      locationLng: 85.3253,
      address: 'Mangal Bazar Heritage Walk, Ward 16, Patan',
      imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
      status: 'CRITICAL',
      netUpvotes: 5,
      reporterName: 'Aayush Shrestha',
      reporterContact: 'aayush@patan.org',
      escalatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
    },
    {
      id: 'iss-lpt-102',
      userId: admin.id,
      title: 'Clogged Drainage & Sewage Overflow at Jawalakhel Roundabout',
      category: 'SEWAGE_OVERFLOW',
      description: 'Heavy rain runoff combined with blocked main drainage pipe causing foul sewage spill across Central Zoo road corridor.',
      locationLat: 27.6740,
      locationLng: 85.3170,
      address: 'Jawalakhel Chowk, Ward 4, Lalitpur',
      imageUrl: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80',
      status: 'IN_PROGRESS',
      netUpvotes: 4,
      resolutionNotes: 'Lalitpur City Sanitation Jetting Truck #03 deployed for pipe unblocking.',
      reporterName: 'Rabindra Maharjan'
    },
    {
      id: 'iss-lpt-103',
      userId: citizen2.id,
      title: 'Contaminated Water Pipeline Leakage near Pulchowk Campus Gate',
      category: 'WATER_CONTAMINATION',
      description: 'Broken drinking water supply pipe exposed to street gutter water, resulting in turbid tap water in neighboring Ward 3 residences.',
      locationLat: 27.6782,
      locationLng: 85.3185,
      address: 'Pulchowk Engineering Campus Road, Ward 3, Lalitpur',
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
      status: 'CRITICAL',
      netUpvotes: 6,
      reporterName: 'Prashant Joshi',
      reporterContact: 'prashant.j@gmail.com',
      escalatedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString()
    },
    {
      id: 'iss-lpt-104',
      userId: citizen1.id,
      title: 'Illegal Construction Debris Dumping at Bagmati River Corridor',
      category: 'ILLEGAL_DUMPING',
      description: 'Nighttime illegal dumping of concrete rubble, bricks, and mortar waste along the riverbank near Kupondole bridge.',
      locationLat: 27.6865,
      locationLng: 85.3142,
      address: 'Bagmati Riverbank Corridor, Kupondole, Ward 1, Lalitpur',
      imageUrl: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80',
      status: 'REPORTED',
      netUpvotes: 2,
      reporterName: 'Suman Shakya'
    },
    {
      id: 'iss-lpt-105',
      userId: ngo.id,
      title: 'Overflowing Public Sanitation Facility near Lagankhel Bus Park',
      category: 'PUBLIC_TOILET',
      description: 'Public toilet block pumps malfunctioning, leading to unhygienic conditions and odor nuisance for daily commuters.',
      locationLat: 27.6668,
      locationLng: 85.3241,
      address: 'Lagankhel Bus Park Hub, Ward 5, Lalitpur',
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      status: 'RESOLVED',
      netUpvotes: 8,
      resolutionNotes: 'Submersible water pump replaced and facility sanitized by Ward 5 municipal crew.',
      resolvedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      reporterName: 'Sujata Thapa (Himalayan Alliance)'
    },
    {
      id: 'iss-lpt-106',
      userId: citizen2.id,
      title: 'Stagnant Stormwater & Mosquito Vector Breeding at Satdobato',
      category: 'OTHER',
      description: 'Waterlogging in unfinished road drainage pits creating mosquito vector hazard near Satdobato Swimming Complex.',
      locationLat: 27.6542,
      locationLng: 85.3288,
      address: 'Satdobato Chowk Ring Road, Ward 15, Lalitpur',
      imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80',
      status: 'IN_PROGRESS',
      netUpvotes: 3,
      resolutionNotes: 'Larvicidal spray applied; trench pumps actively clearing stagnant pools.',
      reporterName: 'Bikram Bajracharya'
    },
    {
      id: 'iss-lpt-107',
      userId: citizen1.id,
      title: 'Decomposed Stray Animal Removal Needed near Gwarko Intersection',
      category: 'DEAD_ANIMAL',
      description: 'Hazardous carcass on the road median causing severe odor and health hazard for pedestrians and traffic.',
      locationLat: 27.6651,
      locationLng: 85.3340,
      address: 'Gwarko Flyover Junction, Ward 17, Lalitpur',
      imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
      status: 'RESOLVED',
      netUpvotes: 4,
      resolutionNotes: 'Rapid Response Animal Control Unit safely removed carcass and disinfected area with lime powder.',
      resolvedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
      reporterName: 'Anil Tamang'
    }
  ];

  for (const item of issuesData) {
    await prisma.issue.upsert({
      where: { id: item.id },
      update: item,
      create: item
    });
  }

  console.log(`✅ Seeded ${issuesData.length} Lalitpur municipal issues across Wards 1, 3, 4, 5, 15, 16 & 17.`);

  // 3. Seed Issue Votes for ACID upvoting verification
  const vote1 = await prisma.issueVote.upsert({
    where: {
      issueId_userId: { issueId: 'iss-lpt-101', userId: citizen1.id }
    },
    update: {},
    create: {
      id: 'vote-1',
      issueId: 'iss-lpt-101',
      userId: citizen1.id,
      voteType: 'UP'
    }
  });

  const vote2 = await prisma.issueVote.upsert({
    where: {
      issueId_userId: { issueId: 'iss-lpt-103', userId: citizen2.id }
    },
    update: {},
    create: {
      id: 'vote-2',
      issueId: 'iss-lpt-103',
      userId: citizen2.id,
      voteType: 'UP'
    }
  });

  console.log('✅ Seeded issue votes:', [vote1.id, vote2.id]);

  // 4. Seed NGO API Keys
  const ngoKey1 = await prisma.ngoApiKey.upsert({
    where: { apiKey: 'cp_lpt_himalayan_984102934' },
    update: {
      tier: 'ENTERPRISE',
      rateLimit: 50000,
      subscriptionCostNpr: 5000.0
    },
    create: {
      id: 'key-1',
      userId: ngo.id,
      orgName: 'Himalayan Climate & Hygiene Alliance',
      apiKey: 'cp_lpt_himalayan_984102934',
      tier: 'ENTERPRISE',
      rateLimit: 50000,
      subscriptionCostNpr: 5000.0
    }
  });

  const ngoKey2 = await prisma.ngoApiKey.upsert({
    where: { apiKey: 'cp_lpt_community_free_882910' },
    update: {
      tier: 'COMMUNITY',
      rateLimit: 1000,
      subscriptionCostNpr: 0.0
    },
    create: {
      id: 'key-2',
      userId: ngo.id,
      orgName: 'Himalayan Climate & Hygiene Alliance',
      apiKey: 'cp_lpt_community_free_882910',
      tier: 'COMMUNITY',
      rateLimit: 1000,
      subscriptionCostNpr: 0.0
    }
  });

  console.log('✅ Seeded NGO API Keys:', [ngoKey1.apiKey, ngoKey2.apiKey]);
  console.log('🎉 CivicPulse database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Prisma seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
