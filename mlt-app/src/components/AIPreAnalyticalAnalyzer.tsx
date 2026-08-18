import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function AIPreAnalyticalAnalyzer({
  orderId = 'ORD-8921',
}: {
  orderId?: string;
}) {
  const [tourniquetTimeSec, setTourniquetTimeSec] = useState(42);
  const [inversionsDone, setInversionsDone] = useState(8);
  const [fillVolumeOk, setFillVolumeOk] = useState(true);
  const [needleGauge, setNeedleGauge] = useState<'21G' | '22G' | '23G'>('21G');

  // Calculate pre-analytical sample acceptance quality score
  let score = 100;
  if (tourniquetTimeSec > 60) score -= 20; // Hemoconcentration risk
  if (inversionsDone < 5) score -= 15; // Microclot risk in EDTA
  if (!fillVolumeOk) score -= 25; // Anticoagulant dilution error (citrate ratio)
  if (needleGauge === '23G') score -= 5; // Slight hemolysis risk with small lumen

  const qualityGrade = score >= 90 ? 'OPTIMAL (NABL A+)' : score >= 75 ? 'ACCEPTABLE' : 'HIGH REJECTION RISK';
  const gradeColor = score >= 90 ? '#10b981' : score >= 75 ? '#f59e0b' : '#ef4444';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>🤖</Text>
          <Text style={styles.title}>AI PRE-ANALYTICAL QUALITY AUDIT</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: gradeColor }]}>
          <Text style={styles.scoreText}>{score}/100 • {qualityGrade}</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Real-time venipuncture physics checker to eliminate specimen rejection by laboratory analyzers.
      </Text>

      {/* Parameter Sliders / Checkers */}
      <View style={styles.paramGrid}>
        {/* Tourniquet Time */}
        <View style={styles.paramCard}>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>⏱️ Tourniquet Occlusion Time</Text>
            <Text style={[styles.paramVal, tourniquetTimeSec > 60 && { color: '#f87171' }]}>
              {tourniquetTimeSec}s {tourniquetTimeSec > 60 ? '(Risk >60s)' : '(Safe)'}
            </Text>
          </View>
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.adjustBtn}
              onPress={() => setTourniquetTimeSec((t) => Math.max(15, t - 10))}
            >
              <Text style={styles.adjustText}>- 10s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adjustBtn}
              onPress={() => setTourniquetTimeSec((t) => t + 10)}
            >
              <Text style={styles.adjustText}>+ 10s</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tube Inversion Count */}
        <View style={styles.paramCard}>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>🔄 Vacutainer Inversion Mix</Text>
            <Text style={[styles.paramVal, { color: '#34d399' }]}>{inversionsDone} Inversions</Text>
          </View>
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.adjustBtn}
              onPress={() => setInversionsDone((i) => Math.max(2, i - 1))}
            >
              <Text style={styles.adjustText}>- 1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adjustBtn}
              onPress={() => setInversionsDone((i) => i + 1)}
            >
              <Text style={styles.adjustText}>+ 1 Inversion</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Needle Gauge Selection */}
        <View style={styles.paramCard}>
          <Text style={styles.paramLabel}>💉 Venipuncture Needle Gauge</Text>
          <View style={styles.gaugeSelector}>
            {(['21G', '22G', '23G'] as const).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.gaugeBtn, needleGauge === g && styles.gaugeBtnActive]}
                onPress={() => setNeedleGauge(g)}
              >
                <Text style={[styles.gaugeText, needleGauge === g && styles.gaugeTextActive]}>
                  {g} {g === '21G' ? '(Standard)' : g === '23G' ? '(Butterfly)' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* AI Diagnostic Warnings */}
      {score < 90 && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            💡 <Text style={{ fontWeight: 'bold' }}>AI Recommendation:</Text> Release tourniquet immediately after blood flash to prevent hemoconcentration of Potassium & Total Protein.
          </Text>
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
    fontSize: 11,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 12,
  },
  paramGrid: {
    gap: 8,
  },
  paramCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  paramLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f8fafc',
  },
  paramVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  adjustBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  adjustText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gaugeSelector: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  gaugeBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  gaugeBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  gaugeText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gaugeTextActive: {
    color: '#ffffff',
  },
  warningBox: {
    backgroundColor: '#451a03',
    borderColor: '#d97706',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  warningText: {
    fontSize: 10,
    color: '#fde68a',
    lineHeight: 14,
  },
});
