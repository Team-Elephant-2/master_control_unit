'use client';

import React from 'react';
import { Line, Circle, Text, Group } from 'react-konva';
import { useAppStore } from '@/store/useAppStore';
import type { Room } from '@/store/useAppStore';
import type { KonvaEventObject } from 'konva/lib/Node';

interface RoomShapeProps {
  room: Room;
}

export default function RoomShape({ room }: RoomShapeProps) {
  const canvasMode = useAppStore((s) => s.canvasMode);
  const selectedRoomId = useAppStore((s) => s.selectedRoomId);
  const setSelectedRoom = useAppStore((s) => s.setSelectedRoom);
  const updateRoomPoints = useAppStore((s) => s.updateRoomPoints);

  const isSelected = selectedRoomId === room.id;
  const pts = room.polygonPoints;

  // Convert flat array to pairs for anchor rendering
  const anchorPairs: [number, number][] = [];
  for (let i = 0; i < pts.length; i += 2) {
    anchorPairs.push([pts[i], pts[i + 1]]);
  }

  // Compute centroid for the label
  const cx = anchorPairs.reduce((s, p) => s + p[0], 0) / anchorPairs.length;
  const cy = anchorPairs.reduce((s, p) => s + p[1], 0) / anchorPairs.length;

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (canvasMode !== 'select') return;
    e.cancelBubble = true;
    setSelectedRoom(room.id);
  };

  const handleAnchorDrag = (index: number, e: KonvaEventObject<DragEvent>) => {
    const newPoints = [...pts];
    newPoints[index * 2] = e.target.x();
    newPoints[index * 2 + 1] = e.target.y();
    updateRoomPoints(room.id, newPoints);
  };

  return (
    <Group>
      {/* Room polygon fill */}
      <Line
        points={pts}
        closed
        fill={isSelected ? '#e0f2fe' : '#f0f9ff'}
        stroke={isSelected ? '#38bdf8' : '#cbd5e1'}
        strokeWidth={isSelected ? 2 : 1.5}
        onClick={handleClick}
        onTap={handleClick}
        hitStrokeWidth={12}
      />

      {/* Room label */}
      <Text
        x={cx - 30}
        y={cy - 6}
        width={60}
        align="center"
        text={room.name}
        fontSize={11}
        fontFamily="Inter, system-ui, sans-serif"
        fill="#64748b"
      />

      {/* Draggable anchor points (only when selected) */}
      {isSelected &&
        anchorPairs.map(([ax, ay], i) => (
          <Circle
            key={i}
            x={ax}
            y={ay}
            radius={5}
            fill="#ffffff"
            stroke="#0ea5e9"
            strokeWidth={2}
            draggable
            onDragMove={(e) => handleAnchorDrag(i, e)}
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
    </Group>
  );
}
