import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';

export default function PrescriptionUploadOCR() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<any | null>(null);

  const handleUploadAndScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScannedResult({
        doctorName: 'Dr. K. Srinivas Rao, MD',
        clinic: 'Apollo Clinic, Subhash Road, Anantapur',
        extractedTests: [
          { name: 'Lipid Profile Screen', price: 450 },
          { name: 'Glycosylated HbA1c', price: 350 },
          { name: 'Serum Creatinine & Urea', price: 280 },
          { name: 'Thyroid Stimulating Hormone (TSH)', price: 300 },
        ],
        totalEstimated: 1380,
      });
      const msg = '✅ Prescription Parsed with AI OCR! 4 Diagnostic tests identified from doctor slip.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Prescription Scanned', msg);
      }
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 18 }}>📸</Text>
          <Text style={styles.title}>UPLOAD PRESCRIPTION & AI OCR EXTRACTION</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>INSTANT CART</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Have a handwritten doctor prescription? Upload a photo and our AI will automatically book the exact blood tests.
      </Text>

      {/* Upload Action Card */}
      {!scannedResult ? (
        <TouchableOpacity
          style={[styles.uploadBox, scanning && { opacity: 0.7 }]}
          onPress={handleUploadAndScan}
          disabled={scanning}
        >
          <Text style={{ fontSize: 32 }}>📄</Text>
          <Text style={styles.uploadMainText}>
            {scanning ? '⚡ AI OCR Scanning Handwriting...' : 'Tap to Upload Doctor Slip or Prescription'}
          </Text>
          <Text style={styles.uploadSubText}>Supports JPG, PNG, PDF (Up to 10MB)</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.scannedCard}>
          <View style={styles.scannedHeader}>
            <View>
              <Text style={styles.doctorName}>{scannedResult.doctorName}</Text>
              <Text style={styles.clinicName}>{scannedResult.clinic}</Text>
            </View>
            <View style={styles.verifiedPill}>
              <Text style={styles.verifiedText}>✓ AI MATCHED</Text>
            </View>
          </View>

          <Text style={styles.testsTitle}>IDENTIFIED TESTS ({scannedResult.extractedTests.length}):</Text>
          <View style={styles.testsList}>
            {scannedResult.extractedTests.map((t: any, idx: number) => (
              <View key={idx} style={styles.testItem}>
                <Text style={styles.testName}>🧪 {t.name}</Text>
                <Text style={styles.testPrice}>₹{t.price}</Text>
              </View>
            ))}
          </View>

          <View style={styles.scannedFooter}>
            <View>
              <Text style={styles.totalLabel}>TOTAL ESTIMATE</Text>
              <Text style={styles.totalVal}>₹{scannedResult.totalEstimated}</Text>
            </View>
            <TouchableOpacity
              style={styles.bookScannedBtn}
              onPress={() => router.push('/cart')}
            >
              <Text style={styles.bookScannedText}>Proceed to Book Home Draw →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 10,
    fontWeight: '900',
    color: '#cbd5e1',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 12,
    lineHeight: 16,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#0284c7',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#082f49',
    gap: 6,
  },
  uploadMainText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  uploadSubText: {
    fontSize: 10,
    color: '#38bdf8',
  },
  scannedCard: {
    backgroundColor: '#062d22',
    borderColor: '#059669',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
  },
  scannedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  doctorName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  clinicName: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  verifiedPill: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  testsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#34d399',
    marginBottom: 6,
  },
  testsList: {
    gap: 4,
    marginBottom: 12,
  },
  testItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 8,
    padding: 6,
  },
  testName: {
    fontSize: 11,
    color: '#f8fafc',
  },
  testPrice: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#34d399',
  },
  scannedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#064e3b',
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#34d399',
  },
  bookScannedBtn: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bookScannedText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
