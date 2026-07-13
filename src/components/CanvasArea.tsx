'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Line, Group } from 'react-konva';
import { useStore } from '@/store/useStore';
import { PanelInstance } from '@/types';

// Visual constants
const BLOCK_SIZE = 100; // visual pixels per panel on canvas

const PORT_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export default function CanvasArea({ stageRef }: { stageRef: React.RefObject<any> }) {
  const { panels, updatePanelPosition, routingResult, selectedModel } = useStore();
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const handleDragEnd = (e: any, id: string) => {
    // Grid snapping (BLOCK_SIZE)
    const x = Math.round(e.target.x() / BLOCK_SIZE) * BLOCK_SIZE;
    const y = Math.round(e.target.y() / BLOCK_SIZE) * BLOCK_SIZE;
    
    // update position visually by setting it directly to avoid jitter, then update store
    e.target.position({ x, y });
    updatePanelPosition(id, x, y);
  };

  return (
    <div className="flex-1 bg-gray-950 overflow-hidden relative" ref={containerRef}>
      <Stage width={stageSize.width} height={stageSize.height} ref={stageRef} draggable>
        <Layer>
          {/* Grid lines (optional visual aid) */}
          {Array.from({ length: Math.ceil(stageSize.width / BLOCK_SIZE) * 2 }).map((_, i) => (
            <Line
              key={`v-${i}`}
              points={[i * BLOCK_SIZE - stageSize.width, -stageSize.height, i * BLOCK_SIZE - stageSize.width, stageSize.height * 2]}
              stroke="#1f2937" // gray-800
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: Math.ceil(stageSize.height / BLOCK_SIZE) * 2 }).map((_, i) => (
            <Line
              key={`h-${i}`}
              points={[-stageSize.width, i * BLOCK_SIZE - stageSize.height, stageSize.width * 2, i * BLOCK_SIZE - stageSize.height]}
              stroke="#1f2937"
              strokeWidth={1}
            />
          ))}

          {/* Panels */}
          {panels.map((panel) => {
            const routedPanel = routingResult?.panels.find(p => p.id === panel.id) || panel;
            const portColor = routedPanel.portId 
              ? PORT_COLORS[(routedPanel.portId - 1) % PORT_COLORS.length] 
              : '#374151'; // default unassigned

            return (
              <Group
                key={panel.id}
                x={panel.position.x}
                y={panel.position.y}
                draggable
                onDragEnd={(e) => handleDragEnd(e, panel.id)}
              >
                <Rect
                  width={panel.model.larguraMm / 5}
                  height={panel.model.alturaMm / 5}
                  fill={portColor}
                  opacity={0.8}
                  stroke="#111827"
                  strokeWidth={2}
                  shadowColor="black"
                  shadowBlur={5}
                  shadowOpacity={0.5}
                />
                <Text
                  x={5}
                  y={5}
                  text={routedPanel.portId ? `P${routedPanel.portId}` : ''}
                  fontSize={12}
                  fill="white"
                  fontStyle="bold"
                />
                <Text
                  x={5}
                  y={20}
                  text={routedPanel.sequenceId ? `#${routedPanel.sequenceId}` : ''}
                  fontSize={10}
                  fill="rgba(255,255,255,0.7)"
                />
                <Text
                  x={5}
                  y={(panel.model.alturaMm / 5) - 20}
                  text={`${panel.model.resolucaoX}x${panel.model.resolucaoY}`}
                  fontSize={10}
                  fill="rgba(255,255,255,0.5)"
                />
              </Group>
            );
          })}

          {/* Routing Lines */}
          {routingResult?.connections.map((conn, idx) => {
            const portColor = PORT_COLORS[(conn.portId - 1) % PORT_COLORS.length];
            const fromW = conn.from.model.larguraMm / 5;
            const fromH = conn.from.model.alturaMm / 5;
            const toW = conn.to.model.larguraMm / 5;
            const toH = conn.to.model.alturaMm / 5;
            // Connect centers of blocks
            const points = [
              conn.from.position.x + fromW / 2,
              conn.from.position.y + fromH / 2,
              conn.to.position.x + toW / 2,
              conn.to.position.y + toH / 2,
            ];

            return (
              <Line
                key={`route-${idx}`}
                points={points}
                stroke={portColor}
                strokeWidth={4}
                lineJoin="round"
                lineCap="round"
                dash={[10, 5]}
                opacity={0.9}
              />
            );
          })}
        </Layer>
      </Stage>
      
      {/* Overlay controls */}
      <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur border border-gray-800 p-2 rounded text-xs text-gray-400">
        <p>Arraste para mover o palco. Role para zoom (em breve).</p>
        <p>Arraste os painéis para reposicioná-los.</p>
      </div>
    </div>
  );
}
