import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MeasurementContext, getContextLabel } from '@/types/diabetes';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface AddGlucoseBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (value: number, context: MeasurementContext, notes?: string) => void;
}

const CONTEXTS: { key: MeasurementContext; label: string; icon: string }[] = [
  { key: 'fasting', label: 'Jejum', icon: '🌅' },
  { key: 'before_meal', label: 'Antes de comer', icon: '🍽️' },
  { key: 'after_meal', label: 'Pós refeição', icon: '🥗' },
  { key: 'bedtime', label: 'Antes de dormir', icon: '🌙' },
  { key: 'other', label: 'Outro', icon: '⏱️' },
];

export function AddGlucoseBottomSheet({
  visible,
  onClose,
  onSave,
}: AddGlucoseBottomSheetProps) {
  const theme = useTheme();
  const [value, setValue] = useState('');
  const [selectedContext, setSelectedContext] = useState<MeasurementContext>('fasting');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    const num = parseInt(value.trim(), 10);
    if (isNaN(num) || num < 20 || num > 600) {
      if (Platform.OS === 'web') {
        alert('Digite um valor de glicemia válido (entre 20 e 600 mg/dL).');
      } else {
        Alert.alert('Valor inválido', 'Digite um valor de glicemia válido (entre 20 e 600 mg/dL).');
      }
      return;
    }

    onSave(num, selectedContext, notes.trim() || undefined);
    setValue('');
    setNotes('');
    setSelectedContext('fasting');
    onClose();
  };

  const handleClose = () => {
    setValue('');
    setNotes('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <ThemedView type="backgroundElement" style={styles.sheetContainer}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <ThemedText type="subtitle" style={styles.title}>
                Nova Glicemia
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Informe o valor medido e o momento
              </ThemedText>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <ThemedText type="defaultSemiBold" themeColor="textSecondary">
                ✕
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Input Principal Grande */}
          <View style={[styles.inputBox, { backgroundColor: theme.background }]}>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              maxLength={3}
              autoFocus={visible}
              style={[styles.bigInput, { color: theme.text }]}
            />
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.unitText}>
              mg/dL
            </ThemedText>
          </View>

          {/* Seleção de Momento / Contexto */}
          <View style={styles.section}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              Momento da medição
            </ThemedText>
            <View style={styles.contextGrid}>
              {CONTEXTS.map((ctx) => {
                const isSelected = selectedContext === ctx.key;
                return (
                  <TouchableOpacity
                    key={ctx.key}
                    onPress={() => setSelectedContext(ctx.key)}
                    style={[
                      styles.contextCard,
                      {
                        backgroundColor: isSelected
                          ? '#3b82f6'
                          : theme.background,
                        borderColor: isSelected
                          ? '#3b82f6'
                          : 'rgba(150, 150, 150, 0.2)',
                      },
                    ]}>
                    <ThemedText style={styles.contextIcon}>{ctx.icon}</ThemedText>
                    <ThemedText
                      type="smallBold"
                      style={[
                        styles.contextText,
                        { color: isSelected ? '#ffffff' : theme.text },
                      ]}>
                      {ctx.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Observação opcional */}
          <View style={styles.section}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              Observação (opcional)
            </ThemedText>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Ex: Após caminhada, antes do almoço..."
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.notesInput,
                { backgroundColor: theme.background, color: theme.text },
              ]}
              maxLength={60}
            />
          </View>

          {/* Botões de Ação */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.cancelBtn, { borderColor: 'rgba(150,150,150,0.3)' }]}>
              <ThemedText type="defaultSemiBold" themeColor="textSecondary">
                Cancelar
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.saveBtn,
                { opacity: value.trim().length > 0 ? 1 : 0.6 },
              ]}>
              <ThemedText type="defaultSemiBold" style={styles.saveBtnText}>
                Salvar Registro
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Platform.OS === 'ios' ? Spacing.six : Spacing.four,
    gap: Spacing.three,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(150, 150, 150, 0.4)',
    alignSelf: 'center',
    marginVertical: Spacing.one,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: Spacing.one,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  closeButton: {
    padding: Spacing.one,
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    marginVertical: Spacing.one,
  },
  bigInput: {
    fontSize: 42,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 120,
  },
  unitText: {
    fontSize: 18,
    marginLeft: 8,
    marginTop: 10,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  contextGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  contextIcon: {
    fontSize: 16,
  },
  contextText: {
    fontSize: 13,
  },
  notesInput: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flex: 2,
    height: 50,
    backgroundColor: '#3b82f6',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
