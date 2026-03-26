from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import uvicorn
import json
from typing import List, Dict

app = FastAPI()

# ── CORS Configuration ────────────────────────────────────────────────
# Allows the frontend (typically on port 3000) to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── State Management ──────────────────────────────────────────────────
# Store the latest state for each node_id
sensor_states: Dict[int, bool] = {}

# Keep track of active WebSocket connections for the frontend
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Send current state upon connection
        await websocket.send_text(json.dumps({"type": "init", "data": sensor_states}))

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                # Handle stale connections
                pass

manager = ConnectionManager()

# ── Data Models ──────────────────────────────────────────────────────
class SensorData(BaseModel):
    node_id: int
    is_wet: bool

# ── API Routes ────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "online", "message": "TMS Master Control Unit Backend is running"}

@app.post("/api/sensor")
async def receive_sensor_data(data: SensorData):
    """
    Endpoint for ESP32 to push water drop sensor data.
    """
    current_time = datetime.now().strftime("%H:%M:%S")
    
    # Update internal state
    sensor_states[data.node_id] = data.is_wet
    
    # Log to console
    status_icon = "🔴 ALERT" if data.is_wet else "🟢 CLEAR"
    status_text = "WATER!" if data.is_wet else "DRY."
    print(f"[{current_time}] {status_icon}: Node {data.node_id} is {status_text}")

    # Broadcast to all connected frontend clients
    await manager.broadcast(json.dumps({
        "type": "sensor_update",
        "data": {
            "node_id": data.node_id,
            "is_wet": data.is_wet,
            "timestamp": current_time
        }
    }))

    return {"status": "success", "data": data}

@app.get("/api/state")
async def get_state():
    """
    Fetch the current state of all sensors.
    """
    return sensor_states

# ── WebSocket Route ──────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We mostly use WS for pushing server -> client, 
            # but we keep the connection open here
            data = await websocket.receive_text()
            # Handle incoming WS messages if needed in the future
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ── Main Entry Point ──────────────────────────────────────────────────

if __name__ == "__main__":
    print("Starting TMS Backend...")
    print("Listening for ESP32 data on /api/sensor (Port 5000)")
    print("Websocket available on /ws")
    
    # host='0.0.0.0' allows connections from other devices on the same network (like ESP32)
    uvicorn.run(app, host="0.0.0.0", port=5000)