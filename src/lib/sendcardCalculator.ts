// Tipos de profundidade de cor suportados
export type ColorDepth = 8 | 10;

// Modelos de Sendcards disponíveis na Série H
export type SendCardModel = 
  | 'H-16XRj45' 
  | 'H-20xRJ45' 
  | 'H-32_Standard' 
  | 'H-32_Enhanced';

// Especificações técnicas das placas
export interface SendCardSpec {
  name: string;
  ports: number; // Número equivalente de portas RJ45
  maxPixels: number; // Capacidade total máxima (em 8-bit)
  maxResolutionLimit: number; // Limite máximo de L ou A em pixels
}

export const SEND_CARD_SPECS: Record<SendCardModel, SendCardSpec> = {
  'H-16XRj45': {
    name: '16 Portas (H-16XRj45+2Fiber)',
    ports: 16,
    maxPixels: 10400000,
    maxResolutionLimit: 10240,
  },
  'H-20xRJ45': {
    name: '20 Portas (H-20xRJ45)',
    ports: 20,
    maxPixels: 13000000,
    maxResolutionLimit: 10752,
  },
  'H-32_Standard': {
    name: '32 Portas / 4 Fibra (Versão Padrão)',
    ports: 32,
    maxPixels: 20800000,
    maxResolutionLimit: 16384,
  },
  'H-32_Enhanced': {
    name: '32 Portas / 4 Fibra (Versão Enhanced)',
    ports: 40, // 26.000.000 / 650.000 = 40 portas equivalentes
    maxPixels: 26000000,
    maxResolutionLimit: 16384,
  },
};

export interface CalculationResult {
  modelName: string;
  totalPixels: number;
  portsNeeded: number;
  cardsNeeded: number;
  warnings: string[];
}

/**
 * Calcula a quantidade de Sendcards necessárias para um painel de LED.
 * 
 * @param width Largura total do painel em pixels
 * @param height Altura total do painel em pixels
 * @param model Modelo da placa Sendcard
 * @param colorDepth Profundidade de cor (8 ou 10 bits) - Padrão: 8
 * @returns Objeto com o resultado do cálculo
 */
export function calculateSendCards(
  width: number,
  height: number,
  model: SendCardModel,
  colorDepth: ColorDepth = 8
): CalculationResult {
  const totalPixels = width * height;
  
  // A capacidade por porta cai pela metade se for 10-bit
  const pixelsPerPortLimit = colorDepth === 8 ? 650000 : 320000;
  
  // 1. Calcula quantas portas de rede (RJ45) serão estritamente necessárias
  const portsNeeded = Math.ceil(totalPixels / pixelsPerPortLimit);
  
  const spec = SEND_CARD_SPECS[model];
  const warnings: string[] = [];

  // 2. Calcula a quantidade básica de placas dividindo as portas necessárias pelas portas da placa
  let cardsNeeded = Math.ceil(portsNeeded / spec.ports);

  // 3. Validação do limite físico de resolução (Largura/Altura máxima da placa)
  if (width > spec.maxResolutionLimit || height > spec.maxResolutionLimit) {
    warnings.push(
      `Atenção: A dimensão do painel (${width}x${height}) excede a resolução máxima permitida por uma única placa (${spec.maxResolutionLimit}px).`
    );
    
    // Se a largura ou altura estourar o limite, precisaremos dividir o endereçamento em mais placas
    const cardsNeededForWidth = Math.ceil(width / spec.maxResolutionLimit);
    const cardsNeededForHeight = Math.ceil(height / spec.maxResolutionLimit);
    const minCardsDueToResolution = cardsNeededForWidth * cardsNeededForHeight;
    
    // Pega o maior número entre a necessidade por portas ou a necessidade por limite de dimensão
    if (minCardsDueToResolution > cardsNeeded) {
      cardsNeeded = minCardsDueToResolution;
    }
  }

  return {
    modelName: spec.name,
    totalPixels,
    portsNeeded,
    cardsNeeded,
    warnings,
  };
}

/**
 * Utilitário extra: Calcula e compara o uso para todos os modelos disponíveis.
 * Muito útil para sugerir o hardware com melhor custo-benefício para o cliente.
 */
export function compareAllModels(
  width: number, 
  height: number, 
  colorDepth: ColorDepth = 8
): CalculationResult[] {
  const models = Object.keys(SEND_CARD_SPECS) as SendCardModel[];
  return models.map(model => calculateSendCards(width, height, model, colorDepth));
}
