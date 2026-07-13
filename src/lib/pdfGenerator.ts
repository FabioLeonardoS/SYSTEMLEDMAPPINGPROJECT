import jsPDF from 'jspdf';
import { PanelInstance, RoutingResult, RouteOptions } from '@/types';

export const exportProjectToPDF = (
  stageRef: React.RefObject<any>, 
  panels: PanelInstance[], 
  routingResult: RoutingResult | null,
  routeOptions: RouteOptions,
  logoDataUrl?: string
) => {
  if (!stageRef.current) return;
  
  const pdf = new jsPDF('l', 'mm', 'a4'); // 'l' for landscape
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  let leftYPos = 20;
  const leftMargin = 10;
  const leftColWidth = 85;

  // Header / Logo
  if (logoDataUrl) {
    pdf.addImage(logoDataUrl, 'PNG', leftMargin, 10, 30, 30);
    leftYPos = 50;
  }
  
  pdf.setFontSize(18);
  pdf.text('Relatório Técnico - Painel de LED', leftMargin, leftYPos);
  leftYPos += 12;

  // Calculate resolution
  let totalWidthPx = 0;
  let totalHeightPx = 0;
  if (panels.length > 0) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    
    panels.forEach(p => {
      const pxLeft = Math.round(p.position.x / (p.model.larguraMm / 5)) * p.model.resolucaoX;
      const pxRight = pxLeft + p.model.resolucaoX;
      const pxTop = Math.round(p.position.y / (p.model.alturaMm / 5)) * p.model.resolucaoY;
      const pxBottom = pxTop + p.model.resolucaoY;
      if (pxLeft < minX) minX = pxLeft;
      if (pxRight > maxX) maxX = pxRight;
      if (pxTop < minY) minY = pxTop;
      if (pxBottom > maxY) maxY = pxBottom;
    });
    totalWidthPx = maxX - minX;
    totalHeightPx = maxY - minY;
  }

  // General Stats
  const totalWeight = panels.reduce((acc, p) => acc + p.model.pesoKg, 0);
  const maxPower = panels.reduce((acc, p) => acc + p.model.consumoMaximoW, 0);
  const avgPower = panels.reduce((acc, p) => acc + p.model.consumoMedioW, 0);

  pdf.setFontSize(14);
  pdf.text('Resumo do Projeto', leftMargin, leftYPos);
  leftYPos += 8;
  
  pdf.setFontSize(10);
  pdf.text(`Quantidade de Gabinetes: ${panels.length}`, leftMargin, leftYPos);
  leftYPos += 6;
  pdf.text(`Resolução Total: ${totalWidthPx} x ${totalHeightPx} px`, leftMargin, leftYPos);
  leftYPos += 6;
  pdf.text(`Peso Total: ${totalWeight.toFixed(2)} kg`, leftMargin, leftYPos);
  leftYPos += 6;
  pdf.text(`Consumo Elétrico Máx: ${maxPower} W`, leftMargin, leftYPos);
  leftYPos += 6;
  pdf.text(`Consumo Elétrico Médio: ${avgPower} W`, leftMargin, leftYPos);
  leftYPos += 12;

  // Dimensionamento de Energia
  pdf.setFontSize(14);
  pdf.text('Dimensionamento de Energia (220V/20A)', leftMargin, leftYPos);
  leftYPos += 8;

  pdf.setFontSize(10);
  let maxPanelsPerCable = 0;
  let totalCablesNeeded = 0;
  if (panels.length > 0) {
    maxPanelsPerCable = Math.floor(4400 / panels[0].model.consumoMaximoW);
    totalCablesNeeded = Math.ceil(panels.length / maxPanelsPerCable);
  }

  pdf.text(`Máx. por cabo PP 3x2,5mm² (PowerCON): ${maxPanelsPerCable} placas`, leftMargin, leftYPos);
  leftYPos += 6;
  pdf.text(`Total de Linhas (Cabos) Necessárias: ${totalCablesNeeded}`, leftMargin, leftYPos);
  leftYPos += 12;

  // Processamento
  pdf.setFontSize(14);
  pdf.text('Processamento de Imagem', leftMargin, leftYPos);
  leftYPos += 8;
  
  pdf.setFontSize(10);
  pdf.text(`Controladora: ${routeOptions.processorConfig?.controller || 'H2'}`, leftMargin, leftYPos);
  leftYPos += 6;
  pdf.text(`Cartão de Envio: ${routeOptions.processorConfig?.sendCardPorts || 20} Portas`, leftMargin, leftYPos);
  leftYPos += 12;

  // Patching Table
  if (routingResult) {
    pdf.setFontSize(14);
    pdf.text('Tabela de Patch (Portas)', leftMargin, leftYPos);
    leftYPos += 8;

    pdf.setFontSize(10);
    for (let i = 1; i <= routingResult.totalPorts; i++) {
      const portPanels = routingResult.panels.filter(p => p.portId === i);
      const portPixels = portPanels.reduce((acc, p) => acc + (p.model.resolucaoX * p.model.resolucaoY), 0);
      
      pdf.text(`Porta ${i}: ${portPanels.length} gabinetes (${portPixels.toLocaleString()} px)`, leftMargin, leftYPos);
      leftYPos += 6;
      
      // Basic pagination for left column
      if (leftYPos > pageHeight - 15) {
        pdf.addPage();
        leftYPos = 20;
      }
    }
  }

  // Diagram Image on the right side
  // Reset Stage Zoom before capture? Actually we want to capture what's visible, but centered and scaled to fit the Stage.
  // toDataURL will capture the whole stage size.
  const canvasImage = stageRef.current.toDataURL({ pixelRatio: 3 });
  
  const rightMargin = 100;
  const pdfImgWidth = pageWidth - rightMargin - 10;
  
  const imgProps = pdf.getImageProperties(canvasImage);
  const pdfImgHeight = (imgProps.height * pdfImgWidth) / imgProps.width;
  
  // Center image vertically if it fits, else place it at top
  let imgYPos = 20;
  if (pdfImgHeight < pageHeight - 40) {
    imgYPos = (pageHeight - pdfImgHeight) / 2;
  }

  pdf.addImage(canvasImage, 'PNG', rightMargin, imgYPos, pdfImgWidth, pdfImgHeight);

  pdf.save('projeto-led.pdf');
};
