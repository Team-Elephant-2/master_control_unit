import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
export type ViewMode = 'floor' | 'building_overview';

// ── Entity Types ────────────────────────────────────────────────────

export interface Floor {
  id: string;
  name: string;
  blueprintUrl?: string; // Phase 10: Blueprint Background Image DataURL
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
  isMaster?: boolean;
  // Phase 7: Simulator State
  isWet?: boolean;
  value?: number;
  isOn?: boolean;
  isOpen?: boolean;
}

// ── Store Shape ─────────────────────────────────────────────────────

interface AppState {
  // ── State ────────────────────────────────────────────────────────
  floors: Floor[];
  rooms: Room[];
  pipes: Pipe[];
  sensors: Sensor[];
  
  activeFloorId: string | null;
  viewMode: ViewMode;
  canvasMode: CanvasMode;
  selectedId: string | null;
  focusedRoomId: string | null;
  drawingPipePoints: number[];
  selectedSensorType: SensorType | null;

  // Phase 10: Tracing Mode
  tracingMode: boolean;

  // Phase 11: Navigation
  stageX: number;
  stageY: number;
  stageScale: number;

  // ── Actions ──────────────────────────────────────────────────────
  // Floors
  setActiveFloor: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  addFloor: (name: string) => void;
  removeFloor: (id: string) => void;
  setFloorBlueprint: (floorId: string, url: string) => void;

  // Mode
  setCanvasMode: (mode: CanvasMode) => void;
  setSelectedId: (id: string | null) => void;
  setFocusedRoomId: (id: string | null) => void;
  setSelectedSensorType: (type: SensorType | null) => void;
  toggleTracingMode: () => void;
  deleteEntity: (id: string) => void;
  setStagePosition: (x: number, y: number) => void;
  setStageScale: (scale: number) => void;

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
  setMasterSensor: (sensorId: string, floorId: string) => void;

  // Phase 7 Simulator Actions
  simulateLeak: (sensorId: string) => void;
  simulateFlow: (sensorId: string, value: number) => void;
  togglePump: (sensorId: string) => void;
  toggleValve: (sensorId: string) => void;
  resetSimulation: () => void;

  // Phase 8 Utilities
  clearFloor: (floorId: string) => void;

