import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FoodItem, GlucoseRecord } from '@/types/diabetes';
import { initialFoodItems, generateSampleGlucoseData } from '@/constants/mock-data';

interface DiabetesContextType {
  records: GlucoseRecord[];
  foodItems: FoodItem[];
  addRecord: (value: number, context?: GlucoseRecord['context'], notes?: string) => void;
  deleteRecord: (id: string) => void;
  searchFoods: (query: string, category?: string) => Promise<FoodItem[]>;
}

const DiabetesContext = createContext<DiabetesContextType | undefined>(undefined);

export function DiabetesProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<GlucoseRecord[]>(() => generateSampleGlucoseData());
  const [foodItems] = useState<FoodItem[]>(initialFoodItems);

  const addRecord = (value: number, context: GlucoseRecord['context'] = 'fasting', notes?: string) => {
    const newRecord: GlucoseRecord = {
      id: Date.now().toString(),
      value,
      timestamp: new Date().toISOString(),
      context,
      notes,
    };
    setRecords((prev) => [newRecord, ...prev]);
  };

  const deleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const searchFoods = async (query: string, category?: string): Promise<FoodItem[]> => {
    // Preparado para futura chamada a API:
    // try {
    //   const response = await fetch(`https://api.exemplo.com/foods?q=${query}&category=${category}`);
    //   return await response.json();
    // } catch (err) { ... }
    
    // Filtro local simulando resposta imediata
    return foodItems.filter((item) => {
      const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !category || category === 'Todas' || item.category === category;
      return matchesQuery && matchesCategory;
    });
  };

  return (
    <DiabetesContext.Provider
      value={{
        records,
        foodItems,
        addRecord,
        deleteRecord,
        searchFoods,
      }}>
      {children}
    </DiabetesContext.Provider>
  );
}

export function useDiabetes() {
  const context = useContext(DiabetesContext);
  if (!context) {
    throw new Error('useDiabetes deve ser usado dentro de um DiabetesProvider');
  }
  return context;
}
