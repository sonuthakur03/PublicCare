import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();
const PORT = 3001;

interface ClientMeta {
  ws: WebSocket;
  id: string;
  userId: string;
  userName: string;
  isAnonymous: boolean;
  roomKey: string;
  ipSubnet: string;
  lat?: number;
  lng?: number;
}

const clients = new Set<ClientMeta>();

const server = http.createServer((req, res) => {
  // Allow any origin so browser fetch probes from localhost:3000 are not blocked
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', service: 'CivicPulse WebSocket DB Chat Server', activeClients: clients.size }));
});

const wss = new WebSocketServer({ server });

function getIpSubnet(req: http.IncomingMessage, clientIpHeader?: string): string {
  let ip = clientIpHeader || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
  }
  return 'Lalitpur-Municipal-Net';
}

function getRoomKey(ipSubnet: string, lat?: number, lng?: number): string {
  if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
    const latGrid = Math.round(lat * 100) / 100;
    const lngGrid = Math.round(lng * 100) / 100;
    return `room:geo_${latGrid}_${lngGrid}`;
  }
  return `room:net_${ipSubnet.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  const ipSubnet = getIpSubnet(req);
  let meta: ClientMeta = {
    ws,
    id: `client_${Math.random().toString(36).substring(2, 9)}`,
    userId: 'guest',
    userName: 'Anonymous Citizen',
    isAnonymous: true,
    roomKey: getRoomKey(ipSubnet),
    ipSubnet
  };

  clients.add(meta);

  ws.on('message', async (messageRaw: string) => {
    try {
      const data = JSON.parse(messageRaw.toString());

      if (data.type === 'JOIN') {
        const roomKey = getRoomKey(meta.ipSubnet, data.lat, data.lng);
        meta.userId = data.userId || meta.userId;
        meta.userName = data.userName || 'Citizen';
        meta.isAnonymous = Boolean(data.isAnonymous);
        meta.roomKey = roomKey;
        meta.lat = data.lat;
        meta.lng = data.lng;

        // Query historical chat messages from Neon Postgres via Prisma
        try {
          const dbMessages = await prisma.chatMessage.findMany({
            where: { roomKey },
            orderBy: { createdAt: 'asc' },
            take: 50,
            include: { user: { select: { id: true, name: true, role: true } } }
          });

          const formattedMessages = dbMessages.map((m) => ({
            id: m.id,
            senderId: m.userId || 'guest',
            senderName: m.senderName,
            isAnonymous: m.isAnonymous,
            text: m.text,
            timestamp: m.createdAt.toISOString(),
            roomKey: m.roomKey,
            ipSubnet: m.ipSubnet
          }));

          ws.send(
            JSON.stringify({
              type: 'HISTORY',
              roomKey,
              ipSubnet: meta.ipSubnet,
              messages: formattedMessages,
              onlineCount: getRoomOnlineCount(roomKey)
            })
          );
        } catch (dbErr) {
          console.warn('DB history query error:', dbErr);
          ws.send(
            JSON.stringify({
              type: 'HISTORY',
              roomKey,
              ipSubnet: meta.ipSubnet,
              messages: [],
              onlineCount: getRoomOnlineCount(roomKey)
            })
          );
        }

        broadcastToRoom(roomKey, {
          type: 'USER_JOINED',
          onlineCount: getRoomOnlineCount(roomKey),
          user: meta.isAnonymous ? `Anon Citizen #${meta.id.substring(7, 11)}` : meta.userName
        });
      } else if (data.type === 'MESSAGE') {
        if (!data.text || !data.text.trim()) return;

        const isAnon = Boolean(data.isAnonymous);
        const displayName = isAnon
          ? `Anon Citizen #${meta.id.substring(7, 11)}`
          : meta.userName || 'Logged-In Citizen';

        // Save message directly to Neon Postgres DB via Prisma
        let savedMessage;
        try {
          // Check if userId exists in User model before connecting relation
          let validUserId: string | undefined = undefined;
          if (meta.userId && meta.userId !== 'guest') {
            const userExists = await prisma.user.findUnique({ where: { id: meta.userId } });
            if (userExists) validUserId = userExists.id;
          }

          const dbRecord = await prisma.chatMessage.create({
            data: {
              userId: validUserId,
              senderName: displayName,
              isAnonymous: isAnon,
              text: data.text.trim(),
              roomKey: meta.roomKey,
              ipSubnet: meta.ipSubnet,
              locationLat: meta.lat || null,
              locationLng: meta.lng || null
            }
          });

          savedMessage = {
            id: dbRecord.id,
            senderId: meta.userId,
            senderName: dbRecord.senderName,
            isAnonymous: dbRecord.isAnonymous,
            text: dbRecord.text,
            timestamp: dbRecord.createdAt.toISOString(),
            roomKey: dbRecord.roomKey,
            ipSubnet: dbRecord.ipSubnet
          };
        } catch (dbErr) {
          console.error('Failed to persist chat message in Prisma:', dbErr);
          savedMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            senderId: meta.userId,
            senderName: displayName,
            isAnonymous: isAnon,
            text: data.text.trim(),
            timestamp: new Date().toISOString(),
            roomKey: meta.roomKey,
            ipSubnet: meta.ipSubnet
          };
        }

        broadcastToRoom(meta.roomKey, {
          type: 'NEW_MESSAGE',
          message: savedMessage
        });
      }
    } catch (err) {
      console.error('WS message error:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(meta);
    broadcastToRoom(meta.roomKey, {
      type: 'USER_LEFT',
      onlineCount: getRoomOnlineCount(meta.roomKey)
    });
  });
});

function getRoomOnlineCount(roomKey: string): number {
  let count = 0;
  for (const c of clients) {
    if (c.roomKey === roomKey && c.ws.readyState === WebSocket.OPEN) {
      count++;
    }
  }
  return count;
}

function broadcastToRoom(roomKey: string, payload: any) {
  const jsonStr = JSON.stringify(payload);
  for (const c of clients) {
    if (c.roomKey === roomKey && c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(jsonStr);
    }
  }
}

server.listen(PORT, () => {
  console.log(`[CivicPulse WS] WebSocket server with Prisma DB running on ws://localhost:${PORT}`);
});
