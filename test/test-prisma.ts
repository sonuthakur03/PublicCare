import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

export async function runPrismaTest(): Promise<boolean> {
  console.log('\n--- 🧪 TEST 1: Prisma DB ChatMessage Schema & Instance Connection ---');
  try {
    // 1. Test database connection
    await prisma.$connect();
    console.log('✅ Connected to Neon Postgres database via Prisma ORM.');

    // 2. Fetch or create a test user
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: 'Test Citizen',
          email: `test_${Date.now()}@lalitpur.gov.np`,
          passwordHash: 'hashed_password_123',
          role: 'user'
        }
      });
      console.log('✅ Created test user:', user.email);
    } else {
      console.log('✅ Found existing database user:', user.email);
    }

    // 3. Create a test ChatMessage record in Prisma DB
    const testRoomKey = `room:test_geo_27.67_85.33`;
    const createdMsg = await prisma.chatMessage.create({
      data: {
        userId: user.id,
        senderName: 'Anon Citizen #Test',
        isAnonymous: true,
        text: 'Automated test message for Prisma ChatMessage schema verification.',
        roomKey: testRoomKey,
        ipSubnet: '192.168.1.0/24',
        locationLat: 27.6727,
        locationLng: 85.3253
      }
    });

    console.log('✅ Successfully created ChatMessage record in Postgres DB:', {
      id: createdMsg.id,
      text: createdMsg.text,
      roomKey: createdMsg.roomKey,
      location: `${createdMsg.locationLat}, ${createdMsg.locationLng}`
    });

    // 4. Query ChatMessage back from DB
    const fetchedMsg = await prisma.chatMessage.findUnique({
      where: { id: createdMsg.id },
      include: { user: true }
    });

    if (!fetchedMsg) {
      throw new Error('Failed to retrieve created ChatMessage from database.');
    }

    console.log('✅ Verified DB retrieval and user relation mapping:', {
      id: fetchedMsg.id,
      userName: fetchedMsg.user?.name || 'Anonymous'
    });

    // Clean up test message
    await prisma.chatMessage.delete({ where: { id: createdMsg.id } });
    console.log('🧹 Cleaned up test ChatMessage record.');

    console.log('🎉 PASS: Prisma ChatMessage Schema & Instance Connection test passed!\n');
    return true;
  } catch (err: any) {
    console.error('❌ FAIL: Prisma test failed:', err);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runPrismaTest().then((pass) => process.exit(pass ? 0 : 1));
}
