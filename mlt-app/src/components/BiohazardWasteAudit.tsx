import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';

export default function BiohazardWasteAudit({
  orderId = 'ORD-8921',
}: {
  orderId?: string;
}) {
  const [sharpsCount, setSharpsCount] = useState(2);
  const [yellowBagChecked, setYellowBagChecked] = useState(true);
  const [redBagChecked, setRedBagChecked] = useState(true);
  const [punctureProofChecked, setPunctureProofChecked] = useState(true);
  const [disposed, setDisposed] = useState(false);

  const handleConfirmDisposal = () => {
    setDisposed(true);
    const msg = `✅ Biomedical Waste Audit Certified! ${sharpsCount} Sharps and biohazard waste accounted and segregated per CPCB guidelines.`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(msg);
    } else {
      Alert.alert('Biohazard Audit Logged', msg);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>☣️</Text>
          <Text style={styles.title}>BIOMEDICAL WASTE & SHARPS AUDIT</Text>
        </View>
        <View style={[styles.badge, disposed && { backgroundColor: '#064e3b' }]}>
          <Text style={[styles.badgeText, disposed && { color: '#34d399' }]}>
            {disposed ? '✓ AUDIT SIGNED' : 'CPCB COMPLIANCE'}
          </Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Color-coded segregation check to ensure zero needle-stick injury and safe clinical waste disposal.
      </Text>

      {/* Waste Categories Grid */}
      <View style={styles.segregationList}>
        <TouchableOpacity
          style={styles.segItem}
          onPress={() => setPunctureProofChecked(!punctureProofChecked)}
        >
          <View style={[styles.checkCircle, punctureProofChecked && styles.checkActive]}>
            {punctureProofChecked && <Text style={styles.checkText}>✓</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.segTitle}>⚪ White Translucent Puncture-Proof Container</Text>
            <Text style={styles.segDesc}>{sharpsCount} Used Needles / Lancets / Scalpels secured</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.segItem}
          onPress={() => setYellowBagChecked(!yellowBagChecked)}
        >
          <View style={[styles.checkCircle, yellowBagChecked && styles.checkActive]}>
            {yellowBagChecked && <Text style={styles.checkText}>✓</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.segTitle}>🟡 Yellow Biohazard Bag</Text>
            <Text style={styles.segDesc}>Soiled Cotton, alcohol swabs, blood-soaked gauze</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.segItem}
          onPress={() => setRedBagChecked(!redBagChecked)}
        >
          <View style={[styles.checkCircle, redBagChecked && styles.checkActive]}>
            {redBagChecked && <Text style={styles.checkText}>✓</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.segTitle}>🔴 Red Contaminated Bag</Text>
            <Text style={styles.segDesc}>Disposable syringe barrels, plastic vacutainer holders, nitrile gloves</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.confirmBtn, disposed && styles.confirmBtnDone]}
        onPress={handleConfirmDisposal}
        disabled={disposed}
      >
        <Text style={styles.confirmBtnText}>
          {disposed ? '✓ Biomedical Waste Disposal Certified' : 'Certify Biomedical Waste Segregation ☣️'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
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
    backgroundColor: '#854d0e',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fef08a',
    fontSize: 8,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 10,
  },
  segregationList: {
    gap: 8,
    marginBottom: 12,
  },
  segItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  segTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  segDesc: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 1,
  },
  confirmBtn: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmBtnDone: {
    backgroundColor: '#1e293b',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
