import { PanelInstance, RouteOptions, RoutingResult } from '@/types';

export function calculateRouting(panels: PanelInstance[], options: RouteOptions): RoutingResult {
  if (panels.length === 0) return { panels: [], totalPorts: 0, connections: [] };

  // Determine grid boundaries
  const xs = panels.map(p => p.position.x);
  const ys = panels.map(p => p.position.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // Group panels into rows and columns based on their positions
  // Assuming positions are on a grid. To handle slight offsets, we could round or use a tolerance.
  // For this algorithm, we'll sort based on x and y coordinates.
  
  let sortedPanels = [...panels];

  const sortVertical = (a: PanelInstance, b: PanelInstance) => a.position.y - b.position.y;
  const sortHorizontal = (a: PanelInstance, b: PanelInstance) => a.position.x - b.position.x;
  
  const sortVerticalDesc = (a: PanelInstance, b: PanelInstance) => b.position.y - a.position.y;
  const sortHorizontalDesc = (a: PanelInstance, b: PanelInstance) => b.position.x - a.position.x;

  // Group by primary axis to create "lines" of panels
  // If direction is horizontal, lines are rows (same y)
  // If direction is vertical, lines are columns (same x)

  // First, cluster panels into rows/cols (assuming grid snapping)
  const tolerance = 50; // pixels of tolerance for snapping
  
  if (options.direction === 'horizontal') {
    // Group by Y
    const rows: { y: number, panels: PanelInstance[] }[] = [];
    for (const p of sortedPanels) {
      const row = rows.find(r => Math.abs(r.y - p.position.y) < tolerance);
      if (row) {
        row.panels.push(p);
      } else {
        rows.push({ y: p.position.y, panels: [p] });
      }
    }
    
    // Sort rows top-to-bottom or bottom-to-top
    if (options.startPoint.startsWith('top')) {
      rows.sort((a, b) => a.y - b.y);
    } else {
      rows.sort((a, b) => b.y - a.y);
    }

    // Sort panels inside each row
    let leftToRight = options.startPoint.endsWith('left');
    
    sortedPanels = [];
    for (const row of rows) {
      row.panels.sort(leftToRight ? sortHorizontal : sortHorizontalDesc);
      sortedPanels.push(...row.panels);
      // alternate direction for snake
      leftToRight = !leftToRight; 
    }
  } else {
    // Group by X
    const cols: { x: number, panels: PanelInstance[] }[] = [];
    for (const p of sortedPanels) {
      const col = cols.find(c => Math.abs(c.x - p.position.x) < tolerance);
      if (col) {
        col.panels.push(p);
      } else {
        cols.push({ x: p.position.x, panels: [p] });
      }
    }

    // Sort cols left-to-right or right-to-left
    if (options.startPoint.endsWith('left')) {
      cols.sort((a, b) => a.x - b.x);
    } else {
      cols.sort((a, b) => b.x - a.x);
    }

    // Sort panels inside each col
    let topToBottom = options.startPoint.startsWith('top');
    
    sortedPanels = [];
    for (const col of cols) {
      col.panels.sort(topToBottom ? sortVertical : sortVerticalDesc);
      sortedPanels.push(...col.panels);
      // alternate direction for snake
      topToBottom = !topToBottom;
    }
  }

  // Now assign ports and calculate route connections
  let currentPort = 1;
  let currentPixels = 0;
  
  const resultPanels: PanelInstance[] = [];
  const connections: { from: PanelInstance, to: PanelInstance, portId: number }[] = [];
  
  for (let i = 0; i < sortedPanels.length; i++) {
    const p = sortedPanels[i];
    const panelPixels = p.model.resolucaoX * p.model.resolucaoY;

    if (currentPixels + panelPixels > options.portLimit && currentPixels > 0) {
      currentPort++;
      currentPixels = 0;
    }

    const updatedPanel = { ...p, portId: currentPort, sequenceId: i + 1 };
    resultPanels.push(updatedPanel);
    currentPixels += panelPixels;

    // Create connection if not the first panel in port
    if (i > 0 && resultPanels[i - 1].portId === currentPort) {
      connections.push({
        from: resultPanels[i - 1],
        to: updatedPanel,
        portId: currentPort
      });
    }
  }

  return {
    panels: resultPanels,
    totalPorts: currentPort,
    connections
  };
}
