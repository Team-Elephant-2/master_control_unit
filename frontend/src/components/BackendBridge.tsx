'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

const getUrls = () => {
  if (typeof window === 'undefined') return { ws: 'ws://localhost:5000/ws', api: '/api' };
  
  const { hostname, protocol } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
  
  // For local development, backend is likely on port 5000.
  // For ngrok/production, assume backend is behind a proxy on the same host.
  const wsHost = isLocal ? `${hostname}:5000` : hostname;
  
  return {
    ws: `${wsProtocol}//${wsHost}/ws`,
    api: '/api'
  };
};

const URLS = getUrls();
const BACKEND_WS_URL = URLS.ws;
const BACKEND_API_URL = `${URLS.api}/layout`;

export default function BackendBridge() {
  const syncSensorState = useAppStore((state) => state.syncSensorState);
  const setFullLayout = useAppStore((state) => state.setFullLayout);
  
  // Get layout parts to watch for changes
  const floors = useAppStore((state) => state.floors);
  const rooms = useAppStore((state) => state.rooms);
  const pipes = useAppStore((state) => state.pipes);
  const sensors = useAppStore((state) => state.sensors);

  const socketRef = useRef<WebSocket | null>(null);
  const lastSavedLayoutRef = useRef<string>('');

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
          } else if (message.type === 'layout_update') {
            console.log('[BackendBridge] Received layout update from server');
            const layoutJson = JSON.stringify(message.data);
            if (layoutJson !== lastSavedLayoutRef.current) {
              lastSavedLayoutRef.current = layoutJson;
              setFullLayout(message.data);
            }
          }
        } catch (err) {
          console.error('[BackendBridge] Error parsing WS message:', err);
        }
      };

      ws.onerror = (error) => {
        // WebSocket error events don't provide much detail in browsers for security reasons.
        // We log the readyState to see if the connection even started.
        console.error('[BackendBridge] WebSocket error occurred. ReadyState:', ws.readyState, error);
      };

      ws.onclose = () => {
        console.warn('[BackendBridge] Disconnected. Reconnecting in 3s...');
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();
    
    // Initial fetch of the layout
    fetch(BACKEND_API_URL, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    })
      .then(res => res.json())
      .then(data => {
        console.log('[BackendBridge] Loaded initial layout');
        lastSavedLayoutRef.current = JSON.stringify(data);
        setFullLayout(data);
      })
      .catch(err => console.error('[BackendBridge] Error fetching layout:', err));

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [syncSensorState, setFullLayout]);

  // Handle Auto-Saving (Persistent layout changes)
  useEffect(() => {
    const currentLayout = { floors, rooms, pipes, sensors };
    const layoutJson = JSON.stringify(currentLayout);

    // Skip if this change matches what we just sent or received
    if (layoutJson === lastSavedLayoutRef.current) return;

    // Debounce save
    const timeout = setTimeout(() => {
      console.log('[BackendBridge] Saving layout to backend...');
      fetch(BACKEND_API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: layoutJson
      })
      .then(() => {
        lastSavedLayoutRef.current = layoutJson;
      })
      .catch(err => console.error('[BackendBridge] Save layout failed:', err));
    }, 1000); // 1-second debounce

    return () => clearTimeout(timeout);
  }, [floors, rooms, pipes, sensors]);

  // This component doesn't render anything visible
  return null;
}
