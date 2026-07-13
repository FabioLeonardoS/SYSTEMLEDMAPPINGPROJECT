'use client';

import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import { useStore } from '@/store/useStore';
import { exportProjectToPDF } from '@/lib/pdfGenerator';

// Dynamically import the CanvasArea to avoid SSR issues with Konva (window is not defined on server)
const CanvasArea = dynamic(() => import('@/components/CanvasArea'), { 
  ssr: false,
  loading: () => <div className="flex-1 bg-gray-950 flex items-center justify-center text-gray-500">Carregando Canvas...</div>
});

export default function Home() {
  const stageRef = useRef(null);
  const { panels, routingResult, routeOptions } = useStore();


  const handleExportPDF = () => {
    exportProjectToPDF(stageRef, panels, routingResult, routeOptions);
  };

  return (
    <main className="flex h-screen w-full bg-black overflow-hidden font-sans">
      <Sidebar onExportPDF={handleExportPDF} />
      <CanvasArea stageRef={stageRef} />
    </main>
  );
}
