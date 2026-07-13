'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { fetchPanelInventory, PanelModel } from '@/lib/api';
import { PanelInstance } from '@/types';
import { Settings, Download, Monitor, Grid as GridIcon, AlertTriangle, Zap, Activity, Maximize, Weight, Ruler } from 'lucide-react';
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

  // New states for Smart Generation
  const [generationMode, setGenerationMode] = useState<'smart' | 'uniform'>('smart');
  const [widthMeters, setWidthMeters] = useState(3);
  const [heightMeters, setHeightMeters] = useState(2);
  const [selectedPitch, setSelectedPitch] = useState<string>('');

  useEffect(() => {
    async function loadInventory() {
      const data = await fetchPanelInventory();
      setInventory(data);
      if (data.length > 0) {
        setSelectedModel(data[0]);
        setSelectedPitch(data[0].modelo);
      }
      setIsLoading(false);
    }
    loadInventory();
  }, [setInventory, setSelectedModel]);

  const uniquePitches = Array.from(new Set(inventory.map(i => i.modelo)));

  // Derived Dashboard Stats
  const totalPixels = panels.reduce((acc, p) => acc + (p.model.resolucaoX * p.model.resolucaoY), 0);
  const totalWeight = panels.reduce((acc, p) => acc + p.model.pesoKg, 0);
  const totalConsumoMedio = panels.reduce((acc, p) => acc + p.model.consumoMedioW, 0);
  const totalConsumoMaximo = panels.reduce((acc, p) => acc + p.model.consumoMaximoW, 0);
  
  // Calculate total dimensions based on panels physical sizes
  let totalWidthMm = 0;
  let totalHeightMm = 0;
  if (panels.length > 0) {
    // Each panel's bounding box logic
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    
    panels.forEach(p => {
      // position x, y is divided by 5 compared to mm (500mm -> 100px)
      const pxLeft = p.position.x;
      const pxRight = p.position.x + (p.model.larguraMm / 5);
      const pxTop = p.position.y;
      const pxBottom = p.position.y + (p.model.alturaMm / 5);
      
      if (pxLeft < minX) minX = pxLeft;
      if (pxRight > maxX) maxX = pxRight;
      if (pxTop < minY) minY = pxTop;
      if (pxBottom > maxY) maxY = pxBottom;
    });

    // Convert visual pixels back to mm (* 5)
    totalWidthMm = (maxX - minX) * 5;
    totalHeightMm = (maxY - minY) * 5;
  }

  const generateUniformGrid = () => {
    if (!selectedModel) return;
    
    const newPanels: PanelInstance[] = [];
    let currentY = 0;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        newPanels.push({
          id: `panel-${r}-${c}-${Date.now()}`,
          model: selectedModel,
          position: { x: c * (selectedModel.larguraMm / 5), y: currentY }
        });
      }
      currentY += (selectedModel.alturaMm / 5);
    }
    setPanels(newPanels);
  };

  const generateSmartGrid = () => {
    if (!selectedPitch) return;
    
    const modelsOfPitch = inventory.filter(i => i.modelo === selectedPitch);
    
    // Find the 500x1000 and 500x500 versions for the selected pitch
    // Fallback to first available if exactly 1000 or 500 doesn't exist
    let model1000 = modelsOfPitch.find(m => m.alturaMm === 1000 && m.larguraMm === 500);
    let model500 = modelsOfPitch.find(m => m.alturaMm === 500 && m.larguraMm === 500);
    
    if (!model1000 && modelsOfPitch.length > 0) model1000 = modelsOfPitch[0];
    if (!model500 && modelsOfPitch.length > 0) model500 = modelsOfPitch[0];
    
    if (!model1000 || !model500) return;

    // Use selectedModel to keep store happy for other components, though we use Pitch for generation
    setSelectedModel(model1000);

    const colsCount = Math.round(widthMeters / 0.5);
    const targetHeightMm = heightMeters * 1000;
    
    const rows1000 = Math.floor(targetHeightMm / 1000);
    const remainder = targetHeightMm % 1000;
    const has500Row = remainder > 0; 

    const newPanels: PanelInstance[] = [];
    let currentY = 0;
    
    // Build rows 1000mm
    for (let r = 0; r < rows1000; r++) {
      for (let c = 0; c < colsCount; c++) {
        newPanels.push({
          id: `panel-1000-${r}-${c}-${Date.now()}`,
          model: model1000,
          position: { x: c * (model1000.larguraMm / 5), y: currentY }
        });
      }
      currentY += (model1000.alturaMm / 5);
    }

    // Add bottom row of 500mm if needed
    if (has500Row) {
      for (let c = 0; c < colsCount; c++) {
        newPanels.push({
          id: `panel-500-${c}-${Date.now()}`,
          model: model500,
          position: { x: c * (model500.larguraMm / 5), y: currentY }
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
    <div className="w-[400px] shrink-0 bg-gray-900 text-gray-100 p-6 h-full flex flex-col gap-6 overflow-y-auto border-r border-gray-800 shadow-xl">
      
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
        <label className="text-sm font-semibold text-gray-300">Pitch / Tipo do Painel</label>
        <select 
          className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
          value={selectedPitch}
          onChange={(e) => {
            setSelectedPitch(e.target.value);
            const mdl = inventory.find(i => i.modelo === e.target.value);
            if (mdl) setSelectedModel(mdl);
          }}
        >
          {uniquePitches.map(pitch => (
            <option key={pitch} value={pitch}>{pitch}</option>
          ))}
        </select>
      </div>

      {/* Generation Toggles */}
      <div className="flex bg-gray-800 p-1 rounded-md">
        <button 
          onClick={() => setGenerationMode('smart')}
          className={`flex-1 text-xs py-1.5 rounded transition-colors ${generationMode === 'smart' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:text-white'}`}
        >
          <Ruler size={14} className="inline mr-1"/> Por Metragem
        </button>
        <button 
          onClick={() => setGenerationMode('uniform')}
          className={`flex-1 text-xs py-1.5 rounded transition-colors ${generationMode === 'uniform' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:text-white'}`}
        >
          <GridIcon size={14} className="inline mr-1"/> Grid Fixo
        </button>
      </div>

      {/* Grid Generator */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-4">
        {generationMode === 'smart' ? (
          <>
            <div className="text-gray-300 text-sm mb-2">Geração Inteligente (Mescla 500x500 e 500x1000)</div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-gray-400">Largura (metros)</label>
                <input type="number" step="0.5" min="0.5" value={widthMeters} onChange={e => setWidthMeters(parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 mt-1 text-center" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400">Altura (metros)</label>
                <input type="number" step="0.5" min="0.5" value={heightMeters} onChange={e => setHeightMeters(parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 mt-1 text-center" />
              </div>
            </div>
            <button onClick={generateSmartGrid} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors text-sm font-medium">
              Gerar Painel
            </button>
          </>
        ) : (
          <>
            <div className="text-gray-300 text-sm mb-2">Geração Uniforme (apenas o mesmo modelo)</div>
            
            <div className="mb-2">
              <select 
                className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white text-xs"
                value={`${selectedModel?.larguraMm}x${selectedModel?.alturaMm}`}
                onChange={(e) => {
                  const [w, h] = e.target.value.split('x').map(Number);
                  const mdl = inventory.find(i => i.modelo === selectedPitch && i.larguraMm === w && i.alturaMm === h);
                  if (mdl) setSelectedModel(mdl);
                }}
              >
                {inventory.filter(i => i.modelo === selectedPitch).map(item => (
                  <option key={`${item.larguraMm}x${item.alturaMm}`} value={`${item.larguraMm}x${item.alturaMm}`}>
                    Usar gabinetes de {item.larguraMm}x{item.alturaMm}
                  </option>
                ))}
              </select>
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
            <button onClick={generateUniformGrid} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors text-sm font-medium">
              Gerar Grid
            </button>
          </>
        )}
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
            <div className="text-gray-500 text-xs flex items-center gap-1 mb-1"><Maximize size={12}/> Resolução Total</div>
            <div className="font-semibold text-sm">{totalPixels.toLocaleString()} px</div>
            {routingResult && <div className="text-xs text-green-400 mt-1">{routingResult.totalPorts} Porta(s) Usadas</div>}
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
