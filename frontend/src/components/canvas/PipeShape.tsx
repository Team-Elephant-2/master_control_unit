'use client';

import React from 'react';
import { Line, Circle, Group } from 'react-konva';
import Konva from 'konva';
import { useAppStore } from '@/store/useAppStore';
import type { Pipe } from '@/store/useAppStore';
import type { KonvaEventObject } from 'konva/lib/Node';

interface PipeShapeProps {
  pipe: Pipe;
  opacity?: number;
  isFlowing: boolean;
}

export default function PipeShape({ pipe, isFlowing, opacity = 1 }: PipeShapeProps) {
  const isSelected = useAppStore((s) => s.selectedId === pipe.id);
  const setSelectedId = useAppStore((s) => s.setSelectedId);
  const canvasMode = useAppStore((s) => s.canvasMode);
  const tracingMode = useAppStore((s) => s.tracingMode);
  const updatePipePoints = useAppStore((s) => s.updatePipePoints);

  const pts = pipe.points;

  // Compute total length
  const length = React.useMemo(() => {
    let len = 0;
    for (let i = 0; i < pts.length - 2; i += 2) {
      len += Math.hypot(pts[i + 2] - pts[i], pts[i + 3] - pts[i + 1]);
    }
    return len;
  }, [pts]);

  const fgRef = React.useRef<Konva.Line>(null);
  const tweenRef = React.useRef<Konva.Tween | null>(null);

  React.useEffect(() => {
    const node = fgRef.current;
    if (!node) return;

    // Set initial dashOffset if length is known
    if (tweenRef.current) {
        tweenRef.current.destroy();
        tweenRef.current = null;
    }

    if (isFlowing) {
      tweenRef.current = new Konva.Tween({
        node,
        duration: 0.6,
        dashOffset: 0,
        easing: Konva.Easings.EaseOut
      });
    } else {
      // Receding from start: dashOffset moves from 0 to -L 
      // with dash pattern [L, L] (full, empty)
      tweenRef.current = new Konva.Tween({
        node,
        duration: 2.2,
        dashOffset: -length,
        easing: Konva.Easings.EaseInOut
      });
    }
    
    tweenRef.current.play();

    return () => {
        if (tweenRef.current) {
            tweenRef.current.destroy();
            tweenRef.current = null;
        }
    };
  }, [isFlowing, length]);

  // Extract joint positions as pairs
  const joints: [number, number][] = [];
  for (let i = 0; i < pts.length; i += 2) {
    joints.push([pts[i], pts[i + 1]]);
  }

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (canvasMode !== 'select') return;
    e.cancelBubble = true;
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
    <Group onClick={handleClick} onTap={handleClick as any} opacity={opacity}>
      {isSelected && (
        <Line
          points={pts}
          stroke="#bae6fd"
          strokeWidth={10}
          lineCap="round"
          lineJoin="round"
        />
      )}

      {/* Background Pipe (Empty Slate) */}
      <Line
        points={pts}
        stroke="#e2e8f0"
        strokeWidth={tracingMode ? 2 : 4}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={15}
        onDblClick={handleLineDblClick}
        onDblTap={handleLineDblClick as any}
      />

      {/* Foreground Pipe (Flowing Blue) */}
      <Line
        ref={fgRef as any}
        points={pts}
        stroke="#3b82f6"
        strokeWidth={tracingMode ? 2 : 4}
        lineCap="round"
        lineJoin="round"
        dash={[length, length]}
        listening={false} // Ignore clicks to let background catch them
      />

      {/* Joint connectors */}
      {joints.map(([jx, jy], i) => (
        <Circle
          key={i}
          x={jx}
          y={jy}
          radius={isSelected ? 6 : 5}
          fill={isSelected ? '#3b82f6' : isFlowing ? '#ffffff' : '#f1f5f9'}
          stroke={isSelected ? '#ffffff' : isFlowing ? '#3b82f6' : '#cbd5e1'}
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
