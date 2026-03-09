import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 11, lineHeight: 1.4 },
  title: { fontSize: 18, marginBottom: 12, fontWeight: 700 },
  section: { marginBottom: 10 },
  label: { fontWeight: 700, marginBottom: 2 },
});

export interface ReportPdfData {
  dipendente: string;
  cantiere: string;
  data: string;
  testo: string;
  materiali?: string;
  problemi?: string;
}

export function ReportDocument({ data }: { data: ReportPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Report Giornaliero - Global Impianti</Text>

        <View style={styles.section}>
          <Text>Dipendente: {data.dipendente}</Text>
          <Text>Cantiere: {data.cantiere}</Text>
          <Text>Data: {data.data}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Attivita svolte</Text>
          <Text>{data.testo}</Text>
        </View>

        {data.materiali ? (
          <View style={styles.section}>
            <Text style={styles.label}>Materiali utilizzati</Text>
            <Text>{data.materiali}</Text>
          </View>
        ) : null}

        {data.problemi ? (
          <View style={styles.section}>
            <Text style={styles.label}>Problemi riscontrati</Text>
            <Text>{data.problemi}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
