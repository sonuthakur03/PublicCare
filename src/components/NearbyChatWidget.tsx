'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User } from '@/types';
import { MessageSquare, X, Send, Shield, Users, Wifi, WifiOff, EyeOff, UserCheck, AlertCircle, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  isAnonymous: boolean;
  text: string;
  timestamp: string;
}

interface NearbyChatWidgetProps {
  currentUser: User | null;
  userLat?: number;
  userLng?: number;
}

export default function NearbyChatWidget({ currentUser, userLat = 27.6727, userLng = 85.3253 }: NearbyChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [ipSubnet, setIpSubnet] = useState('Lalitpur Network');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Store dynamic metadata in refs to prevent unnecessary socket teardowns
  const metadataRef = useRef({ currentUser, isAnonymous, userLat, userLng });
  useEffect(() => {
    metadataRef.current = { currentUser, isAnonymous, userLat, userLng };
  }, [currentUser, isAnonymous, userLat, userLng]);

  // Handle JOIN update when metadata changes while socket is connected
  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'JOIN',
          userId: currentUser?.id || 'guest',
          userName: currentUser?.name || 'Local Citizen',
          isAnonymous,
          lat: userLat,
          lng: userLng
        })
      );
    }
  }, [isAnonymous, userLat, userLng, currentUser]);

  useEffect(() => {
    if (!isOpen) {
      if (socketRef.current) {
        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.close(1000, 'User closed chat widget');
        }
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    let reconnectTimer: NodeJS.Timeout;
    let isCancelled = false;

    const connectWebSocket = () => {
      if (isCancelled) return;

      // WebSocket connections are NOT subject to CORS — connect directly.
      // No HTTP probe needed; errors are handled by socket.onerror / socket.onclose.
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname || 'localhost';
      const wsUrl = `${wsProtocol}//${wsHost}:3001`;

      try {
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          if (isCancelled) {
            socket.close(1000, 'Cancelled');
            return;
          }
          setIsConnected(true);
          const currentMeta = metadataRef.current;
          socket.send(
            JSON.stringify({
              type: 'JOIN',
              userId: currentMeta.currentUser?.id || 'guest',
              userName: currentMeta.currentUser?.name || 'Local Citizen',
              isAnonymous: currentMeta.isAnonymous,
              lat: currentMeta.userLat,
              lng: currentMeta.userLng
            })
          );
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'HISTORY') {
              setMessages(data.messages || []);
              setOnlineCount(data.onlineCount || 1);
              if (data.ipSubnet) setIpSubnet(data.ipSubnet);
            } else if (data.type === 'NEW_MESSAGE') {
              setMessages((prev) => [...prev, data.message]);
            } else if (data.type === 'USER_JOINED' || data.type === 'USER_LEFT') {
              if (data.onlineCount !== undefined) {
                setOnlineCount(data.onlineCount);
              }
            }
          } catch (err) {
            console.error('WebSocket parsing error:', err);
          }
        };

        socket.onclose = (event) => {
          setIsConnected(false);
          if (!isCancelled && event.code !== 1000) {
            reconnectTimer = setTimeout(connectWebSocket, 3000);
          }
        };

        socket.onerror = () => {
          setIsConnected(false);
        };
      } catch (err) {
        console.warn('WebSocket initialization warning:', err);
        setIsConnected(false);
        if (!isCancelled) {
          reconnectTimer = setTimeout(connectWebSocket, 3000);
        }
      }
    };

    connectWebSocket();

    return () => {
      isCancelled = true;
      clearTimeout(reconnectTimer);
      if (socketRef.current) {
        const socket = socketRef.current;
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        if (socket.readyState === WebSocket.OPEN) {
          socket.close(1000, 'Unmounted');
        } else if (socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
        socketRef.current = null;
      }
    };
  }, [isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    socketRef.current.send(
      JSON.stringify({
        type: 'MESSAGE',
        text: inputText.trim(),
        isAnonymous
      })
    );

    setInputText('');
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9990,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 20px',
          borderRadius: '9999px',
          backgroundColor: '#0F6E64',
          color: '#FFFFFF',
          fontWeight: 'bold',
          fontSize: '13px',
          border: 'none',
          boxShadow: '0 8px 24px rgba(15,110,100,0.3)',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        <MessageSquare style={{ width: '18px', height: '18px' }} />
        <span>Nearby Network Chat</span>
        <span
          style={{
            backgroundColor: '#157F4A',
            color: '#FFFFFF',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontSize: '11px'
          }}
        >
          {onlineCount} Online
        </span>
      </button>

      {/* Chat Drawer Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '84px',
            right: '24px',
            zIndex: 9999,
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: '520px',
            maxHeight: 'calc(100vh - 120px)',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #D6CFC0',
            boxShadow: '0 16px 40px rgba(33,29,23,0.18)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'var(--font-body)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#0F6E64',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0 }}>Nearby Network Chat</h3>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    backgroundColor: isConnected ? '#157F4A' : '#C1592B',
                    color: '#FFFFFF',
                    padding: '2px 8px',
                    borderRadius: '9999px'
                  }}
                >
                  {isConnected ? <Wifi style={{ width: '11px', height: '11px' }} /> : <WifiOff style={{ width: '11px', height: '11px' }} />}
                  {isConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#E1F0EA', margin: '2px 0 0' }}>
                Mapped IP: {ipSubnet} • {onlineCount} neighbor(s) active
              </p>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px'
              }}
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          {/* Anonymous Toggle Banner for Logged-In User */}
          {currentUser ? (
            <div
              style={{
                backgroundColor: '#F5F1E9',
                padding: '10px 16px',
                borderBottom: '1px solid #D6CFC0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isAnonymous ? <EyeOff style={{ width: '14px', height: '14px', color: '#0F6E64' }} /> : <UserCheck style={{ width: '14px', height: '14px', color: '#0F6E64' }} />}
                <span style={{ fontWeight: 600, color: '#211D17' }}>
                  {isAnonymous ? 'Mode: Anonymous Citizen' : `Mode: ${currentUser.name}`}
                </span>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: '#59524A' }}>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  style={{ accentColor: '#0F6E64', cursor: 'pointer' }}
                />
                <span>Send Anonymously</span>
              </label>
            </div>
          ) : (
            <div style={{ backgroundColor: '#FBEEDD', padding: '8px 16px', fontSize: '11px', color: '#B8720B', borderBottom: '1px solid #D6CFC0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle style={{ width: '13px', height: '13px', flexShrink: 0 }} />
              <span>Please sign in to post messages in your local network chat.</span>
            </div>
          )}

          {/* Message List */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              backgroundColor: '#FAF8F4',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: '#7A7266', padding: '20px' }}>
                <Sparkles style={{ width: '28px', height: '28px', color: '#0F6E64', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 4px', color: '#211D17' }}>No messages yet in this network</p>
                <p style={{ fontSize: '11px', margin: 0 }}>Be the first neighbor to post an update or question!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: msg.senderId === currentUser?.id ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '2px',
                      fontSize: '11px',
                      color: '#7A7266'
                    }}
                  >
                    <span style={{ fontWeight: 'bold', color: msg.isAnonymous ? '#0F6E64' : '#211D17' }}>
                      {msg.senderName}
                    </span>
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      lineHeight: '1.4',
                      backgroundColor: msg.senderId === currentUser?.id ? '#0F6E64' : '#FFFFFF',
                      color: msg.senderId === currentUser?.id ? '#FFFFFF' : '#211D17',
                      border: msg.senderId === currentUser?.id ? 'none' : '1px solid #D6CFC0',
                      boxShadow: '0 2px 6px rgba(33,29,23,0.04)'
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '12px 16px',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #D6CFC0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <input
              type="text"
              disabled={!currentUser || !isConnected}
              placeholder={
                !currentUser
                  ? 'Sign in to message nearby neighbors...'
                  : !isConnected
                  ? 'Connecting to WebSocket server...'
                  : isAnonymous
                  ? 'Message anonymously to local network...'
                  : `Message as ${currentUser.name}...`
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '9999px',
                backgroundColor: '#F5F1E9',
                border: '1px solid #D6CFC0',
                fontSize: '13px',
                color: '#211D17',
                outline: 'none'
              }}
            />

            <button
              type="submit"
              disabled={!currentUser || !isConnected || !inputText.trim()}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: !currentUser || !isConnected || !inputText.trim() ? '#EFE9DC' : '#0F6E64',
                color: !currentUser || !isConnected || !inputText.trim() ? '#7A7266' : '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: !currentUser || !isConnected || !inputText.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Send style={{ width: '16px', height: '16px' }} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
