import { AddGlucoseBottomSheet } from '@/components/add-glucose-bottomsheet';
import { GlucoseChart } from '@/components/glucose-chart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useDiabetes } from '@/context/diabetes-context';
import { useTheme } from '@/hooks/use-theme';
import {
  MeasurementContext,
  TimeFilter,
  getContextLabel,
  getGlucoseStatus,
  getGlucoseStatusColor,
  getGlucoseStatusLabel,
} from '@/types/diabetes';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const theme = useTheme();
  const { records, addRecord, deleteRecord } = useDiabetes();

  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d');

  const latestRecord = records[0];

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
          
          {/* Header com "Bem-vindo ao Glicare+" no canto esquerdo e Ação */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <ThemedText type="small" themeColor="textSecondary">
                Bem-vindo ao
              </ThemedText>
              <ThemedText type="title" style={styles.appTitle}>
                Glicare<ThemedText style={styles.brandAccent}>+</ThemedText>
              </ThemedText>
            </View>

            <View style={styles.headerBadge}>
              <ThemedText type="smallBold" style={{ color: '#3b82f6', fontSize: 12 }}>
                App de Controle
              </ThemedText>
            </View>
          </View>

          {/* Card de Status da Última Medição + Botão de Ação para Abrir o BottomSheet */}
          <ThemedView type="backgroundElement" style={styles.mainActionCard}>
            <View style={styles.mainCardContent}>
              <View style={styles.statusTextSection}>
                <ThemedText type="small" themeColor="textSecondary">
                  Status Atual da Glicemia
                </ThemedText>
                {latestRecord ? (
                  <View style={styles.latestValueRow}>
                    <ThemedText
                      type="title"
                      style={[
                        styles.latestValueNumber,
                        { color: getGlucoseStatusColor(getGlucoseStatus(latestRecord.value)) },
                      ]}>
                      {latestRecord.value}
                    </ThemedText>
                    <View style={styles.latestValueMeta}>
                      <ThemedText type="smallBold" themeColor="textSecondary">
                        mg/dL
                      </ThemedText>
                      <ThemedText
                        type="smallBold"
                        style={{
                          color: getGlucoseStatusColor(getGlucoseStatus(latestRecord.value)),
                        }}>
                        {getGlucoseStatusLabel(getGlucoseStatus(latestRecord.value)).split(' ')[0]}
                      </ThemedText>
                    </View>
                  </View>
                ) : (
                  <ThemedText type="defaultSemiBold" style={{ marginTop: 4 }}>
                    Nenhum registro ainda
                  </ThemedText>
                )}

                {latestRecord && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {getContextLabel(latestRecord.context)} • {new Date(latestRecord.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às {new Date(latestRecord.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </ThemedText>
                )}
              </View>

              {/* Botão que aciona o BottomSheet */}
              <TouchableOpacity
                style={styles.openSheetButton}
                activeOpacity={0.85}
                onPress={() => setIsBottomSheetVisible(true)}>
                <ThemedText style={styles.buttonPlusIcon}>+</ThemedText>
                <ThemedText type="smallBold" style={styles.openSheetButtonText}>
                  Registrar Glicemia
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>

          Gráfico Simplificado & Intuitivo
          <GlucoseChart
            records={records}
            filter={timeFilter}
            onFilterChange={setTimeFilter}
          />

          {/* Histórico Recente de Medições */}
          <ThemedView type="backgroundElement" style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <ThemedText type="defaultSemiBold" style={styles.cardSectionTitle}>
                Histórico Recente
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Últimos registros
              </ThemedText>
            </View>

            {records.slice(0, 5).map((record) => {
              const status = getGlucoseStatus(record.value);
              const color = getGlucoseStatusColor(status);
              const date = new Date(record.timestamp);

              return (
                <View key={record.id} style={styles.historyRow}>
                  <View style={[styles.statusIndicator, { backgroundColor: color }]} />
                  <View style={styles.historyInfo}>
                    <ThemedText type="defaultSemiBold">
                      {record.value} mg/dL
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {getContextLabel(record.context)} • {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      {record.notes ? ` • ${record.notes}` : ''}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteRecord(record.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <ThemedText type="small" style={{ color: '#ef4444' }}>
                      Remover
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>

      {/* BottomSheet Modal para Registrar Glicemia */}
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
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
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
  headerBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  mainActionCard: {
    borderRadius: 20,
    padding: Spacing.four,
  },
  mainCardContent: {
    gap: Spacing.three,
  },
  statusTextSection: {
    gap: 4,
  },
  latestValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginVertical: 2,
  },
  latestValueNumber: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '800',
  },
  latestValueMeta: {
    paddingBottom: 6,
  },
  openSheetButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.one,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonPlusIcon: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  openSheetButtonText: {
    color: '#ffffff',
    fontSize: 15,
  },
  historyCard: {
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSectionTitle: {
    fontSize: 17,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
    gap: Spacing.three,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  historyInfo: {
    flex: 1,
  },
});
