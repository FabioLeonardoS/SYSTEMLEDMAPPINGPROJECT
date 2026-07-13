import Papa from 'papaparse';

export interface PanelModel {
  modelo: string;
  larguraMm: number;
  alturaMm: number;
  resolucaoX: number;
  resolucaoY: number;
  pesoKg: number;
  consumoMedioW: number;
  consumoMaximoW: number;
  usoComum: string;
}

export async function fetchPanelInventory(): Promise<PanelModel[]> {
  try {
    // This URL will be used to fetch the CSV from Google Sheets
    const csvUrl = "https://docs.google.com/spreadsheets/d/1Ooz4TqiQm3gWQ27UX5rfgbY3roTeGaAJZ9jRBWU14UA/export?format=csv";
    
    const response = await fetch(csvUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inventory: ${response.statusText}`);
    }

    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const panels: PanelModel[] = results.data.map((row: any) => {
            // Parse strings like "500 x 500" or "84 x 84"
            const [larguraMm, alturaMm] = row['Tamanho do Gabinete (mm)']?.split('x').map((s: string) => parseFloat(s.trim())) || [0, 0];
            const [resolucaoX, resolucaoY] = row['Resolução (Largura x Altura px)']?.split('x').map((s: string) => parseInt(s.trim())) || [0, 0];
            
            return {
              modelo: row['Modelo / Pitch'],
              larguraMm,
              alturaMm,
              resolucaoX,
              resolucaoY,
              pesoKg: parseFloat(row['Peso Aproximado (kg)']) || 0,
              consumoMedioW: parseFloat(row['Consumo Médio (W)']) || 0,
              consumoMaximoW: parseFloat(row['Consumo Máximo (W)']) || 0,
              usoComum: row['Uso Comum']
            };
          });
          resolve(panels);
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error("Error fetching panel inventory:", error);
    return [];
  }
}
