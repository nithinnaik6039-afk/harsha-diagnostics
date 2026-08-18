import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Alert } from 'react-native';

export default function EmergencySOSModal() {
  const [active, setActive] = useState(false);
  const [sentAlert, setSentAlert] = useState(false);

  const handleTriggerSOS = () => {
    setSentAlert(true);
    const msg = '🚨 SOS SECURITY ALERT SENT! Harsha Central Security Dispatch, Local Hub Manager & Police Hotline alerted with your live GPS coordinates.';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(msg);
    } else {
      Alert.alert('🚨 SOS DISPATCHED', msg);
    }
  };

  return (
    <>
      {/* Floating or Top SOS Trigger */}
      <TouchableOpacity
        style={styles.sosTriggerBtn}
        onPress={() => setActive(true)}
      >
        <Text style={styles.sosTriggerIcon}>🚨</Text>
        <Text style={styles.sosTriggerText}>SOS</Text>
      </TouchableOpacity>

      {/* Full Modal Overlay */}
      {active && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.headerRow}>
              <Text style={styles.modalTitle}>🚨 Field Security SOS</Text>
              <TouchableOpacity onPress={() => { setActive(false); setSentAlert(false); }}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Use this in case of medical emergency, accident, or threat during home sample collection:
            </Text>

            <TouchableOpacity
              style={[styles.bigSosBtn, sentAlert && styles.bigSosBtnSent]}
              onPress={handleTriggerSOS}
            >
              <Text style={{ fontSize: 32 }}>🚨</Text>
              <Text style={styles.bigSosText}>
                {sentAlert ? '✓ SOS BROADCASTED (GPS SENT)' : 'PRESS TO BROADCAST EMERGENCY SOS'}
              </Text>
            </TouchableOpacity>

            <View style={styles.quickContactsRow}>
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => Linking.openURL('tel:18002008899')}
              >
                <Text style={styles.contactBtnText}>📞 Lab Hub Manager</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: '#450a0a', borderColor: '#ef4444' }]}
                onPress={() => Linking.openURL('tel:112')}
              >
                <Text style={[styles.contactBtnText, { color: '#f87171' }]}>🚓 Police (112)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sosTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#450a0a',
    borderColor: '#ef4444',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sosTriggerIcon: {
    fontSize: 12,
  },
  sosTriggerText: {
    color: '#f87171',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(9, 13, 22, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#ef4444',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f87171',
  },
  closeBtn: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: 'bold',
    padding: 4,
  },
  modalDesc: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
    marginBottom: 16,
  },
  bigSosBtn: {
    backgroundColor: '#7f1d1d',
    borderColor: '#ef4444',
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  bigSosBtnSent: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  bigSosText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  quickContactsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  contactBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  contactBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
});
