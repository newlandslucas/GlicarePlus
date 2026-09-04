export type GlucoseStatus = 'low' | 'normal' | 'elevated' | 'high';

export type MeasurementContext = 'fasting' | 'before_meal' | 'after_meal' | 'bedtime' | 'other';

export interface GlucoseRecord {
  id: string;
  value: number; // mg/dL
  timestamp: string; // ISO String
  context?: MeasurementContext;
  notes?: string;
}

export type TimeFilter = '7d' | '30d' | '90d';

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  portion: string;
  carbs: number; // in grams
  unit?: string;
  glycemicIndex?: 'Baixo' | 'Médio' | 'Alto';
}

export function getGlucoseStatus(value: number): GlucoseStatus {
  if (value < 70) return 'low';
  if (value <= 99) return 'normal';
  if (value <= 139) return 'elevated';
  return 'high';
}

export function getGlucoseStatusLabel(status: GlucoseStatus): string {
  switch (status) {
    case 'low':
      return 'Hipoglicemia (< 70)';
    case 'normal':
      return 'Normal (70-99)';
    case 'elevated':
      return 'Atenção (100-139)';
    case 'high':
      return 'Hiperglicemia (≥ 140)';
  }
}

export function getGlucoseStatusColor(status: GlucoseStatus): string {
  switch (status) {
    case 'low':
      return '#3b82f6'; // Azul
    case 'normal':
      return '#10b981'; // Verde
    case 'elevated':
      return '#f59e0b'; // Amarelo/Laranja
    case 'high':
      return '#ef4444'; // Vermelho
  }
}

export function getContextLabel(context?: MeasurementContext): string {
  switch (context) {
    case 'fasting':
      return 'Jejum';
    case 'before_meal':
      return 'Antes da refeição';
    case 'after_meal':
      return 'Pós refeição';
    case 'bedtime':
      return 'Antes de dormir';
    case 'other':
    default:
      return 'Geral';
  }
}
