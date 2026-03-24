import React, { useRef, useEffect } from 'react';
import { Line, Circle, Text, Group, Transformer } from 'react-konva';
import { useAppStore } from '@/store/useAppStore';
import type { Room } from '@/store/useAppStore';
import type { KonvaEventObject } from 'konva/lib/Node';

interface RoomShapeProps {
  room: Room;
}

const SNAP_DIST = 15;

export default function RoomShape({ room }: RoomShapeProps) {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  const canvasMode = useAppStore((s) => s.canvasMode);
  const selectedId = useAppStore((s) => s.selectedId);
  const setSelectedId = useAppStore((s) => s.setSelectedId);
  const updateRoomPoints = useAppStore((s) => s.updateRoomPoints);
  const allRooms = useAppStore((s) => s.rooms);

  const isSelected = selectedId === room.id;
  const pts = room.polygonPoints;

  // ── Transformer attachment ────────────────────────────────────────

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // We snap only to other rooms on the same floor
  const otherRooms = allRooms.filter(
    (r) => r.id !== room.id && r.floorId === room.floorId
  );

  // Convert flat array to pairs for anchor rendering
  const anchorPairs: [number, number][] = [];
  for (let i = 0; i < pts.length; i += 2) {
    anchorPairs.push([pts[i], pts[i + 1]]);
  }

  // Compute centroid for the label
  const cx = anchorPairs.reduce((s, p) => s + p[0], 0) / Math.max(1, anchorPairs.length);
  const cy = anchorPairs.reduce((s, p) => s + p[1], 0) / Math.max(1, anchorPairs.length);

  // ── Handlers ──────────────────────────────────────────────────────

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (canvasMode !== 'select') return;
    e.cancelBubble = true;
    setSelectedId(room.id);
  };

  const handleLineDblClick = (e: KonvaEventObject<MouseEvent>) => {
    if (canvasMode !== 'select' || !isSelected) return;
    e.cancelBubble = true;

    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    let minLineDist = Infinity;
    let bestInsertIndex = -1;

    for (let i = 0; i < anchorPairs.length; i++) {
      const p1 = anchorPairs[i];
      const p2 = anchorPairs[(i + 1) % anchorPairs.length];

      const l2 = Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2);
      if (l2 === 0) continue;

      let t = ((pos.x - p1[0]) * (p2[0] - p1[0]) + (pos.y - p1[1]) * (p2[1] - p1[1])) / l2;
      t = Math.max(0, Math.min(1, t));
      const projX = p1[0] + t * (p2[0] - p1[0]);
      const projY = p1[1] + t * (p2[1] - p1[1]);
      const dist = Math.hypot(pos.x - projX, pos.y - projY);

      if (dist < minLineDist) {
        minLineDist = dist;
        bestInsertIndex = i + 1;
      }
    }

    if (bestInsertIndex !== -1 && minLineDist < 15) {
      const newPts = [...pts];
      newPts.splice(bestInsertIndex * 2, 0, pos.x, pos.y);
      updateRoomPoints(room.id, newPts);
    }
  };

  // ── Drag & Transform ─────────────────────────────────────────────

  const groupDragBoundFunc = (pos: { x: number; y: number }) => {
    const dx = pos.x;
    const dy = pos.y;
    let bestDx = dx;
    let bestDy = dy;
    let minD = SNAP_DIST;

    for (let i = 0; i < pts.length; i += 2) {
      const curX = pts[i] + dx;
      const curY = pts[i + 1] + dy;

      for (const r of otherRooms) {
        const rpts = r.polygonPoints;
        for (let j = 0; j < rpts.length; j += 2) {
          const rx = rpts[j];
          const ry = rpts[j + 1];
          const dist = Math.hypot(rx - curX, ry - curY);
          if (dist < minD) {
            minD = dist;
            bestDx = rx - pts[i];
            bestDy = ry - pts[i + 1];
          }
        }
      }
    }
    return { x: bestDx, y: bestDy };
  };

  const bakeTransform = (node: any) => {
    const transform = node.getTransform();
    const newPoints = [];
    for (let i = 0; i < pts.length; i += 2) {
      const point = transform.point({ x: pts[i], y: pts[i + 1] });
      newPoints.push(point.x, point.y);
    }
    // Reset node
    node.setAttrs({
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    });
    updateRoomPoints(room.id, newPoints);
  };

  const handleGroupDragEnd = (e: KonvaEventObject<DragEvent>) => {
    if (e.target.name() !== 'room-group') return;
    bakeTransform(e.target);
  };

  const handleTransformEnd = (e: KonvaEventObject<Event>) => {
    bakeTransform(e.target);
  };

  const anchorDragBoundFunc = (pos: { x: number; y: number }) => {
    let snapX = pos.x;
    let snapY = pos.y;
    let minD = SNAP_DIST;

    for (const r of otherRooms) {
      const rpts = r.polygonPoints;
      for (let j = 0; j < rpts.length; j += 2) {
        const rx = rpts[j];
        const ry = rpts[j + 1];
        const dist = Math.hypot(rx - pos.x, ry - pos.y);
        if (dist < minD) {
          minD = dist;
          snapX = rx;
          snapY = ry;
        }
      }
    }
    return { x: snapX, y: snapY };
  };

  const handleAnchorDrag = (index: number, e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const newPoints = [...pts];
    newPoints[index * 2] = e.target.x();
    newPoints[index * 2 + 1] = e.target.y();
    updateRoomPoints(room.id, newPoints);
  };

  return (
    <Group
      name="room-group"
      ref={shapeRef}
      draggable={isSelected && canvasMode === 'select'}
      dragBoundFunc={groupDragBoundFunc}
      onDragEnd={handleGroupDragEnd}
      onTransformEnd={handleTransformEnd}
      onClick={handleClick}
      onTap={handleClick as any}
    >
      <Line
        points={pts}
        closed
        fill={isSelected ? '#e0f2fe' : '#f0f9ff'}
        stroke={isSelected ? '#38bdf8' : '#cbd5e1'}
        strokeWidth={isSelected ? 2 : 1.5}
        hitStrokeWidth={15}
        onDblClick={handleLineDblClick}
        onDblTap={handleLineDblClick as any}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container && isSelected) container.style.cursor = 'move';
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'default';
        }}
      />

      <Text
        x={cx - 30}
        y={cy - 6}
        width={60}
        align="center"
        text={room.name}
        fontSize={11}
        fontFamily="Inter, system-ui, sans-serif"
        fill="#64748b"
        listening={false}
      />

      {isSelected &&
        anchorPairs.map(([ax, ay], i) => (
          <Circle
            key={i}
            name="anchor"
            x={ax}
            y={ay}
            radius={5}
            fill="#ffffff"
            stroke="#0ea5e9"
            strokeWidth={2}
            draggable
            dragBoundFunc={anchorDragBoundFunc}
            onDragMove={(e) => handleAnchorDrag(i, e)}
            onDragEnd={(e) => (e.cancelBubble = true)}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'grab';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          />
        ))}

      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          flipEnabled={false}
          enabledAnchors={[
            'top-left',
            'top-center',
            'top-right',
            'middle-right',
            'middle-left',
            'bottom-left',
            'bottom-center',
            'bottom-right',
          ]}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </Group>
  );
}
