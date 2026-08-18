import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

export default function VeinScannerHUD() {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [selectedVein, setSelectedVein] = useState<'median' | 'cephalic' | 'basilic'>('median');

  const startScan = () => {
    setScanning(true);
    setScanned(false);
    setTimeout(() => {
      setScanning(false);
      setScanned(true);
    }, 2200);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 20 }}>🔬</Text>
          <View>
            <Text style={styles.title}>AI Vein Finder & Needle Angle Guide</Text>
            <Text style={styles.subtitle}>Near-Infrared Optical Venipuncture AI</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.scanTriggerBtn, scanning && { backgroundColor: '#334155' }]}
          disabled={scanning}
          onPress={startScan}
        >
          <Text style={styles.scanTriggerText}>
            {scanning ? 'Analyzing...' : scanned ? '↻ Rescan' : '⚡ Scan Vein'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Simulated Camera / Optical HUD Screen */}
      <View style={styles.hudScreen}>
        {/* HUD Grid Lines */}
        <View style={styles.hudCrosshair} />
        <View style={styles.hudCircle} />

        {scanning && (
          <View style={styles.hudOverlay}>
            <ActivityIndicator size="large" color="#38bdf8" />
            <Text style={styles.scanningText}>Analyzing subcutaneous venous map...</Text>
            <Text style={styles.scanningSub}>Near-Infrared 850nm NIR simulated</Text>
          </View>
        )}

        {!scanning && !scanned && (
          <View style={styles.hudPlaceholder}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🎯</Text>
            <Text style={styles.hudPrompt}>Point camera at patient's antecubital fossa</Text>
            <Text style={styles.hudHint}>Tap 'Scan Vein' to detect optimal puncture target</Text>
          </View>
        )}

        {scanned && (
          <View style={styles.hudResult}>
            {/* Detected Vein Overlay Box */}
            <View style={styles.detectedVeinBox}>
              <View style={styles.targetDot} />
              <Text style={styles.veinTag}>Median Cubital Vein (Primary)</Text>
            </View>

            <View style={styles.aiStatsBar}>
              <View style={styles.aiStat}>
                <Text style={styles.aiStatLabel}>VEIN QUALITY</Text>
                <Text style={styles.aiStatVal}>98% Optimal</Text>
              </View>
              <View style={styles.aiStat}>
                <Text style={styles.aiStatLabel}>NEEDLE ANGLE</Text>
                <Text style={styles.aiStatVal}>15° – 25°</Text>
              </View>
              <View style={styles.aiStat}>
                <Text style={styles.aiStatLabel}>DEPTH</Text>
                <Text style={styles.aiStatVal}>3.2 mm</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {scanned && (
        <View style={styles.veinSelectRow}>
          {[
            { key: 'median', label: 'Median Cubital (Best)' },
            { key: 'cephalic', label: 'Cephalic (Lateral)' },
            { key: 'basilic', label: 'Basilic (Medial)' },
          ].map((v) => (
            <TouchableOpacity
              key={v.key}
              style={[styles.veinChip, selectedVein === v.key && styles.veinChipActive]}
              onPress={() => setSelectedVein(v.key as any)}
            >
              <Text
                style={[
                  styles.veinChipText,
                  selectedVein === v.key && styles.veinChipTextActive,
                ]}
              >
                {v.label}
              </Text>
            </TouchableOpacity>
          ))}
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
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
  },
  scanTriggerBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  scanTriggerText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  hudScreen: {
    height: 160,
    backgroundColor: '#030712',
    borderRadius: 16,
    borderColor: '#1e293b',
    borderWidth: 1.5,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  hudCrosshair: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  hudCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderStyle: 'dashed',
  },
  hudOverlay: {
    alignItems: 'center',
    gap: 6,
  },
  scanningText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 6,
  },
  scanningSub: {
    color: '#94a3b8',
    fontSize: 10,
  },
  hudPlaceholder: {
    alignItems: 'center',
  },
  hudPrompt: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  hudHint: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  hudResult: {
    width: '100%',
    height: '100%',
    padding: 12,
    justifyContent: 'space-between',
  },
  detectedVeinBox: {
    alignSelf: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(6, 78, 59, 0.7)',
    borderColor: '#34d399',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  targetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34d399',
  },
  veinTag: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  aiStatsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 10,
    padding: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  aiStat: {
    flex: 1,
    alignItems: 'center',
  },
  aiStatLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  aiStatVal: {
    fontSize: 11,
    fontWeight: '900',
    color: '#34d399',
    marginTop: 1,
  },
  veinSelectRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  veinChip: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  veinChipActive: {
    backgroundColor: '#064e3b',
    borderColor: '#059669',
  },
  veinChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
  },
  veinChipTextActive: {
    color: '#34d399',
  },
});
