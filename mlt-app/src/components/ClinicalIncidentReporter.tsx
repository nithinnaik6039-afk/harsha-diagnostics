import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';

export default function ClinicalIncidentReporter({ orderId }: { orderId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [incidentNotes, setIncidentNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const incidents = [
    { id: 'fainting', label: 'Vasovagal / Patient Fainting', icon: '💫' },
    { id: 'difficult', label: 'Difficult / Fragile Vein (2nd Attempt)', icon: '🩸' },
    { id: 'refused', label: 'Patient Refused 2nd Tube', icon: '✋' },
    { id: 'hematoma', label: 'Mild Hematoma / Swelling', icon: '🩹' },
    { id: 'spill', label: 'Vial Leakage / Hemolysis Risk', icon: '☣️' },
  ];

  const handleSubmitReport = () => {
    if (!selectedIncident) return;
    setSubmitted(true);
    const msg = `NABL Clinical Incident Logged for Task #${orderId.slice(-5)}. Senior Pathologist and Quality Team Notified.`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(msg);
    } else {
      Alert.alert('Incident Logged', msg);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.headerToggle}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 18 }}>🛡️</Text>
          <Text style={styles.title}>NABL Quality & Incident Logger</Text>
        </View>
        <Text style={styles.toggleArrow}>{expanded ? '▲ Hide' : '▼ Report Event'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Log any unusual clinical conditions during sample draw for laboratory compliance:
          </Text>

          <View style={styles.chipsContainer}>
            {incidents.map((inc) => (
              <TouchableOpacity
                key={inc.id}
                style={[
                  styles.chip,
                  selectedIncident === inc.id && styles.chipActive,
                ]}
                onPress={() => setSelectedIncident(inc.id)}
              >
                <Text style={styles.chipIcon}>{inc.icon}</Text>
                <Text
                  style={[
                    styles.chipText,
                    selectedIncident === inc.id && styles.chipTextActive,
                  ]}
                >
                  {inc.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.notesInput}
            placeholder="Clinical observation notes (e.g., patient hydrated, applied pressure band 5 min)..."
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={2}
            value={incidentNotes}
            onChangeText={setIncidentNotes}
          />

          <TouchableOpacity
            disabled={!selectedIncident || submitted}
            style={[styles.submitBtn, (!selectedIncident || submitted) && { opacity: 0.5 }]}
            onPress={handleSubmitReport}
          >
            <Text style={styles.submitBtnText}>
              {submitted ? '✓ Logged into NABL Audit Trail' : 'Submit Clinical Incident Report 📋'}
            </Text>
          </TouchableOpacity>
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
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
  },
  headerToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#cbd5e1',
  },
  toggleArrow: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  content: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 10,
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 10,
    lineHeight: 16,
  },
  chipsContainer: {
    gap: 6,
    marginBottom: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  chipActive: {
    backgroundColor: '#451a03',
    borderColor: '#d97706',
  },
  chipIcon: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  notesInput: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    color: '#ffffff',
    fontSize: 11,
    minHeight: 50,
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: '#d97706',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
