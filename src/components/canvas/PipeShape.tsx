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
  const updatePipePoints = useAppStore((s) => s.updatePipePoints);

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

  const handleLineDblClick = (e: KonvaEventObject<MouseEvent>) => {
    if (canvasMode !== 'select' || !isSelected) return;
    e.cancelBubble = true;

    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    let minLineDist = Infinity;
    let bestInsertIndex = -1;

    // Find the closest line segment
    for (let i = 0; i < joints.length - 1; i++) {
        const p1 = joints[i];
        const p2 = joints[i + 1];

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

    if (bestInsertIndex !== -1 && minLineDist < 20) {
        const newPts = [...pts];
        newPts.splice(bestInsertIndex * 2, 0, pos.x, pos.y);
        updatePipePoints(pipe.id, newPts);
    }
  };

  const handleAnchorDrag = (index: number, e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const newPoints = [...pts];
    newPoints[index * 2] = e.target.x();
    newPoints[index * 2 + 1] = e.target.y();
    updatePipePoints(pipe.id, newPoints);
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
        onDblClick={handleLineDblClick}
        onDblTap={handleLineDblClick as any}
      />

      {/* Joint connectors */}
      {joints.map(([jx, jy], i) => (
        <Circle
          key={i}
          x={jx}
          y={jy}
          radius={isSelected ? 6 : 5}
          fill={isSelected ? '#3b82f6' : '#ffffff'}
          stroke={isSelected ? '#ffffff' : '#3b82f6'}
          strokeWidth={2}
          hitStrokeWidth={10}
          draggable={isSelected && canvasMode === 'select'}
          onDragMove={(e) => handleAnchorDrag(i, e)}
          onDragEnd={(e) => (e.cancelBubble = true)}
          onMouseEnter={(e) => {
            const container = e.target.getStage()?.container();
            if (container && isSelected) container.style.cursor = 'grab';
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
