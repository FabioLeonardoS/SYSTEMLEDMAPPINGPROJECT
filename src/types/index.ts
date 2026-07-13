import { PanelModel } from '@/lib/api';

export interface Position {
  x: number;
  y: number;
}

export interface PanelInstance {
  id: string; // unique identifier
  model: PanelModel;
  position: Position; // Logical grid position (col, row) or physical coordinates
  portId?: number; // Assigned port after routing
  sequenceId?: number; // Sequence in the snake route
}

export type RoutingDirection = 'horizontal' | 'vertical';
export type StartPoint = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface RouteOptions {
  direction: RoutingDirection;
  startPoint: StartPoint;
  portLimit: number; // default 655360
  redundancy: boolean;
}

export interface RoutingResult {
  panels: PanelInstance[]; // Updated panels with portId and sequenceId
  totalPorts: number;
  connections: { from: PanelInstance, to: PanelInstance, portId: number }[];
}
