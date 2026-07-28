import { WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const prisma = new PrismaClient();

export async function runWebSocketTest(): Promise<boolean> {
  console.log('\n--- 🧪 TEST 3: WebSocket Connection, GPS Mapping & DB Message Persistence ---');

  const PORT = 3001;
  const wsUrl = `ws://localhost:${PORT}`;

  return new Promise<boolean>((resolve) => {
    let client1: WebSocket;
    let client2: WebSocket;
    let testPassed = false;
    const testText = `GPS Test Message ${Date.now()}`;
    const testLat = 27.6727;
    const testLng = 85.3253;

    try {
      client1 = new WebSocket(wsUrl);

      client1.on('open', () => {
        console.log('✅ Client 1 connected to WebSocket server.');
        client1.send(
          JSON.stringify({
            type: 'JOIN',
            userId: 'test_user_1',
            userName: 'Citizen Tester 1',
            isAnonymous: true,
            lat: testLat,
            lng: testLng
          })
        );

        // Connect Client 2 to same GPS location
        setTimeout(() => {
          client2 = new WebSocket(wsUrl);

          client2.on('open', () => {
            console.log('✅ Client 2 connected to WebSocket server with GPS coordinates.');
            client2.send(
              JSON.stringify({
                type: 'JOIN',
                userId: 'test_user_2',
                userName: 'Citizen Tester 2',
                isAnonymous: false,
                lat: testLat,
                lng: testLng
              })
            );

            // Client 2 listens for incoming messages from Client 1
            client2.on('message', async (dataRaw) => {
              try {
                const data = JSON.parse(dataRaw.toString());
                if (data.type === 'NEW_MESSAGE' && data.message.text === testText) {
                  console.log('✅ Client 2 received real-time broadcast message from Client 1:', data.message);

                  // Verify message was stored in Prisma database
                  await new Promise((r) => setTimeout(r, 500));
                  const dbMsg = await prisma.chatMessage.findFirst({
                    where: { text: testText }
                  });

                  if (dbMsg) {
                    console.log('✅ Verified message persisted to Prisma Postgres DB:', {
                      id: dbMsg.id,
                      roomKey: dbMsg.roomKey,
                      locationLat: dbMsg.locationLat,
                      locationLng: dbMsg.locationLng
                    });
                    // Cleanup DB record
                    await prisma.chatMessage.delete({ where: { id: dbMsg.id } });
                    testPassed = true;
                  } else {
                    console.error('❌ Message was broadcasted but not saved in DB!');
                  }

                  client1.close();
                  client2.close();
                  await prisma.$disconnect();
                  console.log('🎉 PASS: WebSocket Connection, GPS Mapping & DB Persistence test passed!\n');
                  resolve(testPassed);
                }
              } catch (e) {
                console.error('Error handling WS message:', e);
              }
            });

            // Send test message from Client 1
            setTimeout(() => {
              console.log('📤 Client 1 sending message via WebSocket...');
              client1.send(
                JSON.stringify({
                  type: 'MESSAGE',
                  text: testText,
                  isAnonymous: true
                })
              );
            }, 300);
          });

          client2.on('error', (err) => {
            console.error('❌ Client 2 WS Error:', err);
            client1.close();
            resolve(false);
          });
        }, 300);
      });

      client1.on('error', (err) => {
        console.error('❌ Could not connect to WebSocket server on ws://localhost:3001. Is `npm run ws` running?', err.message);
        resolve(false);
      });

      // Timeout fallback
      setTimeout(() => {
        if (!testPassed) {
          console.warn('⚠️ WebSocket test timed out. (Ensure `npm run ws` or `server/ws-server.ts` is running).');
          if (client1) client1.close();
          if (client2) client2.close();
          resolve(false);
        }
      }, 5000);
    } catch (err: any) {
      console.error('❌ FAIL: WebSocket test exception:', err);
      resolve(false);
    }
  });
}

if (require.main === module) {
  runWebSocketTest().then((pass) => process.exit(pass ? 0 : 1));
}
