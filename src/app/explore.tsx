import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDiabetes } from '@/context/diabetes-context';
import { FoodItem } from '@/types/diabetes';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CATEGORIES = [
  'Todas',
  'Grãos e Cereais',
  'Leguminosas',
  'Pães e Massas',
  'Frutas',
  'Tubérculos',
  'Laticínios',
  'Proteínas',
];

export default function CarbsScreen() {
  const theme = useTheme();
  const { foodItems } = useDiabetes();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedFoods, setSelectedFoods] = useState<{ item: FoodItem; quantity: number }[]>([]);
  const [loading] = useState(false);

  // Filtragem dos alimentos
  const filteredItems = useMemo(() => {
    return foodItems.filter((item) => {
      const matchText = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'Todas' || item.category === selectedCategory;
      return matchText && matchCat;
    });
  }, [foodItems, searchQuery, selectedCategory]);

  // Total de carboidratos selecionados para uma refeição (calculadora de refeição)
  const totalMealCarbs = useMemo(() => {
    return selectedFoods.reduce((sum, current) => sum + current.item.carbs * current.quantity, 0);
  }, [selectedFoods]);

  const handleToggleAddFood = (food: FoodItem) => {
    setSelectedFoods((prev) => {
      const exists = prev.find((p) => p.item.id === food.id);
      if (exists) {
        return prev.filter((p) => p.item.id !== food.id);
      }
      return [...prev, { item: food, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (foodId: string, delta: number) => {
    setSelectedFoods((prev) =>
      prev
        .map((p) => {
          if (p.item.id === foodId) {
            const newQ = p.quantity + delta;
            return newQ > 0 ? { ...p, quantity: newQ } : null;
          }
          return p;
        })
        .filter(Boolean) as { item: FoodItem; quantity: number }[]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View>
            <ThemedText type="small" themeColor="textSecondary">
              Nutrição &amp; Diabetes
            </ThemedText>
            <ThemedText type="title" style={styles.appTitle}>
              Tabela de Carboidratos
            </ThemedText>
          </View>
          <View style={styles.badgeContainer}>
            <ThemedText type="smallBold" style={{ color: '#10b981' }}>
              SBD / TACO
            </ThemedText>
          </View>
        </View>

        {/* Barra de Busca */}
        <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement, borderColor: 'rgba(150, 150, 150, 0.2)' }]}>
          <TextInput
            placeholder="Buscar alimento (ex: Arroz, Pão, Maçã)..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Limpar
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Categorias Filtro */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: isActive ? '#10b981' : theme.backgroundElement,
                    },
                  ]}>
                  <ThemedText
                    type="smallBold"
                    style={{
                      color: isActive ? '#ffffff' : theme.textSecondary,
                    }}>
                    {cat}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Calculadora de Carboidratos da Refeição (Bandeja / Prato Atual) */}
        {selectedFoods.length > 0 && (
          <ThemedView type="backgroundElement" style={styles.mealSummaryCard}>
            <View style={styles.mealSummaryHeader}>
              <View>
                <ThemedText type="smallBold" style={{ color: '#10b981' }}>
                  Total da Refeição Selecionada
                </ThemedText>
                <ThemedText type="title" style={{ fontSize: 24, fontWeight: '800', color: '#10b981' }}>
                  {totalMealCarbs.toFixed(1)}g <ThemedText type="small">carboidratos</ThemedText>
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedFoods([])}
                style={styles.clearMealButton}>
                <ThemedText type="small" style={{ color: '#ef4444' }}>
                  Limpar prato
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Itens no prato */}
            <View style={styles.mealItemsList}>
              {selectedFoods.map(({ item, quantity }) => (
                <View key={item.id} style={styles.mealItemRow}>
                  <ThemedText type="small" style={{ flex: 1 }}>
                    {item.name} ({quantity}x)
                  </ThemedText>
                  <ThemedText type="smallBold" style={{ marginRight: 12 }}>
                    {(item.carbs * quantity).toFixed(1)}g
                  </ThemedText>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      onPress={() => handleUpdateQuantity(item.id, -1)}
                      style={styles.qtyBtn}>
                      <ThemedText type="smallBold">-</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleUpdateQuantity(item.id, 1)}
                      style={styles.qtyBtn}>
                      <ThemedText type="smallBold">+</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ThemedView>
        )}

        {/* Lista de Alimentos */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 8 }}>
              Consultando alimentos...
            </ThemedText>
          </View>
        ) : (
          <ScrollView
            style={styles.foodList}
            contentContainerStyle={styles.foodListContent}
            showsVerticalScrollIndicator={false}>
            {filteredItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ThemedText type="defaultSemiBold">Nenhum alimento encontrado</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: 4 }}>
                  Tente buscar por outro termo ou categoria.
                </ThemedText>
              </View>
            ) : (
              filteredItems.map((food) => {
                const isSelected = selectedFoods.some((p) => p.item.id === food.id);

                return (
                  <ThemedView
                    key={food.id}
                    type="backgroundElement"
                    style={[
                      styles.foodCard,
                      isSelected && { borderColor: '#10b981', borderWidth: 1.5 },
                    ]}>
                    <View style={styles.foodMainInfo}>
                      <ThemedText type="defaultSemiBold" style={styles.foodName}>
                        {food.name}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        Porção: {food.portion}
                      </ThemedText>
                      <View style={styles.foodTags}>
                        <View style={styles.categoryTag}>
                          <ThemedText type="small" style={{ fontSize: 11, color: theme.textSecondary }}>
                            {food.category}
                          </ThemedText>
                        </View>
                        {food.glycemicIndex && (
                          <View
                            style={[
                              styles.giTag,
                              food.glycemicIndex === 'Baixo'
                                ? { backgroundColor: 'rgba(16, 185, 129, 0.15)' }
                                : food.glycemicIndex === 'Médio'
                                ? { backgroundColor: 'rgba(245, 158, 11, 0.15)' }
                                : { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
                            ]}>
                            <ThemedText
                              type="smallBold"
                              style={{
                                fontSize: 11,
                                color:
                                  food.glycemicIndex === 'Baixo'
                                    ? '#10b981'
                                    : food.glycemicIndex === 'Médio'
                                    ? '#f59e0b'
                                    : '#ef4444',
                              }}>
                              IG {food.glycemicIndex}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Carboidratos e Botão de Ação */}
                    <View style={styles.foodActionArea}>
                      <ThemedText type="subtitle" style={{ color: '#10b981', fontWeight: '800' }}>
                        {food.carbs}g
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11, marginTop: -4 }}>
                        carbs
                      </ThemedText>

                      <TouchableOpacity
                        style={[
                          styles.addFoodBtn,
                          {
                            backgroundColor: isSelected ? '#10b981' : 'transparent',
                            borderColor: '#10b981',
                            borderWidth: 1,
                          },
                        ]}
                        onPress={() => handleToggleAddFood(food)}>
                        <ThemedText
                          type="smallBold"
                          style={{
                            color: isSelected ? '#ffffff' : '#10b981',
                            fontSize: 12,
                          }}>
                          {isSelected ? '✓ Prato' : '+ Adicionar'}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </ThemedView>
                );
              })
            )}

            {/* Aviso sobre integração com API */}
            <ThemedView type="backgroundElement" style={styles.apiNoticeCard}>
              <ThemedText type="smallBold" style={{ color: theme.text }}>
                💡 Conexão com API
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4 }}>
                Esta tela está configurada para receber requisições de APIs nutricionais externas (ex: OpenFoodFacts ou bases SBD).
              </ThemedText>
            </ThemedView>
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  badgeContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  categoriesContainer: {
    marginBottom: Spacing.two,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.four,
    gap: 8,
  },
  categoryPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  mealSummaryCard: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
    borderRadius: 14,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  mealSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearMealButton: {
    padding: 6,
  },
  mealItemsList: {
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
    gap: 6,
  },
  mealItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    gap: 4,
  },
  qtyBtn: {
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodList: {
    flex: 1,
  },
  foodListContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.six,
    gap: Spacing.two,
  },
  foodCard: {
    borderRadius: 14,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  foodMainInfo: {
    flex: 1,
    gap: 4,
  },
  foodName: {
    fontSize: 15,
  },
  foodTags: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  categoryTag: {
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  giTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  foodActionArea: {
    alignItems: 'center',
    minWidth: 80,
    gap: 4,
  },
  addFoodBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apiNoticeCard: {
    borderRadius: 12,
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
});
