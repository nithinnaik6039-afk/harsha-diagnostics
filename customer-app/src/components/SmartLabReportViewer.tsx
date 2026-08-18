import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

export default function SmartLabReportViewer() {
  const [selectedAnalyte, setSelectedAnalyte] = useState<'hba1c' | 'cholesterol' | 'tsh'>('hba1c');

  const analyteData = {
    hba1c: {
      name: 'HbA1c (Glycated Hemoglobin)',
      latestValue: 5.6,
      unit: '%',
      referenceRange: '< 5.7% (Normal)',
      status: 'Normal',
      history: [
        { date: 'Jan 2026', value: 6.2 },
        { date: 'May 2026', value: 5.9 },
        { date: 'Aug 2026', value: 5.6 },
      ],
      doctorNote: 'Excellent glycemic control achieved over the last 6 months. Maintain current diet & exercise.',
    },
    cholesterol: {
      name: 'Total Cholesterol',
      latestValue: 178,
      unit: 'mg/dL',
      referenceRange: '< 200 mg/dL',
      status: 'Desirable',
      history: [
        { date: 'Jan 2026', value: 215 },
        { date: 'May 2026', value: 192 },
        { date: 'Aug 2026', value: 178 },
      ],
      doctorNote: 'Lipid profile is within optimal targets with reduction in serum LDL.',
    },
    tsh: {
      name: 'Ultrasensitive TSH (Thyroid)',
      latestValue: 2.45,
      unit: 'μIU/mL',
      referenceRange: '0.45 – 4.50 μIU/mL',
      status: 'Euthyroid (Optimal)',
      history: [
        { date: 'Jan 2026', value: 3.1 },
        { date: 'May 2026', value: 2.8 },
        { date: 'Aug 2026', value: 2.45 },
      ],
      doctorNote: 'Thyroid hormone output is perfectly balanced.',
    },
  };

  const current = analyteData[selectedAnalyte];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 18 }}>📊</Text>
          <Text style={styles.title}>SMART LAB REPORT & BIOMARKER TRENDS</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PATHOLOGIST VERIFIED</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Track your health progression over time with automated trendlines and doctor notes.
      </Text>

      {/* Analyte Tab Selector */}
      <View style={styles.tabGroup}>
        {[
          { key: 'hba1c', label: 'HbA1c Sugar' },
          { key: 'cholesterol', label: 'Cholesterol' },
          { key: 'tsh', label: 'Thyroid TSH' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, selectedAnalyte === tab.key && styles.tabBtnActive]}
            onPress={() => setSelectedAnalyte(tab.key as any)}
          >
            <Text style={[styles.tabText, selectedAnalyte === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Analyte Scorecard */}
      <View style={styles.scorecard}>
        <View style={styles.scorecardTop}>
          <Text style={styles.analyteName}>{current.name}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{current.status}</Text>
          </View>
        </View>

        <View style={styles.valueRow}>
          <Text style={styles.mainValue}>{current.latestValue}</Text>
          <Text style={styles.unitText}>{current.unit}</Text>
          <Text style={styles.refText}>Ref: {current.referenceRange}</Text>
        </View>

        {/* 3-Month Trend Timeline */}
        <Text style={styles.trendLabel}>HISTORICAL TRENDLINE:</Text>
        <View style={styles.trendGrid}>
          {current.history.map((h, idx) => (
            <View key={idx} style={styles.trendItem}>
              <Text style={styles.trendDate}>{h.date}</Text>
              <Text style={styles.trendVal}>{h.value} {current.unit}</Text>
            </View>
          ))}
        </View>

        {/* Doctor Consultation Summary */}
        <View style={styles.doctorCard}>
          <Text style={styles.doctorTitle}>🩺 Dr. Anita Rao, MD (Pathology):</Text>
          <Text style={styles.doctorNote}>"{current.doctorNote}"</Text>
        </View>

        {/* Download PDF Button */}
        <TouchableOpacity
          style={styles.downloadPdfBtn}
          onPress={() => Linking.openURL('https://harsha-diagnostics.com/sample-report.pdf')}
        >
          <Text style={styles.downloadPdfText}>📄 Download Official NABL PDF Report</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#064e3b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: '#34d399',
    fontSize: 8,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 12,
  },
  tabGroup: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 3,
    gap: 4,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#0284c7',
  },
  tabText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  scorecard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  scorecardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  analyteName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
  },
  statusBadge: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: 'bold',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 12,
  },
  mainValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
  },
  unitText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  refText: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  trendLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 6,
  },
  trendGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  trendItem: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  trendDate: {
    fontSize: 8,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  trendVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34d399',
    marginTop: 2,
  },
  doctorCard: {
    backgroundColor: '#082f49',
    borderColor: '#0284c7',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  doctorTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 2,
  },
  doctorNote: {
    fontSize: 10,
    color: '#e0f2fe',
    fontStyle: 'italic',
    lineHeight: 14,
  },
  downloadPdfBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  downloadPdfText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
