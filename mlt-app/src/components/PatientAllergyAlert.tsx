import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PatientAllergyAlert({
  allergies = ['Latex Sensitivity', 'On Blood Thinner (Aspirin 75mg)'],
}: {
  allergies?: string[];
}) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>⚠️</Text>
          <Text style={styles.title}>PATIENT CLINICAL ALERTS & ALLERGIES</Text>
        </View>
        <View style={styles.cautionBadge}>
          <Text style={styles.cautionText}>HIGH CAUTION</Text>
        </View>
      </View>

      <View style={styles.alertsList}>
        <View style={styles.alertItem}>
          <Text style={styles.alertDot}>•</Text>
          <Text style={styles.alertText}>
            <Text style={{ fontWeight: 'bold', color: '#f87171' }}>Latex Allergy:</Text> Use nitrile gloves & non-latex tourniquet only.
          </Text>
        </View>

        <View style={styles.alertItem}>
          <Text style={styles.alertDot}>•</Text>
          <Text style={styles.alertText}>
            <Text style={{ fontWeight: 'bold', color: '#fbbf24' }}>Anticoagulant (Blood Thinner):</Text> Apply pressure bandage for minimum 5 minutes post-puncture.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#3b1212',
    borderColor: '#7f1d1d',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fca5a5',
    letterSpacing: 0.5,
  },
  cautionBadge: {
    backgroundColor: '#7f1d1d',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cautionText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  alertsList: {
    gap: 4,
  },
  alertItem: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-start',
  },
  alertDot: {
    color: '#f87171',
    fontWeight: 'bold',
  },
  alertText: {
    fontSize: 10,
    color: '#fecaca',
    flex: 1,
    lineHeight: 14,
  },
});
