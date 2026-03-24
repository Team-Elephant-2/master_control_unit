import { create } from 'zustand';

// ── Sensor Data Models ──────────────────────────────────────────────

export type MasterFlowData = { type: 'master_flow'; value: number };
export type HumidityData = { type: 'humidity'; value: number };
export type WaterDropData = { type: 'water_drop'; isWet: boolean };
export type PumpData = { type: 'pump'; isOn: boolean };
export type ValveData = { type: 'valve'; isOpen: boolean };

export type SensorData =
  | MasterFlowData
  | HumidityData
  | WaterDropData
  | PumpData
  | ValveData;

// ── Canvas Mode ─────────────────────────────────────────────────────

export type CanvasMode = 'select' | 'add_room' | 'draw_pipe' | 'add_sensor';

// ── Entity Types ────────────────────────────────────────────────────

export interface Floor {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  floorId: string;
  name: string;
  polygonPoints: number[]; // flat [x1,y1,x2,y2,...] for Konva
}

export interface Pipe {
  id: string;
  floorId: string;
  points: number[]; // flat [x1,y1,x2,y2,...] polyline
}

export type SensorType = 'master_flow' | 'humidity' | 'water_drop' | 'pump' | 'valve';

export interface Sensor {
  id: string;
  hardwareId: number;
  type: SensorType;
  floorId: string;
  roomId: string | null;
  x: number;
  y: number;
}

// ── Store Shape ─────────────────────────────────────────────────────

interface AppState {
  // Data
  floors: Floor[];
  rooms: Room[];
  pipes: Pipe[];
  sensors: Sensor[];
  activeFloorId: string | null;

  // Canvas state
  canvasMode: CanvasMode;
  selectedId: string | null;
  drawingPipePoints: number[];
  selectedSensorType: SensorType;

  // Floor actions
  addFloor: (name: string) => void;
  removeFloor: (id: string) => void;
  setActiveFloor: (id: string) => void;

  // Canvas actions
  setCanvasMode: (mode: CanvasMode) => void;
  setSelectedId: (id: string | null) => void;
  deleteEntity: (id: string) => void;
  setSelectedSensorType: (type: SensorType) => void;

  // Room actions
  addRoom: (floorId: string, x: number, y: number) => void;
  renameRoom: (roomId: string, name: string) => void;
  updateRoomPoints: (roomId: string, points: number[]) => void;

  // Pipe actions
  addPipe: (floorId: string, points: number[]) => void;
  updatePipePoints: (pipeId: string, points: number[]) => void;
  setDrawingPipePoints: (points: number[]) => void;
  clearDrawingPipe: () => void;

  // Sensor actions
  addSensor: (sensor: Omit<Sensor, 'id'>) => void;
  updateSensorPosition: (id: string, x: number, y: number, roomId: string | null) => void;
  updateSensorHardwareId: (id: string, hardwareId: number) => void;
}

// ── Helpers ─────────────────────────────────────────────────────────

let floorCounter = 1;
let roomCounter = 0;
let pipeCounter = 0;

function generateId(prefix: string): string {
  const counters: Record<string, () => number> = {
    floor: () => ++floorCounter,
    room: () => ++roomCounter,
    pipe: () => ++pipeCounter,
  };
  return `${prefix}-${Date.now()}-${(counters[prefix] ?? (() => 0))()}`;
}

const ROOM_W = 120;
const ROOM_H = 80;

const DEFAULT_FLOOR: Floor = { id: 'floor-1', name: 'Floor 1' };

// ── Store ───────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  floors: [DEFAULT_FLOOR],
  rooms: [],
  pipes: [],
  sensors: [],
  activeFloorId: DEFAULT_FLOOR.id,

  canvasMode: 'select',
  selectedId: null,
  drawingPipePoints: [],
  selectedSensorType: 'master_flow',

  // ── Floor actions ───────────────────────────────────────────────

  addFloor: (name: string) => {
    const newFloor: Floor = { id: generateId('floor'), name };
    set((state) => ({ floors: [...state.floors, newFloor] }));
  },

  removeFloor: (id: string) =>
    set((state) => ({
      floors: state.floors.filter((f) => f.id !== id),
      activeFloorId:
        state.activeFloorId === id
          ? state.floors[0]?.id ?? null
          : state.activeFloorId,
    })),

  setActiveFloor: (id: string) => set({ activeFloorId: id }),

  // ── Canvas actions ──────────────────────────────────────────────

  setCanvasMode: (mode: CanvasMode) =>
    set((state) => {
      // Auto-save pipe if switching away from 'draw_pipe' and we have enough points
      if (state.canvasMode === 'draw_pipe' && state.drawingPipePoints.length >= 4) {
        state.addPipe(state.activeFloorId!, state.drawingPipePoints);
      }
      return {
        canvasMode: mode,
        selectedId: null,
        drawingPipePoints: [],
      };
    }),

  setSelectedId: (id: string | null) => set({ selectedId: id }),

  deleteEntity: (id: string) =>
    set((state) => ({
      rooms: state.rooms.filter((r) => r.id !== id),
      pipes: state.pipes.filter((p) => p.id !== id),
      sensors: state.sensors.filter((s) => s.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  setSelectedSensorType: (type: SensorType) => set({ selectedSensorType: type }),

  // ── Room actions ────────────────────────────────────────────────

  addRoom: (floorId: string, x: number, y: number) => {
    const newRoom: Room = {
      id: generateId('room'),
      floorId,
      name: `Room ${++roomCounter}`,
      polygonPoints: [x, y, x + ROOM_W, y, x + ROOM_W, y + ROOM_H, x, y + ROOM_H],
    };
    set((state) => ({
      rooms: [...state.rooms, newRoom],
      canvasMode: 'select' as CanvasMode,
      selectedId: newRoom.id,
    }));
  },

  renameRoom: (roomId: string, name: string) =>
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === roomId ? { ...r, name } : r)),
    })),

  updateRoomPoints: (roomId: string, points: number[]) =>
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === roomId ? { ...r, polygonPoints: points } : r,
      ),
    })),

  // ── Pipe actions ────────────────────────────────────────────────

  addPipe: (floorId: string, points: number[]) => {
    const newPipe: Pipe = {
      id: generateId('pipe'),
      floorId,
      points,
    };
    set((state) => ({
      pipes: [...state.pipes, newPipe],
      drawingPipePoints: [],
    }));
  },

  updatePipePoints: (pipeId: string, points: number[]) =>
    set((state) => ({
      pipes: state.pipes.map((p) => (p.id === pipeId ? { ...p, points } : p)),
    })),

  setDrawingPipePoints: (points: number[]) =>
    set({ drawingPipePoints: points }),

  clearDrawingPipe: () => set({ drawingPipePoints: [] }),

  // ── Sensor actions ────────────────────────────────────────────────

  addSensor: (sensorArgs: Omit<Sensor, 'id'>) => {
    const newSensor: Sensor = {
      id: generateId('sensor'),
      ...sensorArgs,
    };
    set((state) => ({
      sensors: [...state.sensors, newSensor],
      canvasMode: 'select' as CanvasMode,
      selectedId: newSensor.id,
    }));
  },

  updateSensorPosition: (id: string, x: number, y: number, roomId: string | null) =>
    set((state) => ({
      sensors: state.sensors.map((s) =>
        s.id === id ? { ...s, x, y, roomId } : s
      ),
    })),

  updateSensorHardwareId: (id: string, hardwareId: number) =>
    set((state) => ({
      sensors: state.sensors.map((s) =>
        s.id === id ? { ...s, hardwareId } : s
      ),
    })),
}));
