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

export type CanvasMode = 'select' | 'add_room' | 'draw_pipe';

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

export interface Sensor {
  id: string;
  floorId: string;
  x: number;
  y: number;
  data: SensorData;
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

  // Floor actions
  addFloor: (name: string) => void;
  removeFloor: (id: string) => void;
  setActiveFloor: (id: string) => void;

  // Canvas actions
  setCanvasMode: (mode: CanvasMode) => void;
  setSelectedId: (id: string | null) => void;
  deleteEntity: (id: string) => void;

  // Room actions
  addRoom: (floorId: string, x: number, y: number) => void;
  updateRoomPoints: (roomId: string, points: number[]) => void;

  // Pipe actions
  addPipe: (floorId: string, points: number[]) => void;
  setDrawingPipePoints: (points: number[]) => void;
  clearDrawingPipe: () => void;
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
    set({
      canvasMode: mode,
      selectedId: null,
      drawingPipePoints: [],
    }),

  setSelectedId: (id: string | null) => set({ selectedId: id }),

  deleteEntity: (id: string) =>
    set((state) => ({
      rooms: state.rooms.filter((r) => r.id !== id),
      pipes: state.pipes.filter((p) => p.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  // ── Room actions ────────────────────────────────────────────────

  addRoom: (floorId: string, x: number, y: number) => {
    const newRoom: Room = {
      id: generateId('room'),
      floorId,
      name: `Room ${roomCounter}`,
      polygonPoints: [
        x, y,
        x + ROOM_W, y,
        x + ROOM_W, y + ROOM_H,
        x, y + ROOM_H,
      ],
    };
    set((state) => ({
      rooms: [...state.rooms, newRoom],
      canvasMode: 'select' as CanvasMode,
      selectedRoomId: newRoom.id,
    }));
  },

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

  setDrawingPipePoints: (points: number[]) =>
    set({ drawingPipePoints: points }),

  clearDrawingPipe: () => set({ drawingPipePoints: [] }),
}));
