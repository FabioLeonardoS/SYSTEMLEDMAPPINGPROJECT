'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Line, Arrow, Group } from 'react-konva';
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
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState({ x: 1, y: 1 });
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

  useEffect(() => {
    // Zoom to fit logic
    if (panels.length === 0 || stageSize.width === 0) return;
    
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    
    panels.forEach(p => {
      const pxLeft = p.position.x;
      const pxRight = p.position.x + (p.model.larguraMm / 5);
      const pxTop = p.position.y;
      const pxBottom = p.position.y + (p.model.alturaMm / 5);
      if (pxLeft < minX) minX = pxLeft;
      if (pxRight > maxX) maxX = pxRight;
      if (pxTop < minY) minY = pxTop;
      if (pxBottom > maxY) maxY = pxBottom;
    });

    const padding = 50;
    const bboxWidth = maxX - minX;
    const bboxHeight = maxY - minY;

    if (bboxWidth > 0 && bboxHeight > 0) {
      const scaleX = (stageSize.width - padding * 2) / bboxWidth;
      const scaleY = (stageSize.height - padding * 2) / bboxHeight;
      const scale = Math.min(scaleX, scaleY, 2); // max zoom 2x
      
      setStageScale({ x: scale, y: scale });
      setStagePos({
        x: (stageSize.width - bboxWidth * scale) / 2 - minX * scale,
        y: (stageSize.height - bboxHeight * scale) / 2 - minY * scale
      });
    } else {
      setStageScale({ x: 1, y: 1 });
      setStagePos({ x: 0, y: 0 });
    }
  }, [panels, stageSize]);

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
      <Stage 
        width={stageSize.width} 
        height={stageSize.height} 
        ref={stageRef} 
        draggable
        x={stagePos.x}
        y={stagePos.y}
        scale={stageScale}
        onDragEnd={(e) => {
          if (e.target === e.target.getStage()) {
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }
        }}
        onWheel={(e) => {
          e.evt.preventDefault();
          const stage = e.target.getStage();
          if (!stage) return;
          const oldScale = stage.scaleX();
          const pointer = stage.getPointerPosition();
          if (!pointer) return;

          const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
          };

          const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
          
          setStageScale({ x: newScale, y: newScale });
          setStagePos({
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
          });
        }}
      >
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
              <Arrow
                key={`route-${idx}`}
                points={points}
                stroke={portColor}
                fill={portColor}
                strokeWidth={6}
                pointerLength={10}
                pointerWidth={10}
                lineJoin="round"
                lineCap="round"
                opacity={1}
                shadowColor="black"
                shadowBlur={3}
                shadowOpacity={0.8}
                shadowOffset={{ x: 1, y: 1 }}
              />
            );
          })}
        </Layer>
      </Stage>
      
      {/* Overlay controls */}
      <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur border border-gray-800 p-2 rounded text-xs text-gray-400">
        <p>Arraste o fundo para mover o palco. Role o mouse para zoom livre.</p>
        <p>Arraste os painéis para reposicioná-los.</p>
      </div>
    </div>
  );
}
