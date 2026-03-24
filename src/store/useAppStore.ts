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

// ── Entity Types ────────────────────────────────────────────────────

export interface Floor {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  floorId: string;
  name: string;
  polygonPoints: [number, number][];
}

export interface Pipe {
  id: string;
  floorId: string;
  points: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };
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

  // Actions
  addFloor: (name: string) => void;
  removeFloor: (id: string) => void;
  setActiveFloor: (id: string) => void;
}

// ── Helpers ─────────────────────────────────────────────────────────

let floorCounter = 1;

function generateFloorId(): string {
  return `floor-${Date.now()}-${floorCounter++}`;
}

const DEFAULT_FLOOR: Floor = { id: 'floor-1', name: 'Floor 1' };

// ── Store ───────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  floors: [DEFAULT_FLOOR],
  rooms: [],
  pipes: [],
  sensors: [],
  activeFloorId: DEFAULT_FLOOR.id,

  addFloor: (name: string) => {
    const newFloor: Floor = { id: generateFloorId(), name };
    set((state) => ({
      floors: [...state.floors, newFloor],
    }));
  },

  removeFloor: (id: string) =>
    set((state) => ({
      floors: state.floors.filter((f) => f.id !== id),
      activeFloorId: state.activeFloorId === id ? state.floors[0]?.id ?? null : state.activeFloorId,
    })),

  setActiveFloor: (id: string) => set({ activeFloorId: id }),
}));
