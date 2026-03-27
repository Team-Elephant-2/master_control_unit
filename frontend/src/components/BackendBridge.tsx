'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

const getEventsUrl = () => {
  if (typeof window === 'undefined') return '/api/events';
  
  const { hostname } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  
  // For local development, bypass Next.js proxy middleware which buffers SSE.
  // Connect directly to the FastAPI backend on port 5000.
  if (isLocal) {
    return `http://${hostname}:5000/api/events`;
  }
  
  // For ngrok/production, we must use the single exposed port/domain.
  return '/api/events?ngrok-skip-browser-warning=true';
};

const BACKEND_EVENTS_URL = getEventsUrl();
const BACKEND_API_URL = '/api/layout';

export default function BackendBridge() {
  const syncSensorState = useAppStore((state) => state.syncSensorState);
  const setFullLayout = useAppStore((state) => state.setFullLayout);
  
  // Get layout parts to watch for changes
  const floors = useAppStore((state) => state.floors);
  const rooms = useAppStore((state) => state.rooms);
  const pipes = useAppStore((state) => state.pipes);
  const sensors = useAppStore((state) => state.sensors);

  const lastSavedLayoutRef = useRef<string>('');
  const lastLocalChangeTimeRef = useRef<number>(0);
  const hasLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    console.log(`[BackendBridge] Initializing SSE at ${BACKEND_EVENTS_URL}...`);
    
    // Use withCredentials: true to ensure cookies (like ngrok-skip-warning) are handled
    const eventSource = new EventSource(BACKEND_EVENTS_URL, { withCredentials: true });

    eventSource.onopen = (e) => {
      console.log('[BackendBridge] SSE connection status: OPEN', e);
    };

    eventSource.onmessage = (event) => {
      try {
        console.log('[BackendBridge] Received SSE event:', event.data.substring(0, 100) + '...');
        const message = JSON.parse(event.data);
        
        if (message.type === 'init') {
          console.log('[BackendBridge] Received initial states via SSE:', message.data);
          Object.entries(message.data).forEach(([id, isWet]) => {
            syncSensorState(Number(id), isWet as boolean);
          });
        } else if (message.type === 'sensor_update') {
          const { node_id, is_wet, isOn } = message.data;
          if (is_wet !== undefined) {
            console.log(`[BackendBridge] Sensor Update: Node ${node_id} is ${is_wet ? 'WET' : 'DRY'}`);
          }
          if (isOn !== undefined) {
            console.log(`[BackendBridge] Pump Update: Node ${node_id} is ${isOn ? 'ON' : 'OFF'}`);
          }
          syncSensorState(Number(node_id), is_wet, isOn);
        }
 else if (message.type === 'layout_update') {
          const now = Date.now();
          if (now - lastLocalChangeTimeRef.current < 5000) {
            console.log('[BackendBridge] Skipping server layout sync (recent local adjustment detected)');
            return;
          }

          console.log('[BackendBridge] Received layout update via SSE');
          const layoutJson = JSON.stringify(message.data);
          if (layoutJson !== lastSavedLayoutRef.current) {
            lastSavedLayoutRef.current = layoutJson;
            setFullLayout(message.data);
          }
        }
      } catch (err) {
        console.error('[BackendBridge] Error parsing SSE message:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[BackendBridge] SSE error occurred:', error);
    };

    // Initial fetch of the layout (still through proxy is fine as it's not a stream)
    fetch(BACKEND_API_URL, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    })
      .then(res => res.json())
      .then(data => {
        console.log('[BackendBridge] Loaded initial layout');
        lastSavedLayoutRef.current = JSON.stringify(data);
        setFullLayout(data);
        hasLoadedRef.current = true;
      })
      .catch(err => {
        console.error('[BackendBridge] Error fetching layout:', err);
        hasLoadedRef.current = true;
      });

    return () => {
      console.log('[BackendBridge] Closing SSE connection');
      eventSource.close();
    };
  }, [syncSensorState, setFullLayout]);

  // Handle Auto-Saving
  useEffect(() => {
    if (!hasLoadedRef.current) return;

    const currentLayout = { floors, rooms, pipes, sensors };
    const layoutJson = JSON.stringify(currentLayout);

    if (layoutJson === lastSavedLayoutRef.current) return;

    lastLocalChangeTimeRef.current = Date.now();

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
        lastLocalChangeTimeRef.current = Date.now(); 
      })
      .catch(err => console.error('[BackendBridge] Save layout failed:', err));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [floors, rooms, pipes, sensors]);

  return null;
}
