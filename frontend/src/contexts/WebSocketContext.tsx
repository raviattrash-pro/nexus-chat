import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface WebSocketContextType {
  client: Client | null;
  isConnected: boolean;
  sendMessage: (destination: string, body: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
  userId: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, userId }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Dynamically match protocol to prevent browser SecurityError on HTTPS Vercel domains
    const defaultUrl = window.location.protocol === 'https:'
      ? 'https://localhost:8080/ws-chat'
      : 'http://localhost:8080/ws-chat';
    const backendUrl = import.meta.env.VITE_BACKEND_URL || defaultUrl;

    const stompClient = new Client({
      webSocketFactory: () => {
        try {
          return new SockJS(backendUrl);
        } catch (err) {
          console.warn('SockJS initialization failed:', err);
          return null as any;
        }
      },
      debug: () => {
        // no-op
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = (frame) => {
      console.log('Connected to WebSocket server via STOMP', frame);
      setIsConnected(true);
      
      // Subscribe to user specific queues
      stompClient.subscribe(`/topic/call.${userId}`, (message) => {
        const payload = JSON.parse(message.body);
        console.log('Received call signaling:', payload);
        window.dispatchEvent(new CustomEvent('webrtc-signal', { detail: payload }));
      });

      // Subscribe to chat messages
      stompClient.subscribe(`/topic/user.${userId}`, (message) => {
        const payload = JSON.parse(message.body);
        console.log('Received chat message:', payload);
        window.dispatchEvent(new CustomEvent('chat-message', { detail: payload }));
      });
    };

    stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    stompClient.activate();
    setClient(stompClient);

    return () => {
      stompClient.deactivate();
    };
  }, [userId]);

  const sendMessage = (destination: string, body: any) => {
    if (client && client.connected) {
      client.publish({
        destination: destination,
        body: JSON.stringify(body)
      });
    } else {
      console.error("Cannot send message, STOMP client is not connected.");
    }
  };

  return (
    <WebSocketContext.Provider value={{ client, isConnected, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};
