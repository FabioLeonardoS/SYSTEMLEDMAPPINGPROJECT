import { create } from 'zustand';
import { PanelModel } from '@/lib/api';
import { PanelInstance, RouteOptions, RoutingResult } from '@/types';
import { calculateRouting } from '@/lib/routing';

interface AppState {
  inventory: PanelModel[];
  setInventory: (inventory: PanelModel[]) => void;
  
  selectedModel: PanelModel | null;
  setSelectedModel: (model: PanelModel | null) => void;
  
  panels: PanelInstance[];
  setPanels: (panels: PanelInstance[]) => void;
  addPanel: (panel: PanelInstance) => void;
  removePanel: (id: string) => void;
  clearPanels: () => void;
  updatePanelPosition: (id: string, x: number, y: number) => void;

  routeOptions: RouteOptions;
  setRouteOptions: (options: Partial<RouteOptions>) => void;
  
  routingResult: RoutingResult | null;
  calculateRoutes: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  inventory: [],
  setInventory: (inventory) => set({ inventory }),
  
  selectedModel: null,
  setSelectedModel: (model) => set({ selectedModel: model }),
  
  panels: [],
  setPanels: (panels) => set({ panels, routingResult: null }),
  addPanel: (panel) => set((state) => ({ panels: [...state.panels, panel], routingResult: null })),
  removePanel: (id) => set((state) => ({ panels: state.panels.filter(p => p.id !== id), routingResult: null })),
  clearPanels: () => set({ panels: [], routingResult: null }),
  updatePanelPosition: (id, x, y) => set((state) => ({
    panels: state.panels.map(p => p.id === id ? { ...p, position: { x, y } } : p),
    routingResult: null
  })),

  routeOptions: {
    direction: 'horizontal',
    startPoint: 'bottom-left',
    portLimit: 655360,
    redundancy: false,
  },
  setRouteOptions: (options) => set((state) => ({
    routeOptions: { ...state.routeOptions, ...options },
    routingResult: null
  })),

  routingResult: null,
  calculateRoutes: () => {
    const { panels, routeOptions } = get();
    if (panels.length === 0) return;
    const result = calculateRouting(panels, routeOptions);
    set({ routingResult: result });
  }
}));
