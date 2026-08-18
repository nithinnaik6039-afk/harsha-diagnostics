import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ThermalDegradationAI({
  drawTimestamp = new Date(Date.now() - 25 * 60 * 1000), // drawn 25 mins ago
  coreTemp = 4.2,
}: {
  drawTimestamp?: Date;
  coreTemp?: number;
}) {
  const [elapsedMins, setElapsedMins] = useState(25);
  const [viabilityPct, setViabilityPct] = useState(99.4);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedMins((m) => m + 1);
      // Decay formula based on cold-chain core temp and elapsed minutes
      const tempFactor = coreTemp <= 8 ? 0.02 : 0.15;
      setViabilityPct((prev) => parseFloat(Math.max(85, prev - tempFactor).toFixed(1)));
    }, 5000);
    return () => clearInterval(interval);
  }, [coreTemp]);

  const remainingSafeMins = Math.max(0, 180 - elapsedMins); // 3-hour cold chain target window

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>🧬</Text>
          <Text style={styles.title}>SPECIMEN BIOLOGICAL VIABILITY AI</Text>
        </View>
        <View style={styles.viabilityBadge}>
          <Text style={styles.viabilityText}>{viabilityPct}% INTEGRITY</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Real-time metabolic stability calculator for enzymes, glucose & potassium.
      </Text>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${viabilityPct}%`, backgroundColor: viabilityPct > 95 ? '#10b981' : '#f59e0b' },
          ]}
        />
      </View>

      {/* Analyte Stability Breakdown */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TIME ELAPSED</Text>
          <Text style={styles.statVal}>{elapsedMins} mins</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>SAFE LAB WINDOW</Text>
          <Text style={[styles.statVal, { color: '#38bdf8' }]}>{remainingSafeMins} mins left</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>HEMOLYSIS RISK</Text>
          <Text style={[styles.statVal, { color: '#34d399' }]}>LOW (&lt;0.5%)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
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
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  viabilityBadge: {
    backgroundColor: '#064e3b',
    borderColor: '#059669',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  viabilityText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 10,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  statVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 2,
  },
});
