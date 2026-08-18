import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Alert } from 'react-native';

export default function PatientCommunicationMask({
  patientName = 'Rajesh Varma',
  phone = '9876543210',
}: {
  patientName?: string;
  phone?: string;
}) {
  const [sentPreset, setSentPreset] = useState<string | null>(null);

  const presets = [
    { id: '1', text: '🚗 I am 5 minutes away. Please keep patient seated.' },
    { id: '2', text: '📍 I have arrived at your building gate / door.' },
    { id: '3', text: '💧 Please ensure patient is in fasting state (water only).' },
    { id: '4', text: '🔑 Please keep your 4-digit verification PIN ready.' },
  ];

  const handleMaskedCall = () => {
    // Virtual IVR / Masked number routing
    const maskedNumber = 'tel:+918040209900';
    Linking.openURL(maskedNumber);
  };

  const handleSendPreset = (text: string) => {
    setSentPreset(text);
    const msg = `SMS Sent to Patient (${patientName}) via Harsha SMS Gateway: "${text}"`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(msg);
    } else {
      Alert.alert('Message Sent', msg);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Masked Call Button */}
      <View style={styles.header}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.title}>🔒 Secure Patient Contact</Text>
            <View style={styles.maskPill}>
              <Text style={styles.maskPillText}>NUMBER MASKED</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Privacy protected virtual IVR gateway</Text>
        </View>

        <TouchableOpacity style={styles.callBtn} onPress={handleMaskedCall}>
          <Text style={styles.callBtnText}>📞 Masked Call</Text>
        </TouchableOpacity>
      </View>

      {/* 1-Tap Quick SMS Presets */}
      <Text style={styles.presetsLabel}>1-TAP WHATSAPP / SMS PRESETS:</Text>
      <View style={styles.presetGrid}>
        {presets.map((p) => {
          const isSelected = sentPreset === p.text;
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.presetCard, isSelected && styles.presetCardSelected]}
              onPress={() => handleSendPreset(p.text)}
            >
              <Text style={[styles.presetText, isSelected && styles.presetTextSelected]}>
                {p.text}
              </Text>
              {isSelected && <Text style={styles.sentCheck}>✓ Sent</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  maskPill: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  maskPillText: {
    color: '#34d399',
    fontSize: 8,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  callBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  callBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  presetsLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  presetGrid: {
    gap: 6,
  },
  presetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
  },
  presetCardSelected: {
    backgroundColor: '#064e3b',
    borderColor: '#059669',
  },
  presetText: {
    fontSize: 11,
    color: '#cbd5e1',
    flex: 1,
  },
  presetTextSelected: {
    color: '#34d399',
    fontWeight: 'bold',
  },
  sentCheck: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});
