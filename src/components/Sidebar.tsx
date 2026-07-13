'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { fetchPanelInventory, PanelModel } from '@/lib/api';
import { PanelInstance } from '@/types';
import { Settings, Download, Monitor, Grid as GridIcon, AlertTriangle, Zap, Activity, Maximize, Weight } from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar({ onExportPDF, onExportPNG }: { onExportPDF: () => void, onExportPNG: () => void }) {
  const { 
    inventory, setInventory, 
    selectedModel, setSelectedModel,
    panels, setPanels,
    routeOptions, setRouteOptions,
    calculateRoutes, routingResult
  } = useStore();

  const [cols, setCols] = useState(5);
  const [rows, setRows] = useState(3);
  const [customPortLimit, setCustomPortLimit] = useState(655360);
  const [showOverrideWarning, setShowOverrideWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInventory() {
      const data = await fetchPanelInventory();
      setInventory(data);
      if (data.length > 0) {
        setSelectedModel(data[0]);
      }
      setIsLoading(false);
    }
    loadInventory();
  }, [setInventory, setSelectedModel]);

  // Derived Dashboard Stats
  const totalPixels = panels.reduce((acc, p) => acc + (p.model.resolucaoX * p.model.resolucaoY), 0);
  const totalWeight = panels.reduce((acc, p) => acc + p.model.pesoKg, 0);
  const totalConsumoMedio = panels.reduce((acc, p) => acc + p.model.consumoMedioW, 0);
  const totalConsumoMaximo = panels.reduce((acc, p) => acc + p.model.consumoMaximoW, 0);
  
  // Calculate total dimensions based on bounding box
  let totalWidthMm = 0;
  let totalHeightMm = 0;
  if (panels.length > 0) {
    const minX = Math.min(...panels.map(p => p.position.x));
    const maxX = Math.max(...panels.map(p => p.position.x));
    const minY = Math.min(...panels.map(p => p.position.y));
    const maxY = Math.max(...panels.map(p => p.position.y));
    
    // Convert canvas coordinates back to grid logical blocks or just use raw values
    // Here we approximate based on the panel width
    if (selectedModel) {
      totalWidthMm = ((maxX - minX) / 100 + 1) * selectedModel.larguraMm;
      totalHeightMm = ((maxY - minY) / 100 + 1) * selectedModel.alturaMm;
    }
  }

  const generateGrid = () => {
    if (!selectedModel) return;
    
    const newPanels: PanelInstance[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        newPanels.push({
          id: `panel-${r}-${c}-${Date.now()}`,
          model: selectedModel,
          position: { x: c * 100, y: r * 100 } // 100 is the visual block size on canvas
        });
      }
    }
    setPanels(newPanels);
  };

  const handlePortLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setCustomPortLimit(val);
    setRouteOptions({ portLimit: val });
    if (val > 655360) {
      setShowOverrideWarning(true);
    } else {
      setShowOverrideWarning(false);
    }
  };

  if (isLoading) return <div className="w-80 bg-gray-900 text-white p-4 h-full flex flex-col items-center justify-center">Loading inventory...</div>;

  return (
    <div className="w-96 bg-gray-900 text-gray-100 p-6 h-full flex flex-col gap-6 overflow-y-auto border-r border-gray-800 shadow-xl">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Monitor className="text-blue-500" />
          LED Router PWA
        </h1>
        <p className="text-sm text-gray-400 mt-1">Configuração e Roteamento</p>
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-300">Modelo do Painel</label>
        <select 
          className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
          value={selectedModel?.modelo || ''}
          onChange={(e) => setSelectedModel(inventory.find(i => i.modelo === e.target.value) || null)}
        >
          {inventory.map(item => (
            <option key={item.modelo} value={item.modelo}>{item.modelo} ({item.resolucaoX}x{item.resolucaoY}px)</option>
          ))}
        </select>
      </div>

      {/* Grid Generator */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-4">
        <div className="flex items-center gap-2 text-gray-200 font-semibold mb-2">
          <GridIcon size={18} /> Geração Uniforme
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs text-gray-400">Colunas (Largura)</label>
            <input type="number" min="1" value={cols} onChange={e => setCols(parseInt(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 mt-1 text-center" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400">Linhas (Altura)</label>
            <input type="number" min="1" value={rows} onChange={e => setRows(parseInt(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 mt-1 text-center" />
          </div>
        </div>
        <button onClick={generateGrid} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors text-sm font-medium">
          Gerar Grid
        </button>
      </div>

      {/* Routing Settings */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-4">
        <div className="flex items-center justify-between text-gray-200 font-semibold">
          <span>Configuração de Rota</span>
          <button 
            onClick={calculateRoutes}
            disabled={panels.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 text-xs rounded transition-colors"
          >
            Calcular Rota
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400">Direção Snake</label>
            <select 
              className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 mt-1 text-sm text-white"
              value={routeOptions.direction}
              onChange={(e) => setRouteOptions({ direction: e.target.value as any })}
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400">Ponto de Início</label>
            <select 
              className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 mt-1 text-sm text-white"
              value={routeOptions.startPoint}
              onChange={(e) => setRouteOptions({ startPoint: e.target.value as any })}
            >
              <option value="bottom-left">Inferior Esquerdo</option>
              <option value="bottom-right">Inferior Direito</option>
              <option value="top-left">Superior Esquerdo</option>
              <option value="top-right">Superior Direito</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400">Limite de Pixels por Porta (Gigabit)</label>
          <input type="number" value={customPortLimit} onChange={handlePortLimitChange} className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 mt-1 text-sm" />
          {showOverrideWarning && (
            <div className="mt-2 text-xs text-yellow-500 flex items-start gap-1 bg-yellow-500/10 p-2 rounded">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>Atenção: Ultrapassar 655.360 px requer redução de frame rate (ex: 30Hz) ou controladora especial. Risco de falha visual! Configure corretamente no NovaLCT.</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
          <input type="checkbox" id="redundancy" checked={routeOptions.redundancy} onChange={e => setRouteOptions({ redundancy: e.target.checked })} className="rounded bg-gray-900 border-gray-700" />
          <label htmlFor="redundancy" className="text-sm text-gray-300">Cálculo de Redundância</label>
        </div>
        {routeOptions.redundancy && (
          <div className="text-xs text-blue-400 bg-blue-400/10 p-2 rounded">
            <strong>Dica:</strong> Para redundância, feche o anel conectando a última porta à secundária ou use portas espelhadas na controladora.
          </div>
        )}
      </div>

      {/* Dashboard Stats */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Dashboard</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 p-3 rounded border border-gray-700">
            <div className="text-gray-500 text-xs flex items-center gap-1 mb-1"><Maximize size={12}/> Resolução</div>
            <div className="font-semibold text-sm">{Math.sqrt((totalWidthMm/1000) * (totalHeightMm/1000) * totalPixels).toFixed(0)}? {panels.length > 0 && selectedModel ? `${(totalWidthMm / selectedModel.larguraMm * selectedModel.resolucaoX).toFixed(0)}x${(totalHeightMm / selectedModel.alturaMm * selectedModel.resolucaoY).toFixed(0)}` : '0x0'} px</div>
            <div className="text-xs text-gray-400 mt-1">Total: {totalPixels.toLocaleString()} px</div>
          </div>
          
          <div className="bg-gray-800 p-3 rounded border border-gray-700">
            <div className="text-gray-500 text-xs flex items-center gap-1 mb-1"><GridIcon size={12}/> Dimensões</div>
            <div className="font-semibold text-sm">{(totalWidthMm / 1000).toFixed(2)} x {(totalHeightMm / 1000).toFixed(2)} m</div>
            <div className="text-xs text-gray-400 mt-1">Área: {((totalWidthMm / 1000) * (totalHeightMm / 1000)).toFixed(2)} m²</div>
          </div>

          <div className="bg-gray-800 p-3 rounded border border-gray-700">
            <div className="text-gray-500 text-xs flex items-center gap-1 mb-1"><Weight size={12}/> Peso</div>
            <div className="font-semibold text-sm">{totalWeight.toFixed(1)} kg</div>
            <div className="text-xs text-gray-400 mt-1">{panels.length} Gabinetes</div>
          </div>

          <div className="bg-gray-800 p-3 rounded border border-gray-700">
            <div className="text-gray-500 text-xs flex items-center gap-1 mb-1"><Zap size={12}/> Energia</div>
            <div className="font-semibold text-sm text-yellow-500">{totalConsumoMaximo} W (Max)</div>
            <div className="text-xs text-gray-400 mt-1">{totalConsumoMedio} W (Médio)</div>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="mt-auto space-y-2 pt-4 border-t border-gray-800">
        <button onClick={onExportPDF} className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/50 py-2 rounded transition-colors text-sm font-medium">
          <Download size={16} /> Exportar PDF
        </button>
        <button onClick={onExportPNG} className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 py-2 rounded transition-colors text-sm font-medium">
          <Download size={16} /> Exportar Mapa PNG
        </button>
      </div>
    </div>
  );
}
