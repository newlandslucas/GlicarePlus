import { GlucoseRecord, getContextLabel, getGlucoseStatus, getGlucoseStatusLabel } from '@/types/diabetes';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';

export interface DoctorExportOptions {
  doctorEmail?: string;
  patientName?: string;
  daysRange?: number; // 7, 30, 90 ou total
}

export function generateDoctorReportText(
  records: GlucoseRecord[],
  options?: DoctorExportOptions
): string {
  const patient = options?.patientName || 'Paciente';
  const now = new Date();
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const values = sortedRecords.map((r) => r.value);
  const total = values.length;
  const avg = total > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / total) : 0;
  const min = total > 0 ? Math.min(...values) : 0;
  const max = total > 0 ? Math.max(...values) : 0;

  const lowCount = values.filter((v) => v < 70).length;
  const inRangeCount = values.filter((v) => v >= 70 && v <= 140).length;
  const highCount = values.filter((v) => v > 140).length;

  const inRangePct = total > 0 ? Math.round((inRangeCount / total) * 100) : 0;

  let text = `RELATÓRIO DE MONITORAMENTO GLICÊMICO - GLICARE+\n`;
  text += `Data do Relatório: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}\n`;
  text += `Paciente: ${patient}\n`;
  text += `--------------------------------------------------\n`;
  text += `RESUMO ESTATÍSTICO:\n`;
  text += `• Total de Medições: ${total}\n`;
  text += `• Glicemia Média: ${avg} mg/dL\n`;
  text += `• Mínima: ${min} mg/dL | Máxima: ${max} mg/dL\n`;
  text += `• Tempo na Meta (70-140 mg/dL): ${inRangePct}%\n`;
  text += `• Hipoglicemias (<70 mg/dL): ${lowCount} ocorrência(s)\n`;
  text += `• Hiperglicemias (>140 mg/dL): ${highCount} ocorrência(s)\n`;
  text += `--------------------------------------------------\n`;
  text += `REGISTROS DETALHADOS:\n\n`;

  // Agrupado por data mais recente primeiro
  const reversedForListing = [...sortedRecords].reverse();
  reversedForListing.forEach((r) => {
    const d = new Date(r.timestamp);
    const dateStr = d.toLocaleDateString('pt-BR');
    const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const status = getGlucoseStatusLabel(getGlucoseStatus(r.value)).split(' ')[0];
    const ctx = getContextLabel(r.context);
    const notesStr = r.notes ? ` - Obs: ${r.notes}` : '';

    text += `[${dateStr} ${timeStr}] ${r.value} mg/dL (${status}) | ${ctx}${notesStr}\n`;
  });

  text += `\n--------------------------------------------------\n`;
  text += `Gerado automaticamente pelo aplicativo Glicare+\n`;

  return text;
}

export async function exportReportByEmail(
  records: GlucoseRecord[],
  options?: DoctorExportOptions
) {
  if (records.length === 0) {
    const msg = 'Não há registros de glicemia para exportar.';
    if (Platform.OS === 'web') alert(msg);
    else Alert.alert('Aviso', msg);
    return;
  }

  const doctorEmail = options?.doctorEmail || '';
  const subject = encodeURIComponent('Relatório de Glicemia - Glicare+');
  const body = encodeURIComponent(generateDoctorReportText(records, options));

  const mailtoUrl = `mailto:${doctorEmail}?subject=${subject}&body=${body}`;

  try {
    const canOpen = await Linking.canOpenURL(mailtoUrl);
    if (canOpen) {
      await Linking.openURL(mailtoUrl);
    } else {
      await Linking.openURL(mailtoUrl);
    }
  } catch {
    const errorMsg = 'Não foi possível abrir o aplicativo de e-mail automaticamente. O relatório foi preparado.';
    if (Platform.OS === 'web') alert(errorMsg);
    else Alert.alert('Erro', errorMsg);
  }
}
