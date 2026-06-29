'use client'

import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer'

Font.register({
  family: 'Helvetica',
  src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2'
})

const styles = StyleSheet.create({
  page: { padding: 32, fontFamily: 'Helvetica', backgroundColor: '#ffffff', fontSize: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28, borderBottom: '2px solid #4f46e5', paddingBottom: 16 },
  clinicName: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  clinicSub: { fontSize: 9, color: '#64748b', marginTop: 3 },
  invoiceBadge: { backgroundColor: '#4f46e5', color: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, fontSize: 12, fontWeight: 'bold' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  infoRow: { flexDirection: 'row', gap: 32, marginBottom: 16 },
  infoBox: { flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' },
  infoLabel: { fontSize: 8, color: '#94a3b8', marginBottom: 3, textTransform: 'uppercase' },
  infoValue: { fontSize: 11, color: '#1e293b', fontWeight: 'bold' },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e293b', padding: '8 10', borderRadius: 4 },
  tableHeaderText: { color: 'white', fontWeight: 'bold', fontSize: 9, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', padding: '10 10', borderBottom: '1px solid #f1f5f9' },
  tableRowAlt: { flexDirection: 'row', padding: '10 10', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fafafa' },
  col1: { flex: 3 }, col2: { flex: 1, textAlign: 'center' }, col3: { flex: 1, textAlign: 'right' }, col4: { flex: 1, textAlign: 'right' },
  totalBox: { marginTop: 16, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', width: 200, padding: '5 0' },
  totalLabel: { color: '#64748b', fontSize: 10 },
  totalValue: { fontWeight: 'bold', color: '#1e293b', fontSize: 10 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', width: 200, padding: '8 0', borderTop: '2px solid #4f46e5', marginTop: 4 },
  grandLabel: { fontWeight: 'bold', color: '#4f46e5', fontSize: 13 },
  grandValue: { fontWeight: 'bold', color: '#4f46e5', fontSize: 13 },
  statusBadge: { padding: '4 10', borderRadius: 4, fontSize: 10, fontWeight: 'bold', alignSelf: 'flex-start', marginTop: 4 },
  footer: { position: 'absolute', bottom: 24, left: 32, right: 32, borderTop: '1px solid #e2e8f0', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#94a3b8' },
  notes: { backgroundColor: '#fffbeb', padding: 12, borderRadius: 6, border: '1px solid #fde68a', marginTop: 16 }
})

interface InvoicePDFProps {
  invoice: {
    invoiceNo: string
    status: string
    totalAmount: number
    createdAt: Date | string
    notes?: string | null
    patient: { name: string; species: string; breed?: string | null; owner: { firstName: string; lastName?: string | null; phone: string } }
    items: { name: string; quantity: number; unitPrice: number; total: number }[]
  }
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  PAID: { bg: '#dcfce7', text: '#16a34a', label: '✓ ÖDƏNİLDİ' },
  UNPAID: { bg: '#fee2e2', text: '#dc2626', label: '⏳ ÖDƏNMƏYIB' },
  PARTIAL: { bg: '#fef9c3', text: '#ca8a04', label: '◑ QİSMƏN ÖDƏNİLDİ' },
}

export function InvoicePDF({ invoice }: InvoicePDFProps) {
  const st = statusColors[invoice.status] || statusColors.UNPAID
  const date = new Date(invoice.createdAt).toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <Document>
      <Page size={[226, 600]} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.clinicName}>🐾 VetKlinika</Text>
            <Text style={styles.clinicSub}>Baytarlıq Klinikası</Text>
            <Text style={styles.clinicSub}>📍 Ünvan: Bakı şəhəri</Text>
            <Text style={styles.clinicSub}>📞 Tel: +994 xx xxx xx xx</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={styles.invoiceBadge}>
              <Text>QƏBİZ</Text>
            </View>
            <Text style={{ fontSize: 9, color: '#64748b', marginTop: 6 }}>{invoice.invoiceNo}</Text>
            <Text style={{ fontSize: 9, color: '#64748b' }}>{date}</Text>
          </View>
        </View>

        {/* Patient & Owner Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>🐶 Xəstə</Text>
            <Text style={styles.infoValue}>{invoice.patient.name}</Text>
            <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{invoice.patient.species}{invoice.patient.breed ? ` — ${invoice.patient.breed}` : ''}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>👤 Sahib</Text>
            <Text style={styles.infoValue}>{invoice.patient.owner.firstName} {invoice.patient.owner.lastName || ''}</Text>
            <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{invoice.patient.owner.phone}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>Xidmət / Məhsul</Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>Miq.</Text>
            <Text style={[styles.tableHeaderText, styles.col3]}>Qiymət</Text>
            <Text style={[styles.tableHeaderText, styles.col4]}>Cəm</Text>
          </View>
          {invoice.items.map((item, i) => (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={styles.col1}>{item.name}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>{item.unitPrice.toFixed(2)} ₼</Text>
              <Text style={styles.col4}>{item.total.toFixed(2)} ₼</Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalBox}>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandLabel}>CƏMİ:</Text>
            <Text style={styles.grandValue}>{invoice.totalAmount.toFixed(2)} ₼</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={{ color: st.text }}>{st.label}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={{ fontSize: 8, color: '#92400e', fontWeight: 'bold', marginBottom: 3 }}>QEYD:</Text>
            <Text style={{ fontSize: 9, color: '#78350f' }}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Sağlıqlı həyat, sağlam heyvanlar 🐾</Text>
          <Text style={styles.footerText}>{invoice.invoiceNo} • VetKlinika</Text>
        </View>
      </Page>
    </Document>
  )
}
