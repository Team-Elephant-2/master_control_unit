'use client';

import React from 'react';
import { Line, Circle, Group } from 'react-konva';

interface DrawingPipeProps {
  points: number[];
}

export default function DrawingPipe({ points }: DrawingPipeProps) {
  if (points.length < 2) return null;

  // Extract joint positions as pairs
  const joints: [number, number][] = [];
  for (let i = 0; i < points.length; i += 2) {
    joints.push([points[i], points[i + 1]]);
  }

  return (
    <Group>
      {/* In-progress dashed pipe */}
      <Line
        points={points}
        stroke="#3b82f6"
        strokeWidth={3}
        dash={[8, 4]}
        lineCap="round"
        lineJoin="round"
        opacity={0.7}
      />

      {/* Joint dots for placed points */}
      {joints.map(([jx, jy], i) => (
        <Circle
          key={i}
          x={jx}
          y={jy}
          radius={4}
          fill="#dbeafe"
          stroke="#3b82f6"
          strokeWidth={2}
        />
      ))}
    </Group>
  );
}
