'use client';

import React from 'react';
import { Line, Circle, Group } from 'react-konva';
import type { Pipe } from '@/store/useAppStore';

interface PipeShapeProps {
  pipe: Pipe;
}

export default function PipeShape({ pipe }: PipeShapeProps) {
  const pts = pipe.points;

  // Extract joint positions as pairs
  const joints: [number, number][] = [];
  for (let i = 0; i < pts.length; i += 2) {
    joints.push([pts[i], pts[i + 1]]);
  }

  return (
    <Group>
      {/* Pipe polyline */}
      <Line
        points={pts}
        stroke="#3b82f6"
        strokeWidth={4}
        lineCap="round"
        lineJoin="round"
      />

      {/* Joint connectors */}
      {joints.map(([jx, jy], i) => (
        <Circle
          key={i}
          x={jx}
          y={jy}
          radius={5}
          fill="#ffffff"
          stroke="#3b82f6"
          strokeWidth={2}
        />
      ))}
    </Group>
  );
}
