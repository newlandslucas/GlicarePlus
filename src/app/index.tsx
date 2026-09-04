import { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GlucoseChart } from '@/components/glucose-chart';
import { AddGlucoseBottomSheet } from '@/components/add-glucose-bottomsheet';
import { useDiabetes } from '@/context/diabetes-context';
import {
  MeasurementContext,
  TimeFilter,
  getContextLabel,
  getGlucoseStatus,
  getGlucoseStatusColor,
} from '@/types/diabetes';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const theme = useTheme();
  const { records, addRecord } = useDiabetes();

  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d');

  const latestRecord = records[0];

  // Medições de hoje
  const todayRecords = useMemo(() => {
    const today = new Date();
    return records.filter((r) => {
      const d = new Date(r.timestamp);
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    });
  }, [records]);

  const handleSaveGlucose = (
    value: number,
    context: MeasurementContext,
    notes?: string
  ) => {
    addRecord(value, context, notes);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          
          {/* Header com "Bem-vindo ao Glicare+" no canto esquerdo */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <ThemedText type="small" themeColor="textSecondary">
                Bem-vindo ao
              </ThemedText>
              <ThemedText type="title" style={styles.appTitle}>
                Glicare<ThemedText style={styles.brandAccent}>+</ThemedText>
              </ThemedText>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/history')}
              style={styles.historyShortcutBadge}>
              <ThemedText type="smallBold" style={{ color: '#3b82f6', fontSize: 13 }}>
                Ver Histórico ➔
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Botão Principal de Registrar Glicemia informando o último valor registrado */}
          <TouchableOpacity
            style={styles.mainRegisterButton}
            activeOpacity={0.88}
            onPress={() => setIsBottomSheetVisible(true)}>
            <View style={styles.registerButtonContent}>
              <View style={styles.registerButtonIconCircle}>
                <ThemedText style={styles.registerPlusIcon}>+</ThemedText>
              </View>

              <View style={styles.registerTextSection}>
                <ThemedText type="defaultSemiBold" style={styles.registerTitle}>
                  Registrar Nova Glicemia
                </ThemedText>
                <ThemedText type="small" style={styles.registerSubtitle}>
                  {latestRecord
                    ? `Última: ${latestRecord.value} mg/dL (${getContextLabel(latestRecord.context)})`
                    : 'Toque para cadastrar sua primeira medição'}
                </ThemedText>
              </View>

              {latestRecord && (
                <View
                  style={[
                    styles.latestBadgePill,
                    { backgroundColor: getGlucoseStatusColor(getGlucoseStatus(latestRecord.value)) },
                  ]}>
                  <ThemedText type="smallBold" style={{ color: '#ffffff', fontSize: 13 }}>
                    {latestRecord.value}
                  </ThemedText>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Seção: Medições do Dia de Hoje */}
          <ThemedView type="backgroundElement" style={styles.todayCard}>
            <View style={styles.sectionHeader}>
              <View>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Glicemias de Hoje
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {todayRecords.length} {todayRecords.length === 1 ? 'medição realizada' : 'medições realizadas'} hoje
                </ThemedText>
              </View>

              <TouchableOpacity onPress={() => setIsBottomSheetVisible(true)}>
                <ThemedText type="smallBold" style={{ color: '#3b82f6' }}>
                  + Adicionar
                </ThemedText>
              </TouchableOpacity>
            </View>

            {todayRecords.length === 0 ? (
              <View style={styles.emptyTodayBox}>
                <ThemedText type="small" themeColor="textSecondary">
                  Nenhuma medição registrada hoje. Toque no botão acima para registrar.
                </ThemedText>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.todayScroll}>
                {todayRecords.map((item) => {
                  const color = getGlucoseStatusColor(getGlucoseStatus(item.value));
                  const time = new Date(item.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <ThemedView
                      key={item.id}
                      style={[styles.todayItemCard, { backgroundColor: theme.background }]}>
                      <View style={styles.todayItemHeader}>
                        <ThemedText type="smallBold" style={{ color: theme.textSecondary, fontSize: 12 }}>
                          {time}
                        </ThemedText>
                        <View style={[styles.todayItemDot, { backgroundColor: color }]} />
                      </View>

                      <View style={styles.todayItemValueRow}>
                        <ThemedText
                          type="title"
                          style={[styles.todayItemValueNumber, { color }]}>
                          {item.value}
                        </ThemedText>
                        <ThemedText type="smallBold" themeColor="textSecondary" style={{ fontSize: 11 }}>
                          mg/dL
                        </ThemedText>
                      </View>

                      <ThemedText type="small" style={styles.todayItemContext}>
                        {getContextLabel(item.context)}
                      </ThemedText>
                    </ThemedView>
                  );
                })}
              </ScrollView>
            )}
          </ThemedView>

          {/* Gráfico Moderno e Limpo com Filtros */}
          <GlucoseChart
            records={records}
            filter={timeFilter}
            onFilterChange={setTimeFilter}
          />
        </ScrollView>
      </SafeAreaView>

      {/* BottomSheet Modal para Registro de Glicemia */}
      <AddGlucoseBottomSheet
        visible={isBottomSheetVisible}
        onClose={() => setIsBottomSheetVisible(false)}
        onSave={handleSaveGlucose}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.six,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  headerLeft: {
    alignItems: 'flex-start',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginTop: -2,
  },
  brandAccent: {
    color: '#3b82f6',
    fontWeight: '800',
  },
  historyShortcutBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  mainRegisterButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    padding: Spacing.three,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  registerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  registerButtonIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerPlusIcon: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: -2,
  },
  registerTextSection: {
    flex: 1,
  },
  registerTitle: {
    color: '#ffffff',
    fontSize: 16,
  },
  registerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  latestBadgePill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  todayCard: {
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
  },
  emptyTodayBox: {
    paddingVertical: Spacing.two,
  },
  todayScroll: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  todayItemCard: {
    borderRadius: 16,
    padding: Spacing.three,
    minWidth: 125,
    gap: 4,
  },
  todayItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  todayItemValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  todayItemValueNumber: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
  },
  todayItemContext: {
    fontSize: 12,
    opacity: 0.8,
  },
});
