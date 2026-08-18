import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface ColdChainData {
  temperature: number;
  status: 'optimal' | 'warning' | 'critical';
  battery: number;
  coolerBagId: string;
  lastSyncTime: string;
  icePacksCount: number;
}

export default function ColdChainMonitor({
  compact = false,
  onAlert,
}: {
  compact?: boolean;
  onAlert?: (msg: string) => void;
}) {
  const [data, setData] = useState<ColdChainData>({
    temperature: 4.2,
    status: 'optimal',
    battery: 94,
    coolerBagId: 'HARSHA-COOL-04',
    lastSyncTime: 'Just now',
    icePacksCount: 3,
  });

  const [expanded, setExpanded] = useState(!compact);

  // Simulated IoT Telemetry fluctuation within safe biological limits (2°C - 8°C)
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const delta = (Math.random() - 0.5) * 0.4;
        const newTemp = parseFloat(Math.max(2.4, Math.min(6.8, prev.temperature + delta)).toFixed(1));
        const status = newTemp > 7.5 ? 'warning' : 'optimal';
        return {
          ...prev,
          temperature: newTemp,
          status,
          lastSyncTime: 'A few seconds ago',
        };
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const isOptimal = data.status === 'optimal';

  if (compact && !expanded) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setExpanded(true)}
        style={[styles.compactBadge, isOptimal ? styles.badgeOptimal : styles.badgeWarning]}
      >
        <Text style={styles.compactIcon}>❄️</Text>
        <Text style={[styles.compactTemp, isOptimal ? styles.textOptimal : styles.textWarning]}>
          {data.temperature}°C
        </Text>
        <View style={[styles.liveDot, { backgroundColor: isOptimal ? '#34d399' : '#f59e0b' }]} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>❄️</Text>
          <View>
            <Text style={styles.title}>Cold-Chain IoT Sensor</Text>
            <Text style={styles.subtitle}>Bag: {data.coolerBagId} • IoT Live</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, isOptimal ? styles.statusOptimal : styles.statusWarning]}>
          <View style={[styles.dot, { backgroundColor: isOptimal ? '#34d399' : '#f59e0b' }]} />
          <Text style={[styles.statusText, isOptimal ? styles.textOptimal : styles.textWarning]}>
            {isOptimal ? '2°C - 8°C OPTIMAL' : 'WARM WARNING'}
          </Text>
        </View>
      </View>

      {/* Main Temperature Display */}
      <View style={styles.metricsRow}>
        <View style={styles.tempBox}>
          <Text style={styles.tempValue}>{data.temperature}°C</Text>
          <Text style={styles.tempLabel}>Specimen Core Temp</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🔋</Text>
            <Text style={styles.statVal}>{data.battery}%</Text>
            <Text style={styles.statLabel}>Sensor Battery</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🧊</Text>
            <Text style={styles.statVal}>{data.icePacksCount} Packs</Text>
            <Text style={styles.statLabel}>Cryo Gel Active</Text>
          </View>
        </View>
      </View>

      {/* Safe Range Bar */}
      <View style={styles.rangeContainer}>
        <View style={styles.rangeLabels}>
          <Text style={styles.rangeText}>0°C (Freezing)</Text>
          <Text style={styles.rangeTarget}>Safe Zone: 2°C – 8°C</Text>
          <Text style={styles.rangeText}>10°C (Spoil)</Text>
        </View>
        <View style={styles.rangeTrack}>
          <View style={styles.rangeSafeZone} />
          {/* Temperature pointer */}
          <View
            style={[
              styles.pointer,
              {
                left: `${Math.min(100, Math.max(0, (data.temperature / 10) * 100))}%`,
                backgroundColor: isOptimal ? '#34d399' : '#f59e0b',
              },
            ]}
          />
        </View>
      </View>

      {compact && (
        <TouchableOpacity
          style={styles.collapseBtn}
          onPress={() => setExpanded(false)}
        >
          <Text style={styles.collapseText}>Hide Sensor Details ▲</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  badgeOptimal: {
    backgroundColor: '#064e3b',
    borderColor: '#059669',
  },
  badgeWarning: {
    backgroundColor: '#451a03',
    borderColor: '#d97706',
  },
  compactIcon: {
    fontSize: 14,
  },
  compactTemp: {
    fontSize: 13,
    fontWeight: '800',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusOptimal: {
    backgroundColor: '#022c22',
    borderColor: '#059669',
  },
  statusWarning: {
    backgroundColor: '#451a03',
    borderColor: '#d97706',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  textOptimal: {
    color: '#34d399',
  },
  textWarning: {
    color: '#fbbf24',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  tempBox: {
    flex: 1.2,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tempValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#38bdf8',
  },
  tempLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statsGrid: {
    flex: 1.4,
    flexDirection: 'row',
    gap: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
  },
  statLabel: {
    fontSize: 9,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 2,
  },
  rangeContainer: {
    marginTop: 2,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rangeText: {
    fontSize: 9,
    color: '#64748b',
  },
  rangeTarget: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#34d399',
  },
  rangeTrack: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  rangeSafeZone: {
    position: 'absolute',
    left: '20%',
    right: '20%',
    top: 0,
    bottom: 0,
    backgroundColor: '#059669',
    opacity: 0.6,
  },
  pointer: {
    position: 'absolute',
    top: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  collapseBtn: {
    marginTop: 10,
    alignItems: 'center',
  },
  collapseText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
});
