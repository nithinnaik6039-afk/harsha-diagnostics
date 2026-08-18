import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Alert } from 'react-native';

export default function CriticalPanicValueNotifier({
  patientName = 'Rajesh Varma',
}: {
  patientName?: string;
}) {
  const [activeAlert, setActiveAlert] = useState(false);
  const [selectedPanic, setSelectedPanic] = useState<string | null>(null);

  const panicValues = [
    { id: '1', test: 'Random Blood Sugar', value: '42 mg/dL', severity: 'Severe Hypoglycemia (<50 mg/dL)' },
    { id: '2', test: 'Capillary Potassium', value: '6.8 mmol/L', severity: 'Critical Hyperkalemia (>6.0)' },
    { id: '3', test: 'Point-of-Care Troponin I', value: 'Positive', severity: 'Acute Coronary Syndrome Alert' },
  ];

  const handleTriggerPanic = (panic: any) => {
    setSelectedPanic(panic.test);
    setActiveAlert(true);
    const msg = `🚨 CRITICAL PANIC VALUE ALERT!\n\nPatient: ${patientName}\nTest: ${panic.test} (${panic.value})\nStatus: ${panic.severity}\n\nHarsha Medical Director & Emergency Physician dispatched.`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(msg);
    } else {
      Alert.alert('🚨 RED ALERT TRIGGERED', msg);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>🚨</Text>
          <Text style={styles.title}>CRITICAL PANIC VALUE RED ALERT</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>EMERGENCY POC</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Immediate escalation protocol for life-threatening point-of-care test results.
      </Text>

      <View style={styles.list}>
        {panicValues.map((p) => {
          const isTriggered = selectedPanic === p.test && activeAlert;
          return (
            <View key={p.id} style={[styles.panicCard, isTriggered && styles.panicCardActive]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.panicTest}>{p.test}: <Text style={{ color: '#f87171', fontWeight: 'bold' }}>{p.value}</Text></Text>
                <Text style={styles.panicSev}>{p.severity}</Text>
              </View>
              <TouchableOpacity
                style={[styles.alertBtn, isTriggered && styles.alertBtnDone]}
                onPress={() => handleTriggerPanic(p)}
              >
                <Text style={styles.alertBtnText}>{isTriggered ? '✓ Escalate' : '🚨 Escalate'}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#3b0d0d',
    borderColor: '#7f1d1d',
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
    color: '#fca5a5',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: '#7f1d1d',
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
    fontSize: 10,
    color: '#fecaca',
    marginBottom: 10,
  },
  list: {
    gap: 8,
  },
  panicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e1b1b',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  panicCardActive: {
    backgroundColor: '#450a0a',
    borderColor: '#ef4444',
  },
  panicTest: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  panicSev: {
    fontSize: 9,
    color: '#f87171',
    marginTop: 2,
  },
  alertBtn: {
    backgroundColor: '#7f1d1d',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  alertBtnDone: {
    backgroundColor: '#064e3b',
  },
  alertBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
