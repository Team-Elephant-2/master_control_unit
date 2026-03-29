import { Room, Pipe } from '@/store/useAppStore';
import Konva from 'konva';

// Calculate the relative mouse position in stage coordinates (taking scale/zoom into account)
export function getRelativePointerPosition(stage: Konva.Stage): { x: number; y: number } | null {
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  const pos = stage.getPointerPosition();
  return pos ? transform.point(pos) : null;
}

// Find closest point on a set of Pipes
export function getClosestPointOnPipes(
  px: number,
  py: number,
  pipes: Pipe[]
): { x: number; y: number; dist: number; pipeId: string } | null {
  if (pipes.length === 0) return null;

  let minDist = Infinity;
  let bestX = px;
  let bestY = py;
  let bestPipeId = '';

  for (const pipe of pipes) {
    const points = pipe.points;
    if (points.length < 4) continue;

    for (let i = 0; i < points.length - 2; i += 2) {
      const p1x = points[i];
      const p1y = points[i + 1];
      const p2x = points[i + 2];
      const p2y = points[i + 3];

      const l2 = Math.pow(p1x - p2x, 2) + Math.pow(p1y - p2y, 2);
      if (l2 === 0) continue;

      let t = ((px - p1x) * (p2x - p1x) + (py - p1y) * (p2y - p1y)) / l2;
      t = Math.max(0, Math.min(1, t));

      const projX = p1x + t * (p2x - p1x);
      const projY = p1y + t * (p2y - p1y);
      const dist = Math.hypot(px - projX, py - projY);

      if (dist < minDist) {
        minDist = dist;
        bestX = projX;
        bestY = projY;
        bestPipeId = pipe.id;
      }
    }
  }

  if (minDist === Infinity) return null;
  return { x: bestX, y: bestY, dist: minDist, pipeId: bestPipeId };
}

// Ray-casting algorithm for Point-in-Polygon
export function pointInPolygon(px: number, py: number, points: number[]): boolean {
  let isInside = false;
  const numVertices = points.length / 2;
  for (let i = 0, j = numVertices - 1; i < numVertices; j = i++) {
    const xi = points[i * 2], yi = points[i * 2 + 1];
    const xj = points[j * 2], yj = points[j * 2 + 1];

    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) isInside = !isInside;
  }
  return isInside;
}

// Find room containing a point
export function findRoomForPoint(px: number, py: number, rooms: Room[]): string | null {
  for (const room of rooms) {
    if (pointInPolygon(px, py, room.polygonPoints)) {
      return room.id;
    }
  }
  return null;
}
