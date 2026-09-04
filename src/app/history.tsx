import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDiabetes } from '@/context/diabetes-context';
import {
  GlucoseRecord,
  getContextLabel,
  getGlucoseStatus,
  getGlucoseStatusColor,
  getGlucoseStatusLabel,
} from '@/types/diabetes';
import { exportReportByEmail } from '@/services/export-service';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type HistoryFilter = 'all' | 'today' | '7d' | '30d';

export default function HistoryScreen() {
  const theme = useTheme();
  const { records, deleteRecord } = useDiabetes();

  const [activeFilter, setActiveFilter] = useState<HistoryFilter>('all');
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [patientName, setPatientName] = useState('');

  // Filtragem dos registros
  const filteredRecords = useMemo(() => {
    const now = new Date();
    const nowTime = now.getTime();

    return records.filter((r) => {
      const recordDate = new Date(r.timestamp);
      if (activeFilter === 'today') {
        return (
          recordDate.getDate() === now.getDate() &&
          recordDate.getMonth() === now.getMonth() &&
          recordDate.getFullYear() === now.getFullYear()
        );
      }
      if (activeFilter === '7d') {
        return nowTime - recordDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
      }
      if (activeFilter === '30d') {
        return nowTime - recordDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }, [records, activeFilter]);

  // Agrupamento por dia (YYYY-MM-DD)
  const groupedByDay = useMemo(() => {
    const groups: Record<string, { dateLabel: string; items: GlucoseRecord[] }> = {};

    filteredRecords.forEach((item) => {
      const d = new Date(item.timestamp);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      
      const todayKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

      let dateLabel = d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
      });

      if (key === todayKey) {
        dateLabel = 'Hoje, ' + d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      } else if (key === yesterdayKey) {
        dateLabel = 'Ontem, ' + d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      }

      if (!groups[key]) {
        groups[key] = { dateLabel, items: [] };
      }
      groups[key].items.push(item);
    });

    return Object.values(groups);
  }, [filteredRecords]);

  // Estatísticas rápidas do filtro
  const values = filteredRecords.map((r) => r.value);
  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const inRangeCount = values.filter((v) => v >= 70 && v <= 140).length;
  const inRangePct = values.length ? Math.round((inRangeCount / values.length) * 100) : 0;

  const handleExportConfirm = async () => {
    await exportReportByEmail(filteredRecords, {
      doctorEmail: doctorEmail.trim(),
      patientName: patientName.trim() || 'Paciente',
    });
    setExportModalVisible(false);
  };

  const handleDeleteWithConfirm = (id: string, value: number) => {
    if (Platform.OS === 'web') {
      if (confirm(`Deseja realmente excluir o registro de ${value} mg/dL?`)) {
        deleteRecord(id);
      }
    } else {
      Alert.alert(
        'Confirmar exclusão',
        `Deseja realmente remover o registro de ${value} mg/dL?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: () => deleteRecord(id) },
        ]
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Cabeçalho com Botão de Exportar para o Médico */}
        <View style={styles.header}>
          <View>
            <ThemedText type="small" themeColor="textSecondary">
              Relatórios &amp; Registros
            </ThemedText>
            <ThemedText type="title" style={styles.appTitle}>
              Histórico
            </ThemedText>
          </View>

          <TouchableOpacity
            style={styles.exportButton}
            activeOpacity={0.8}
            onPress={() => setExportModalVisible(true)}>
            <ThemedText style={styles.exportIcon}>📄</ThemedText>
            <ThemedText type="smallBold" style={styles.exportButtonText}>
              Enviar ao Médico
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Filtros de Período */}
        <View style={styles.filterRow}>
          {(
            [
              { key: 'all', label: 'Todos' },
              { key: 'today', label: 'Hoje' },
              { key: '7d', label: '7 dias' },
              { key: '30d', label: '30 dias' },
            ] as { key: HistoryFilter; label: string }[]
          ).map((item) => {
            const isSelected = activeFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setActiveFilter(item.key)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? '#3b82f6' : theme.backgroundElement,
                  },
                ]}>
                <ThemedText
                  type="smallBold"
                  style={{
                    color: isSelected ? '#ffffff' : theme.textSecondary,
                  }}>
                  {item.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Resumo do Período */}
        <ThemedView type="backgroundElement" style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <ThemedText type="small" themeColor="textSecondary">Total</ThemedText>
            <ThemedText type="defaultSemiBold">{filteredRecords.length} medições</ThemedText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <ThemedText type="small" themeColor="textSecondary">Média</ThemedText>
            <ThemedText type="defaultSemiBold" style={{ color: avg > 0 ? getGlucoseStatusColor(getGlucoseStatus(avg)) : theme.text }}>
              {avg > 0 ? `${avg} mg/dL` : '--'}
            </ThemedText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <ThemedText type="small" themeColor="textSecondary">Na Meta</ThemedText>
            <ThemedText type="defaultSemiBold" style={{ color: '#10b981' }}>
              {values.length > 0 ? `${inRangePct}%` : '--'}
            </ThemedText>
          </View>
        </ThemedView>

        {/* Lista de Registros Agrupados por Dia */}
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {filteredRecords.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText type="subtitle" style={{ fontSize: 32 }}>📋</ThemedText>
              <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>
                Nenhum registro encontrado
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: 4 }}>
                Cadastre novas medições na tela inicial para acompanhar o seu progresso aqui.
              </ThemedText>
            </View>
          ) : (
            groupedByDay.map((group, groupIdx) => (
              <View key={`group-${groupIdx}`} style={styles.dayGroup}>
                <ThemedText type="smallBold" style={styles.dayHeader}>
                  {group.dateLabel.toUpperCase()}
                </ThemedText>

                <ThemedView type="backgroundElement" style={styles.groupCard}>
                  {group.items.map((record, idx) => {
                    const color = getGlucoseStatusColor(getGlucoseStatus(record.value));
                    const isLast = idx === group.items.length - 1;
                    const time = new Date(record.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <View
                        key={record.id}
                        style={[
                          styles.recordRow,
                          !isLast && { borderBottomWidth: 1, borderBottomColor: 'rgba(150, 150, 150, 0.1)' },
                        ]}>
                        {/* Indicador de Status com Pílula colorida */}
                        <View style={[styles.statusBadge, { backgroundColor: `${color}20` }]}>
                          <View style={[styles.statusDot, { backgroundColor: color }]} />
                          <ThemedText type="smallBold" style={{ color: color, fontSize: 13 }}>
                            {record.value}
                          </ThemedText>
                        </View>

                        {/* Informações de Momento e Hora */}
                        <View style={styles.recordDetails}>
                          <ThemedText type="defaultSemiBold" style={{ fontSize: 15 }}>
                            {getContextLabel(record.context)}
                          </ThemedText>
                          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                            {time} • {getGlucoseStatusLabel(getGlucoseStatus(record.value)).split(' ')[0]}
                            {record.notes ? ` • ${record.notes}` : ''}
                          </ThemedText>
                        </View>

                        {/* Botão de Exclusão */}
                        <TouchableOpacity
                          onPress={() => handleDeleteWithConfirm(record.id, record.value)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          style={styles.deleteBtn}>
                          <ThemedText type="small" style={{ color: '#ef4444' }}>
                            ✕
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ThemedView>
              </View>
            ))
          )}
        </ScrollView>

        {/* Modal de Exportação para o Médico */}
        <Modal
          visible={exportModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setExportModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <ThemedView type="backgroundElement" style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle" style={{ fontSize: 20 }}>
                  Exportar Relatório
                </ThemedText>
                <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                  <ThemedText type="defaultSemiBold" themeColor="textSecondary">✕</ThemedText>
                </TouchableOpacity>
              </View>

              <ThemedText type="small" themeColor="textSecondary">
                Será gerado um resumo detalhado com estatísticas e todas as {filteredRecords.length} medições do filtro atual ({activeFilter === 'all' ? 'todo o período' : activeFilter}).
              </ThemedText>

              <View style={styles.formGroup}>
                <ThemedText type="smallBold" style={styles.inputLabel}>
                  E-mail do Médico / Nutricionista (opcional)
                </ThemedText>
                <TextInput
                  value={doctorEmail}
                  onChangeText={setDoctorEmail}
                  placeholder="doutor@clinica.com"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText type="smallBold" style={styles.inputLabel}>
                  Seu Nome (para identificar o relatório)
                </ThemedText>
                <TextInput
                  value={patientName}
                  onChangeText={setPatientName}
                  placeholder="Ex: João da Silva"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setExportModalVisible(false)}
                  style={[styles.modalCancelBtn, { borderColor: 'rgba(150,150,150,0.3)' }]}>
                  <ThemedText type="defaultSemiBold" themeColor="textSecondary">
                    Cancelar
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleExportConfirm}
                  style={styles.modalConfirmBtn}>
                  <ThemedText type="defaultSemiBold" style={{ color: '#ffffff' }}>
                    Enviar por E-mail
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          </View>
        </Modal>
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
    fontSize: 26,
    fontWeight: '800',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  exportIcon: {
    fontSize: 14,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    gap: 8,
    marginVertical: Spacing.two,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 14,
  },
  summaryItem: {
    alignItems: 'center',
    gap: 2,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.six,
    gap: Spacing.three,
  },
  emptyContainer: {
    padding: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  dayGroup: {
    gap: Spacing.one,
  },
  dayHeader: {
    fontSize: 12,
    letterSpacing: 0.5,
    opacity: 0.7,
    marginLeft: Spacing.two,
  },
  groupCard: {
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordDetails: {
    flex: 1,
    gap: 2,
  },
  deleteBtn: {
    padding: Spacing.two,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalBox: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
  },
  modalInput: {
    height: 46,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmBtn: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
