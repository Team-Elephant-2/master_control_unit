'use client';

import React from 'react';
import { Line, Circle, Group } from 'react-konva';
import { useAppStore } from '@/store/useAppStore';
import type { Pipe } from '@/store/useAppStore';
import type { KonvaEventObject } from 'konva/lib/Node';

interface PipeShapeProps {
  pipe: Pipe;
}

export default function PipeShape({ pipe }: PipeShapeProps) {
  const canvasMode = useAppStore((s) => s.canvasMode);
  const selectedId = useAppStore((s) => s.selectedId);
  const setSelectedId = useAppStore((s) => s.setSelectedId);

  const isSelected = selectedId === pipe.id;
  const pts = pipe.points;

  // Extract joint positions as pairs
  const joints: [number, number][] = [];
  for (let i = 0; i < pts.length; i += 2) {
    joints.push([pts[i], pts[i + 1]]);
  }

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (canvasMode !== 'select') return;
    e.cancelBubble = true; // Prevent stage click from deselecting
    setSelectedId(pipe.id);
  };

  return (
    <Group onClick={handleClick} onTap={handleClick as any}>
      {/* Selection highlight backdrop */}
      {isSelected && (
        <Line
          points={pts}
          stroke="#bae6fd" // sky-200 highlight
          strokeWidth={10}
          lineCap="round"
          lineJoin="round"
        />
      )}

      {/* Pipe polyline */}
      <Line
        points={pts}
        stroke="#3b82f6"
        strokeWidth={4}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={15} // Make clicking easier
      />

      {/* Joint connectors */}
      {joints.map(([jx, jy], i) => (
        <Circle
          key={i}
          x={jx}
          y={jy}
          radius={5}
          fill="#ffffff"
          stroke={isSelected ? '#0284c7' : '#3b82f6'}
          strokeWidth={2}
          hitStrokeWidth={10}
        />
      ))}
    </Group>
  );
}
