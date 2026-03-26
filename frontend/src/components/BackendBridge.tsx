'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

const BACKEND_WS_URL = 'ws://localhost:5000/ws';

export default function BackendBridge() {
  const syncSensorState = useAppStore((state) => state.syncSensorState);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      console.log(`[BackendBridge] Connecting to ${BACKEND_WS_URL}...`);
      const ws = new WebSocket(BACKEND_WS_URL);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('[BackendBridge] Connected to TMS Backend');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'init') {
            console.log('[BackendBridge] Received initial states:', message.data);
            Object.entries(message.data).forEach(([id, isWet]) => {
              syncSensorState(Number(id), isWet as boolean);
            });
          } else if (message.type === 'sensor_update') {
            const { node_id, is_wet } = message.data;
            syncSensorState(Number(node_id), is_wet);
          }
        } catch (err) {
          console.error('[BackendBridge] Error parsing WS message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[BackendBridge] WebSocket error:', error);
      };

      ws.onclose = () => {
        console.warn('[BackendBridge] Disconnected. Reconnecting in 3s...');
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [syncSensorState]);

  // This component doesn't render anything visible
  return null;
}
