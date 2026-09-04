import { FoodItem, GlucoseRecord } from '@/types/diabetes';

// Base de dados inicial de contagem de carboidratos (SBD / TACO)
export const initialFoodItems: FoodItem[] = [
  { id: '1', name: 'Arroz Branco Cozido', category: 'Grãos e Cereais', portion: '1 colher de sopa cheia (25g)', carbs: 7, glycemicIndex: 'Alto' },
  { id: '2', name: 'Arroz Integral Cozido', category: 'Grãos e Cereais', portion: '1 colher de sopa cheia (25g)', carbs: 6, glycemicIndex: 'Médio' },
  { id: '3', name: 'Feijão Carioca Cozido', category: 'Leguminosas', portion: '1 concha média (86g)', carbs: 14, glycemicIndex: 'Baixo' },
  { id: '4', name: 'Feijão Preto Cozido', category: 'Leguminosas', portion: '1 concha média (86g)', carbs: 12, glycemicIndex: 'Baixo' },
  { id: '5', name: 'Pão Francês', category: 'Pães e Massas', portion: '1 unidade (50g)', carbs: 29, glycemicIndex: 'Alto' },
  { id: '6', name: 'Pão de Forma Integral', category: 'Pães e Massas', portion: '1 fatia (25g)', carbs: 12, glycemicIndex: 'Médio' },
  { id: '7', name: 'Macarrão Cozido', category: 'Pães e Massas', portion: '1 prato raso (160g)', carbs: 49, glycemicIndex: 'Médio' },
  { id: '8', name: 'Tapioca', category: 'Pães e Massas', portion: '2 colheres de sopa (30g)', carbs: 16, glycemicIndex: 'Alto' },
  { id: '9', name: 'Aveia em Flocos', category: 'Grãos e Cereais', portion: '2 colheres de sopa (30g)', carbs: 17, glycemicIndex: 'Baixo' },
  { id: '10', name: 'Banana Prata', category: 'Frutas', portion: '1 unidade média (65g)', carbs: 17, glycemicIndex: 'Médio' },
  { id: '11', name: 'Maçã com Casca', category: 'Frutas', portion: '1 unidade média (130g)', carbs: 19, glycemicIndex: 'Baixo' },
  { id: '12', name: 'Mamão Papaia', category: 'Frutas', portion: '1/2 unidade (140g)', carbs: 15, glycemicIndex: 'Médio' },
  { id: '13', name: 'Laranja com Bagaço', category: 'Frutas', portion: '1 unidade média (130g)', carbs: 12, glycemicIndex: 'Baixo' },
  { id: '14', name: 'Batata Inglesa Cozida', category: 'Tubérculos', portion: '1 unidade média (140g)', carbs: 21, glycemicIndex: 'Alto' },
  { id: '15', name: 'Batata Doce Cozida', category: 'Tubérculos', portion: '1 fatia média (100g)', carbs: 28, glycemicIndex: 'Médio' },
  { id: '16', name: 'Mandioca/Aipim Cozido', category: 'Tubérculos', portion: '1 pedaço médio (100g)', carbs: 30, glycemicIndex: 'Médio' },
  { id: '17', name: 'Leite Integral / Desnatado', category: 'Laticínios', portion: '1 copo (200ml)', carbs: 10, glycemicIndex: 'Baixo' },
  { id: '18', name: 'Iogurte Natural Integral', category: 'Laticínios', portion: '1 pote (170g)', carbs: 9, glycemicIndex: 'Baixo' },
  { id: '19', name: 'Ovo de Galinha Cozido', category: 'Proteínas', portion: '1 unidade (50g)', carbs: 0.5, glycemicIndex: 'Baixo' },
  { id: '20', name: 'Peito de Frango Grelhado', category: 'Proteínas', portion: '1 filé médio (100g)', carbs: 0, glycemicIndex: 'Baixo' },
];

export function generateSampleGlucoseData(): GlucoseRecord[] {
  const records: GlucoseRecord[] = [];
  const now = new Date();

  // Gerar amostras representativas dos últimos 90 dias
  const daysPattern = [
    { daysAgo: 0, val: 110, ctx: 'fasting' as const },
    { daysAgo: 1, val: 125, ctx: 'after_meal' as const },
    { daysAgo: 2, val: 95, ctx: 'fasting' as const },
    { daysAgo: 3, val: 145, ctx: 'after_meal' as const },
    { daysAgo: 4, val: 88, ctx: 'fasting' as const },
    { daysAgo: 5, val: 135, ctx: 'before_meal' as const },
    { daysAgo: 6, val: 105, ctx: 'fasting' as const },
    { daysAgo: 8, val: 118, ctx: 'after_meal' as const },
    { daysAgo: 10, val: 92, ctx: 'fasting' as const },
    { daysAgo: 14, val: 152, ctx: 'after_meal' as const },
    { daysAgo: 18, val: 108, ctx: 'fasting' as const },
    { daysAgo: 22, val: 130, ctx: 'before_meal' as const },
    { daysAgo: 25, val: 99, ctx: 'fasting' as const },
    { daysAgo: 29, val: 115, ctx: 'after_meal' as const },
    { daysAgo: 35, val: 102, ctx: 'fasting' as const },
    { daysAgo: 42, val: 140, ctx: 'after_meal' as const },
    { daysAgo: 50, val: 94, ctx: 'fasting' as const },
    { daysAgo: 60, val: 160, ctx: 'after_meal' as const },
    { daysAgo: 70, val: 90, ctx: 'fasting' as const },
    { daysAgo: 80, val: 120, ctx: 'before_meal' as const },
    { daysAgo: 88, val: 105, ctx: 'fasting' as const },
  ];

  for (let i = 0; i < daysPattern.length; i++) {
    const item = daysPattern[i];
    const date = new Date(now.getTime() - item.daysAgo * 24 * 60 * 60 * 1000);
    records.push({
      id: `sample-${i}`,
      value: item.val,
      timestamp: date.toISOString(),
      context: item.ctx,
      notes: 'Registro inicial',
    });
  }

  return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