  // Backend Sync
  syncSensorState: (hardwareId: number, isWet: boolean) => void;
  setFullLayout: (layout: { floors: Floor[]; rooms: Room[]; pipes: Pipe[]; sensors: Sensor[] }) => void;
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

export const useAppStore = create<AppState>()(
  (set) => ({
    floors: [DEFAULT_FLOOR],
    rooms: [],
    pipes: [],
    sensors: [],
      activeFloorId: DEFAULT_FLOOR.id,
      viewMode: 'floor',

  canvasMode: 'select',
  selectedId: null,
  focusedRoomId: null,
  drawingPipePoints: [],
  selectedSensorType: null,
  tracingMode: false,
  stageX: 0,
  stageY: 0,
  stageScale: 1,

  // ── Floor actions ───────────────────────────────────────────────

  addFloor: (name: string) => {
    const newFloor: Floor = { id: generateId('floor'), name };
    set((state) => ({ floors: [...state.floors, newFloor] }));
  },

  removeFloor: (id: string) =>
    set((state) => {
      const floorIndex = state.floors.findIndex((f) => f.id === id);
      if (floorIndex === -1) return state;

      const remainingFloors = state.floors.filter((f) => f.id !== id);
      
      // Phase 12: Renumber remaining floors so they are always in order
      const renamedFloors = remainingFloors.map((f, i) => ({
        ...f,
        name: `Floor ${i + 1}`
      }));

      const nextActiveId =
        state.activeFloorId === id
          ? (renamedFloors[0]?.id ?? null)
          : state.activeFloorId;

      return {
        floors: renamedFloors,
        activeFloorId: nextActiveId,
        rooms: state.rooms.filter((r) => r.floorId !== id),
        pipes: state.pipes.filter((p) => p.floorId !== id),
        sensors: state.sensors.filter((s) => s.floorId !== id),
        selectedId: null,
        focusedRoomId: null,
        stageX: 0,
        stageY: 0,
        stageScale: 1
      };
    }),

  setActiveFloor: (id: string) => set({ activeFloorId: id, viewMode: 'floor' }),

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),

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

  deleteEntity: (id: string) => set((state) => ({
    rooms: state.rooms.filter((r) => r.id !== id),
    pipes: state.pipes.filter((p) => p.id !== id),
    sensors: state.sensors.filter((s) => s.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId,
    focusedRoomId: state.focusedRoomId === id ? null : state.focusedRoomId,
  })),

  setSelectedSensorType: (type: SensorType | null) => set({ selectedSensorType: type, canvasMode: type ? 'add_sensor' : 'select' }),

  setFocusedRoomId: (id: string | null) => set({ focusedRoomId: id }),

  // ── Phase 11 Navigation ─────────────────────────────────────────

  setStagePosition: (x: number, y: number) => set({ stageX: x, stageY: y }),
  setStageScale: (scale: number) => set({ stageScale: scale }),

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
      // Phase 7 Default State
      isOn: sensorArgs.type === 'pump' ? true : undefined,
      isOpen: sensorArgs.type === 'valve' ? true : undefined,
      value: sensorArgs.type === 'master_flow' ? 0 : undefined,
      isWet: sensorArgs.type === 'water_drop' || sensorArgs.type === 'humidity' ? false : undefined,
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

  setMasterSensor: (sensorId: string, floorId: string) =>
    set((state) => ({
      sensors: state.sensors.map((s) => {
        // Only affect waterflow sensors on this floor
        if (s.type === 'master_flow' && s.floorId === floorId) {
          return { ...s, isMaster: s.id === sensorId };
        }
        return s;
      }),
    })),

  // ── Phase 7 Simulation Logic ────────────────────────────────────

  simulateLeak: (sensorId: string) => set((state) => {
    const target = state.sensors.find((s) => s.id === sensorId);
    if (!target) return state;

    return {
      sensors: state.sensors.map((s) => {
        if (s.id === sensorId) return { ...s, isWet: true };
        // Automated Mitigation: Shut off pumps and valves on the same floor
        if (s.floorId === target.floorId) {
          if (s.type === 'pump') return { ...s, isOn: false };
          if (s.type === 'valve') return { ...s, isOpen: false };
        }
        return s;
      })
    };
  }),

  simulateFlow: (sensorId: string, value: number) => set((state) => ({
    sensors: state.sensors.map((s) => s.id === sensorId ? { ...s, value } : s),
  })),

  togglePump: (sensorId: string) => set((state) => ({
    sensors: state.sensors.map((s) => s.id === sensorId ? { ...s, isOn: !s.isOn } : s),
  })),

  toggleValve: (sensorId: string) => set((state) => ({
    sensors: state.sensors.map((s) => s.id === sensorId ? { ...s, isOpen: !s.isOpen } : s),
  })),

  resetSimulation: () => set((state) => ({
    sensors: state.sensors.map((s) => {
      let overrides = {};
      if (s.type === 'water_drop' || s.type === 'humidity') overrides = { isWet: false };
      if (s.type === 'master_flow') overrides = { value: 0 };
      if (s.type === 'pump') overrides = { isOn: true };
      if (s.type === 'valve') overrides = { isOpen: true };
      return { ...s, ...overrides };
    })
  })),

  // ── Phase 10 Blueprint Tracing ──────────────────────────────────

  setFloorBlueprint: (floorId: string, url: string) => set((state) => ({
    floors: state.floors.map(f => f.id === floorId ? { ...f, blueprintUrl: url } : f)
  })),

  toggleTracingMode: () => set((state) => ({ tracingMode: !state.tracingMode })),

  // ── Phase 8 Utilities ───────────────────────────────────────────

  clearFloor: (floorId: string) => {
    console.log(`[useAppStore] Clearing floor: ${floorId}`);
    set((state) => ({
      rooms: state.rooms.filter(r => r.floorId !== floorId),
      pipes: state.pipes.filter(p => p.floorId !== floorId),
      sensors: state.sensors.filter(s => s.floorId !== floorId),
      floors: state.floors.map(f => f.id === floorId ? { ...f, blueprintUrl: undefined } : f),
      selectedId: null,
      focusedRoomId: null,
      canvasMode: 'select',
      stageX: 0,
      stageY: 0,
      stageScale: 1
    }));
  },
  // ── Backend Sync ───────────────────────────────────────────────
  
  syncSensorState: (hardwareId: number, isWet: boolean) =>
    set((state) => {
      // Only sync for hardwareIds 1-10
      if (hardwareId < 1 || hardwareId > 10) return state;

      const updatedSensors = state.sensors.map((s) => {
        if (s.hardwareId === hardwareId && (s.type === 'water_drop' || s.type === 'humidity')) {
          if (s.isWet === isWet) return s;
          console.log(`[Backend Sync] Sensor ${hardwareId} is now ${isWet ? 'WET' : 'DRY'}`);
          return { ...s, isWet };
        }
        return s;
      });

      // Handle mitigation if this sensor just went WET
      if (isWet) {
        return {
          sensors: updatedSensors.map((s) => {
            const triggeringSensor = updatedSensors.find(ts => ts.hardwareId === hardwareId && ts.isWet);
            if (triggeringSensor && s.floorId === triggeringSensor.floorId) {
              if (s.type === 'pump') return { ...s, isOn: false };
              if (s.type === 'valve') return { ...s, isOpen: false };
            }
            return s;
          })
        };
      }

      return { sensors: updatedSensors };
    }),

  setFullLayout: (layout) => set((state) => ({
    ...state,
    floors: layout.floors || state.floors,
    rooms: layout.rooms || state.rooms,
    pipes: layout.pipes || state.pipes,
    sensors: layout.sensors || state.sensors,
    // If active floor no longer exists, reset to the first available floor
    activeFloorId: (layout.floors && !layout.floors.find(f => f.id === state.activeFloorId)) 
      ? (layout.floors[0]?.id ?? null) 
      : state.activeFloorId,
  })),
}),);

// Remove cross-tab synchronization logic as we'll use WebSockets instead

