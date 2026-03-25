'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { Line, Circle, Text, Group, Transformer } from 'react-konva';
import { useAppStore } from '@/store/useAppStore';
import type { Room } from '@/store/useAppStore';
import type { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { getRelativePointerPosition } from '@/utils/geometry';

interface RoomShapeProps {
  room: Room;
  opacity?: number;
}

const SNAP_DIST = 15;

export default function RoomShape({ room, opacity = 1 }: { room: Room, opacity?: number }) {
  const lineRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  const isSelected = useAppStore((s) => s.selectedId === room.id);
  const canvasMode = useAppStore((s) => s.canvasMode);
  const tracingMode = useAppStore((s) => s.tracingMode);
  const setSelectedId = useAppStore((s) => s.setSelectedId);
  const updateRoomPoints = useAppStore((s) => s.updateRoomPoints);
  const renameRoom = useAppStore((s) => s.renameRoom);
  const allRooms = useAppStore((s) => s.rooms);
  const setFocusedRoomId = useAppStore((s) => s.setFocusedRoomId);
  const sensors = useAppStore((s) => s.sensors);

  const isLeaking = sensors.some((s) => s.roomId === room.id && s.type === 'water_drop' && s.isWet);

  const pts = room.polygonPoints;

  // ── Transformer attachment ────────────────────────────────────────

  useEffect(() => {
    if (isSelected && trRef.current && lineRef.current) {
      trRef.current.nodes([lineRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // ── Leak Animation ────────────────────────────────────────────────

  useEffect(() => {
    if (!lineRef.current) return;

    if (!isLeaking) {
      lineRef.current.fill(isSelected ? '#e0f2fe' : '#f0f9ff');
      lineRef.current.stroke(isSelected ? '#38bdf8' : '#cbd5e1');
      lineRef.current.getLayer()?.batchDraw();
      return;
    }

    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      const alpha = 0.1 + Math.abs(Math.sin(frame.time * 0.003)) * 0.3;
      lineRef.current.fill(`rgba(239, 68, 68, ${alpha})`);
      lineRef.current.stroke('rgba(239, 68, 68, 0.8)');
    }, lineRef.current.getLayer());

    anim.start();
    return () => {
      anim.stop();
      if (lineRef.current) {
        lineRef.current.fill(isSelected ? '#e0f2fe' : '#f0f9ff');
        lineRef.current.stroke(isSelected ? '#38bdf8' : '#cbd5e1');
        lineRef.current.getLayer()?.batchDraw();
      }
    };
  }, [isLeaking, isSelected]);

  // ── Helpers ──────────────────────────────────────────────────────

  const otherRooms = useMemo(() =>
    allRooms.filter((r) => r.id !== room.id && r.floorId === room.floorId),
    [allRooms, room.id, room.floorId]
  );

  const anchorPairs: [number, number][] = useMemo(() => {
    const pairs: [number, number][] = [];
    for (let i = 0; i < pts.length; i += 2) {
      pairs.push([pts[i], pts[i + 1]]);
    }
    return pairs;
  }, [pts]);

  const cx = anchorPairs.reduce((s, p) => s + p[0], 0) / Math.max(1, anchorPairs.length);
  const cy = anchorPairs.reduce((s, p) => s + p[1], 0) / Math.max(1, anchorPairs.length);

  // Bounding box for snapping
  const bounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < pts.length; i += 2) {
      minX = Math.min(minX, pts[i]);
      maxX = Math.max(maxX, pts[i]);
      minY = Math.min(minY, pts[i + 1]);
      maxY = Math.max(maxY, pts[i + 1]);
    }
    return { minX, maxX, minY, maxY };
  }, [pts]);

  // ── Handlers ──────────────────────────────────────────────────────

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (canvasMode !== 'select') return;
    e.cancelBubble = true;
    setSelectedId(room.id);
    setFocusedRoomId(room.id);
  };

  const handleLineDblClick = (e: KonvaEventObject<MouseEvent>) => {
    if (canvasMode !== 'select') return;
    e.cancelBubble = true;

    const stage = e.target.getStage();
    if (!stage) return;
    const pos = getRelativePointerPosition(stage);
    if (!pos) return;

    // Determine if we're near the border
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

    if (minLineDist < 20) {
      if (isSelected && bestInsertIndex !== -1) {
        const newPts = [...pts];
        newPts.splice(bestInsertIndex * 2, 0, pos.x, pos.y);
        updateRoomPoints(room.id, newPts);
      }
    }
  };

  // ── Drag & Transform ─────────────────────────────────────────────

  const bakeTransform = (node: any) => {
    const stage = node.getStage();
    if (!stage) return;
    const absTransform = node.getAbsoluteTransform();
    const stageAbsInverted = stage.getAbsoluteTransform().copy().invert();
    const newPoints: number[] = [];
    for (let i = 0; i < pts.length; i += 2) {
      const absPos = absTransform.point({ x: pts[i], y: pts[i + 1] });
      const stagePos = stageAbsInverted.point(absPos);
      newPoints.push(stagePos.x, stagePos.y);
    }
    node.setAttrs({ x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 });
    updateRoomPoints(room.id, newPoints);
  };

  const groupDragBoundFunc = (pos: { x: number; y: number }) => {
    let bestX = pos.x;
    let bestY = pos.y;
    let minDiffX = SNAP_DIST;
    let minDiffY = SNAP_DIST;

    const myEdgesX = [bounds.minX + pos.x, bounds.maxX + pos.x];
    const myEdgesY = [bounds.minY + pos.y, bounds.maxY + pos.y];

    for (const r of otherRooms) {
      // Calculate other room's bounds
      let ominX = Infinity, omaxX = -Infinity, ominY = Infinity, omaxY = -Infinity;
      for (let j = 0; j < r.polygonPoints.length; j += 2) {
        ominX = Math.min(ominX, r.polygonPoints[j]);
        omaxX = Math.max(omaxX, r.polygonPoints[j]);
        ominY = Math.min(ominY, r.polygonPoints[j + 1]);
        omaxY = Math.max(omaxY, r.polygonPoints[j + 1]);
      }

      const oEdgesX = [ominX, omaxX];
      const oEdgesY = [ominY, omaxY];

      // Check X snaps (move horizontal)
      for (const myX of myEdgesX) {
        for (const oX of oEdgesX) {
          const diff = Math.abs(myX - oX);
          if (diff < minDiffX) {
            minDiffX = diff;
            bestX = pos.x + (oX - myX);
          }
        }
      }

      // Check Y snaps (move vertical)
      for (const myY of myEdgesY) {
        for (const oY of oEdgesY) {
          const diff = Math.abs(myY - oY);
          if (diff < minDiffY) {
            minDiffY = diff;
            bestY = pos.y + (oY - myY);
          }
        }
      }
    }

    return { x: bestX, y: bestY };
  };

  return (
    <Group
      name="room-group"
      draggable={canvasMode === 'select'}
      dragBoundFunc={groupDragBoundFunc}
      opacity={tracingMode ? 0.8 : opacity}
      onDragEnd={(e) => {
        if (e.target.name() === 'room-group') bakeTransform(e.target);
      }}
      onClick={handleClick}
      onTap={handleClick as any}
      onDblClick={handleLineDblClick}
      onDblTap={handleLineDblClick as any}
    >
      <Line
        ref={lineRef}
        points={pts}
        closed
        fill={tracingMode ? 'transparent' : (isSelected ? '#e0f2fe' : '#f0f9ff')}
        stroke={isSelected ? '#38bdf8' : '#cbd5e1'}
        strokeWidth={isSelected ? 2 : 1.5}
        hitStrokeWidth={25}
        onTransformEnd={(e) => bakeTransform(e.target)}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container && canvasMode === 'select') {
            container.style.cursor = isSelected ? 'move' : 'pointer';
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'default';
        }}
      />

      <Text
        x={cx - 50}
        y={cy - 6}
        width={100}
        align="center"
        text={room.name}
        fontSize={11}
        fontFamily="Inter, system-ui, sans-serif"
        fill="#64748b"
        listening={false}
      />

      {isSelected && (
        <>
          {anchorPairs.map(([ax, ay], i) => (
            <Circle
              key={i}
              x={ax}
              y={ay}
              radius={5}
              fill="#ffffff"
              stroke="#0ea5e9"
              strokeWidth={2}
              draggable
              onDragMove={(e) => {
                const newPoints = [...pts];
                newPoints[i * 2] = e.target.x();
                newPoints[i * 2 + 1] = e.target.y();
                updateRoomPoints(room.id, newPoints);
              }}
              onDragEnd={(e) => (e.cancelBubble = true)}
              onMouseEnter={(e) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = 'grab';
              }}
              onMouseLeave={(e) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = 'default';
              }}
            />
          ))}
          <Transformer
            ref={trRef}
            rotateEnabled={false}
            flipEnabled={false}
            enabledAnchors={['top-center', 'middle-right', 'middle-left', 'bottom-center']}
            boundBoxFunc={(oldBox, newBox) => {
              if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) return oldBox;
              return newBox;
            }}
          />
        </>
      )}
    </Group>
  );
}
