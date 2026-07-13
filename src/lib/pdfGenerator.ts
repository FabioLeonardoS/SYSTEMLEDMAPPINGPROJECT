import jsPDF from 'jspdf';
import { PanelInstance, RoutingResult } from '@/types';

export const exportCanvasToPNG = (stageRef: React.RefObject<any>) => {
  if (!stageRef.current) return;
  const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
  const link = document.createElement('a');
  link.download = 'patch-led-map.png';
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportProjectToPDF = (
  stageRef: React.RefObject<any>, 
  panels: PanelInstance[], 
  routingResult: RoutingResult | null,
  logoDataUrl?: string
) => {
  if (!stageRef.current) return;
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPos = 20;

  // Header / Logo
  if (logoDataUrl) {
    // Assuming 40x40 logo for example
    pdf.addImage(logoDataUrl, 'PNG', 10, 10, 30, 30);
    yPos = 50;
  }
  
  pdf.setFontSize(22);
  pdf.text('Relatório Técnico - Painel de LED', 10, yPos);
  yPos += 15;

  // General Stats
  const totalPixels = panels.reduce((acc, p) => acc + (p.model.resolucaoX * p.model.resolucaoY), 0);
  const totalWeight = panels.reduce((acc, p) => acc + p.model.pesoKg, 0);
  const maxPower = panels.reduce((acc, p) => acc + p.model.consumoMaximoW, 0);
  const avgPower = panels.reduce((acc, p) => acc + p.model.consumoMedioW, 0);

  pdf.setFontSize(14);
  pdf.text('Resumo do Projeto', 10, yPos);
  yPos += 10;
  
  pdf.setFontSize(10);
  pdf.text(`Quantidade de Gabinetes: ${panels.length}`, 10, yPos);
  yPos += 6;
  pdf.text(`Resolução Total (Estimada): ${totalPixels.toLocaleString()} px`, 10, yPos);
  yPos += 6;
  pdf.text(`Peso Total: ${totalWeight.toFixed(2)} kg`, 10, yPos);
  yPos += 6;
  pdf.text(`Consumo Elétrico Máximo: ${maxPower} W`, 10, yPos);
  yPos += 6;
  pdf.text(`Consumo Elétrico Médio: ${avgPower} W`, 10, yPos);
  yPos += 15;

  // Patching Table
  if (routingResult) {
    pdf.setFontSize(14);
    pdf.text('Tabela de Patch (Portas Gigabit)', 10, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    for (let i = 1; i <= routingResult.totalPorts; i++) {
      const portPanels = routingResult.panels.filter(p => p.portId === i);
      const portPixels = portPanels.reduce((acc, p) => acc + (p.model.resolucaoX * p.model.resolucaoY), 0);
      
      pdf.text(`Porta ${i}: ${portPanels.length} gabinetes (${portPixels.toLocaleString()} px)`, 10, yPos);
      yPos += 6;
      
      if (yPos > 270) {
        pdf.addPage();
        yPos = 20;
      }
    }
    yPos += 10;
  }

  if (yPos > 200) {
    pdf.addPage();
    yPos = 20;
  }

  // Diagram Image
  pdf.setFontSize(14);
  pdf.text('Diagrama de Roteamento', 10, yPos);
  yPos += 10;

  const canvasImage = stageRef.current.toDataURL({ pixelRatio: 2 });
  // Fit image to page width
  const imgProps = pdf.getImageProperties(canvasImage);
  const margin = 10;
  const pdfWidth = pageWidth - (margin * 2);
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
  pdf.addImage(canvasImage, 'PNG', margin, yPos, pdfWidth, pdfHeight);

  pdf.save('projeto-led.pdf');
};
