import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  GlucoseRecord,
  TimeFilter,
  getGlucoseStatusColor,
  getGlucoseStatus,
  getContextLabel,
} from '@/types/diabetes';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface GlucoseChartProps {
  records: GlucoseRecord[];
  filter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
}

export function GlucoseChart({ records, filter, onFilterChange }: GlucoseChartProps) {
  const theme = useTheme();

  // Filtra por data (7, 30 ou 90 dias)
  const now = new Date().getTime();
  const daysMap: Record<TimeFilter, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };

  const cutoffTime = now - daysMap[filter] * 24 * 60 * 60 * 1000;
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => new Date(r.timestamp).getTime() >= cutoffTime)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [records, cutoffTime]);

  const [selectedItem, setSelectedItem] = useState<GlucoseRecord | null>(null);

  // Agrupamento para exibição limpa
  // Para 7 dias: mostra medições individuais recentes ou por dia
  // Para 30/90 dias: agrupa por intervalos ou mostra histórico de cards/barras simplificadas
  const chartItems = useMemo(() => {
    if (filter === '7d') {
      return filteredRecords.slice(-10); // até 10 medições recentes
    } else if (filter === '30d') {
      return filteredRecords.slice(-15);
    } else {
      return filteredRecords.slice(-20);
    }
  }, [filteredRecords, filter]);

  // Cálculos de resumo
  const values = filteredRecords.map((r) => r.value);
  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;

  // Em meta (70 a 140)
  const inRangeCount = values.filter((v) => v >= 70 && v <= 140).length;
  const inRangePct = values.length ? Math.round((inRangeCount / values.length) * 100) : 0;

  const maxChartValue = Math.max(200, max + 20);

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      {/* Topo do Card com Título e Filtro Segmentado Moderno */}
      <View style={styles.headerRow}>
        <View>
          <ThemedText type="defaultSemiBold" style={styles.title}>
            Estatísticas &amp; Gráfico
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {filteredRecords.length} medições registradas
          </ThemedText>
        </View>

        {/* Filtros em Pílulas */}
        <View style={styles.filterPills}>
          {(['7d', '30d', '90d'] as TimeFilter[]).map((f) => {
            const isSelected = filter === f;
            const label = f === '7d' ? '7 dias' : f === '30d' ? '30 dias' : '90 dias';
            return (
              <TouchableOpacity
                key={f}
                onPress={() => {
                  onFilterChange(f);
                  setSelectedItem(null);
                }}
                style={[
                  styles.filterBtn,
                  isSelected && styles.filterBtnActive,
                ]}>
                <ThemedText
                  type="smallBold"
                  style={[
                    styles.filterBtnText,
                    { color: isSelected ? '#ffffff' : theme.textSecondary },
                  ]}>
                  {label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Cards de Métricas Rápidas */}
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: theme.background }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Média
          </ThemedText>
          <ThemedText
            type="subtitle"
            style={{
              fontSize: 20,
              fontWeight: '800',
              color: avg > 0 ? getGlucoseStatusColor(getGlucoseStatus(avg)) : theme.text,
            }}>
            {avg > 0 ? `${avg}` : '--'}
            <ThemedText type="small" style={{ fontSize: 11, fontWeight: 'normal' }}>
              {avg > 0 ? ' mg/dL' : ''}
            </ThemedText>
          </ThemedText>
        </View>

        <View style={[styles.statBox, { backgroundColor: theme.background }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Na meta (70-140)
          </ThemedText>
          <ThemedText type="subtitle" style={{ fontSize: 20, fontWeight: '800', color: '#10b981' }}>
            {values.length > 0 ? `${inRangePct}%` : '--'}
          </ThemedText>
        </View>

        <View style={[styles.statBox, { backgroundColor: theme.background }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Mín. / Máx.
          </ThemedText>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 15, marginTop: 4 }}>
            {min > 0 ? `${min}` : '--'} / {max > 0 ? `${max}` : '--'}
          </ThemedText>
        </View>
      </View>

      {/* Visualizador de Barras Moderno e Intuitivo */}
      {filteredRecords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText type="small" themeColor="textSecondary">
            Nenhuma medição encontrada para este período.
          </ThemedText>
        </View>
      ) : (
        <View style={styles.chartWrapper}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.chartSubtitle}>
            Toque nas colunas para ver detalhes da medição:
          </ThemedText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.barsContainer}>
            {chartItems.map((item) => {
              const heightPercent = Math.min(100, Math.max(15, (item.value / maxChartValue) * 100));
              const color = getGlucoseStatusColor(getGlucoseStatus(item.value));
              const isSelected = selectedItem?.id === item.id;
              const date = new Date(item.timestamp);
              const dayLabel = `${date.getDate()}/${date.getMonth() + 1}`;

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedItem(isSelected ? null : item)}
                  style={styles.barColumn}>
                  {/* Valor acima da barra */}
                  <ThemedText
                    type="smallBold"
                    style={[
                      styles.barValueText,
                      { color: isSelected ? color : theme.textSecondary },
                    ]}>
                    {item.value}
                  </ThemedText>

                  {/* Barra vertical com topo arredondado */}
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${heightPercent}%`,
                          backgroundColor: color,
                          opacity: isSelected ? 1 : 0.85,
                          borderWidth: isSelected ? 2 : 0,
                          borderColor: '#ffffff',
                        },
                      ]}
                    />
                  </View>

                  {/* Data / Dia */}
                  <ThemedText type="small" style={styles.barDateText} themeColor="textSecondary">
                    {dayLabel}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Linha Informativa do Item Selecionado */}
          {selectedItem && (
            <ThemedView
              type="backgroundSelected"
              style={[
                styles.detailBox,
                { borderLeftColor: getGlucoseStatusColor(getGlucoseStatus(selectedItem.value)) },
              ]}>
              <View style={styles.detailRow}>
                <ThemedText
                  type="defaultSemiBold"
                  style={{
                    color: getGlucoseStatusColor(getGlucoseStatus(selectedItem.value)),
                    fontSize: 18,
                  }}>
                  {selectedItem.value} mg/dL
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {new Date(selectedItem.timestamp).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </ThemedText>
              </View>
              <ThemedText type="small" style={{ marginTop: 2 }}>
                Momento: <ThemedText type="smallBold">{getContextLabel(selectedItem.context)}</ThemedText>
                {selectedItem.notes ? ` • "${selectedItem.notes}"` : ''}
              </ThemedText>
            </ThemedView>
          )}
        </View>
      )}

      {/* Legenda visual simplificada */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
          <ThemedText type="small" style={styles.legendText} themeColor="textSecondary">
            &lt;70 Baixa
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <ThemedText type="small" style={styles.legendText} themeColor="textSecondary">
            70-99 Normal
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <ThemedText type="small" style={styles.legendText} themeColor="textSecondary">
            100-139 Atenção
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <ThemedText type="small" style={styles.legendText} themeColor="textSecondary">
            ≥140 Alta
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  title: {
    fontSize: 17,
  },
  filterPills: {
    flexDirection: 'row',
    backgroundColor: 'rgba(150, 150, 150, 0.12)',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 9,
  },
  filterBtnActive: {
    backgroundColor: '#3b82f6',
  },
  filterBtnText: {
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartWrapper: {
    marginTop: Spacing.one,
    gap: Spacing.two,
  },
  chartSubtitle: {
    fontSize: 12,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    minHeight: 160,
  },
  barColumn: {
    alignItems: 'center',
    width: 38,
    height: 150,
    justifyContent: 'flex-end',
    gap: 6,
  },
  barValueText: {
    fontSize: 11,
    fontWeight: '700',
  },
  barTrack: {
    width: 22,
    height: 105,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    borderRadius: 11,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 11,
  },
  barDateText: {
    fontSize: 11,
  },
  detailBox: {
    borderRadius: 12,
    padding: Spacing.three,
    borderLeftWidth: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.12)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
  },
});
