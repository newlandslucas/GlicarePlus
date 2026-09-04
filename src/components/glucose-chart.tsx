import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native';
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
  const [containerWidth, setContainerWidth] = useState(320);
  const [selectedRecord, setSelectedRecord] = useState<GlucoseRecord | null>(null);

  // Filtro de tempo
  const now = new Date().getTime();
  const daysMap: Record<TimeFilter, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };

  const cutoff = now - daysMap[filter] * 24 * 60 * 60 * 1000;
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => new Date(r.timestamp).getTime() >= cutoff)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [records, cutoff]);

  // Estatísticas principais
  const values = filteredRecords.map((r) => r.value);
  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const inRangeCount = values.filter((v) => v >= 70 && v <= 140).length;
  const inRangePct = values.length ? Math.round((inRangeCount / values.length) * 100) : 0;

  // Dimensões do gráfico minimalista
  const chartHeight = 140;
  const padX = 24;
  const padY = 18;
  const effectiveWidth = Math.max(100, containerWidth - padX * 2);
  const effectiveHeight = chartHeight - padY * 2;

  // Escala Y (fixa ou adaptável com folga elegante)
  const minY = 50;
  const maxY = Math.max(220, ...values, 180);
  const rangeY = maxY - minY || 1;

  const getYPos = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return padY + effectiveHeight - ((clamped - minY) / rangeY) * effectiveHeight;
  };

  const getXPos = (index: number, total: number) => {
    if (total <= 1) return padX + effectiveWidth / 2;
    return padX + (index / (total - 1)) * effectiveWidth;
  };

  // Posições dos pontos
  const points = useMemo(() => {
    return filteredRecords.map((record, index) => {
      const x = getXPos(index, filteredRecords.length);
      const y = getYPos(record.value);
      return { record, x, y };
    });
  }, [filteredRecords, containerWidth, effectiveHeight, effectiveWidth]);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  // Faixa alvo (70 a 140)
  const targetTop = getYPos(140);
  const targetBottom = getYPos(70);
  const targetHeight = Math.max(0, targetBottom - targetTop);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {/* Header com Título e Filtro Segmentado Elegante */}
      <View style={styles.header}>
        <View>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            Tendência Glicêmica
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {filteredRecords.length} medições no período
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
                  setSelectedRecord(null);
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

      {/* Cartões Rápidos de Resumo */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { backgroundColor: theme.background }]}>
          <ThemedText type="small" themeColor="textSecondary">Média Geral</ThemedText>
          <ThemedText
            type="title"
            style={[
              styles.metricValue,
              { color: avg > 0 ? getGlucoseStatusColor(getGlucoseStatus(avg)) : theme.text },
            ]}>
            {avg > 0 ? avg : '--'}
            <ThemedText type="small" themeColor="textSecondary" style={styles.metricUnit}>
              {avg > 0 ? ' mg/dL' : ''}
            </ThemedText>
          </ThemedText>
        </View>

        <View style={[styles.metricCard, { backgroundColor: theme.background }]}>
          <ThemedText type="small" themeColor="textSecondary">Na Meta (70-140)</ThemedText>
          <ThemedText type="title" style={[styles.metricValue, { color: '#10b981' }]}>
            {values.length > 0 ? `${inRangePct}%` : '--'}
          </ThemedText>
        </View>
      </View>

      {/* Área do Gráfico em Linha / Curva com Pontos */}
      <View style={styles.chartCanvas} onLayout={onLayout}>
        {/* Faixa Alvo Verde Suave (70 a 140 mg/dL) */}
        <View
          style={[
            styles.targetZone,
            {
              top: targetTop,
              height: targetHeight,
            },
          ]}>
          <ThemedText type="small" style={styles.targetZoneText}>
            Zona Alvo (70 - 140 mg/dL)
          </ThemedText>
        </View>

        {/* Linhas de Referência Discretas */}
        <View style={[styles.guideLine, { top: targetTop }]} />
        <View style={[styles.guideLine, { top: targetBottom }]} />

        {/* Segmentos de Conexão entre Pontos */}
        {points.length > 1 &&
          points.slice(0, -1).map((pt, i) => {
            const nextPt = points[i + 1];
            const dx = nextPt.x - pt.x;
            const dy = nextPt.y - pt.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            const midX = (pt.x + nextPt.x) / 2;
            const midY = (pt.y + nextPt.y) / 2;

            return (
              <View
                key={`line-${i}`}
                style={[
                  styles.connectingLine,
                  {
                    width: length,
                    left: midX - length / 2,
                    top: midY - 1,
                    transform: [{ rotate: `${angle}deg` }],
                  },
                ]}
              />
            );
          })}

        {/* Pontos Clicáveis na Linha */}
        {points.map(({ record, x, y }) => {
          const color = getGlucoseStatusColor(getGlucoseStatus(record.value));
          const isSelected = selectedRecord?.id === record.id;

          return (
            <TouchableOpacity
              key={record.id}
              activeOpacity={0.7}
              onPress={() => setSelectedRecord(isSelected ? null : record)}
              style={[
                styles.pointWrapper,
                {
                  left: x - 14,
                  top: y - 14,
                },
              ]}>
              <View
                style={[
                  styles.pointOuterRing,
                  isSelected && {
                    borderColor: color,
                    backgroundColor: `${color}20`,
                    transform: [{ scale: 1.3 }],
                  },
                ]}>
                <View style={[styles.pointCore, { backgroundColor: color }]} />
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredRecords.length === 0 && (
          <View style={styles.emptyContainer}>
            <ThemedText type="small" themeColor="textSecondary">
              Nenhuma medição registrada no período selecionado.
            </ThemedText>
          </View>
        )}
      </View>

      {/* Card Flutuante de Detalhes da Medição Selecionada */}
      {selectedRecord ? (
        <ThemedView
          type="backgroundSelected"
          style={[
            styles.detailBanner,
            { borderLeftColor: getGlucoseStatusColor(getGlucoseStatus(selectedRecord.value)) },
          ]}>
          <View style={styles.detailHeader}>
            <View style={styles.detailValueContainer}>
              <ThemedText
                type="title"
                style={[
                  styles.detailValueText,
                  { color: getGlucoseStatusColor(getGlucoseStatus(selectedRecord.value)) },
                ]}>
                {selectedRecord.value}
              </ThemedText>
              <ThemedText type="smallBold" themeColor="textSecondary">
                mg/dL
              </ThemedText>
            </View>

            <ThemedText type="small" themeColor="textSecondary">
              {new Date(selectedRecord.timestamp).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
              })}{' '}
              às{' '}
              {new Date(selectedRecord.timestamp).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </ThemedText>
          </View>

          <ThemedText type="small" style={{ marginTop: 2 }}>
            Momento: <ThemedText type="smallBold">{getContextLabel(selectedRecord.context)}</ThemedText>
            {selectedRecord.notes ? ` • "${selectedRecord.notes}"` : ''}
          </ThemedText>
        </ThemedView>
      ) : (
        <ThemedText type="small" themeColor="textSecondary" style={styles.hintText}>
          💡 Dica: Toque nos pontos do gráfico para ver detalhes de cada medição.
        </ThemedText>
      )}

      {/* Legenda Discreta */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
          <ThemedText type="small" style={styles.legendLabel} themeColor="textSecondary">
            &lt;70
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <ThemedText type="small" style={styles.legendLabel} themeColor="textSecondary">
            70-99
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <ThemedText type="small" style={styles.legendLabel} themeColor="textSecondary">
            100-139
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <ThemedText type="small" style={styles.legendLabel} themeColor="textSecondary">
            ≥140
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  cardTitle: {
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
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 2,
  },
  metricValue: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: 'normal',
  },
  chartCanvas: {
    height: 150,
    position: 'relative',
    marginVertical: Spacing.one,
  },
  targetZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 8,
    justifyContent: 'center',
    paddingLeft: 8,
  },
  targetZoneText: {
    fontSize: 10,
    color: 'rgba(16, 185, 129, 0.7)',
    fontWeight: '600',
  },
  guideLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
  },
  connectingLine: {
    position: 'absolute',
    height: 2.5,
    backgroundColor: 'rgba(59, 130, 246, 0.65)',
    borderRadius: 1.5,
  },
  pointWrapper: {
    position: 'absolute',
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pointOuterRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  emptyContainer: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailBanner: {
    borderRadius: 14,
    padding: Spacing.three,
    borderLeftWidth: 4,
    gap: 2,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  detailValueText: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
  },
  hintText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  legend: {
    flexDirection: 'row',
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
  legendLabel: {
    fontSize: 11,
  },
});
