import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function CentrifugeCentricTimer() {
  const [clotTimerSec, setClotTimerSec] = useState(1200); // 20 mins mandatory SST clotting
  const [clotRunning, setClotRunning] = useState(false);
  const [centrifugeRpm, setCentrifugeRpm] = useState(3000);
  const [centrifugeSec, setCentrifugeSec] = useState(600); // 10 mins spin
  const [centrifugeRunning, setCentrifugeRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (clotRunning && clotTimerSec > 0) {
      interval = setInterval(() => setClotTimerSec((s) => Math.max(0, s - 1)), 1000);
    } else if (centrifugeRunning && centrifugeSec > 0) {
      interval = setInterval(() => setCentrifugeSec((s) => Math.max(0, s - 1)), 1000);
    }
    return () => clearInterval(interval);
  }, [clotRunning, clotTimerSec, centrifugeRunning, centrifugeSec]);

  const formatMinSec = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>⏱️</Text>
          <Text style={styles.title}>FIELD CLOTTING & CENTRIFUGE SUITE</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>SST GOLD TUBE</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Prevents fibrin strands and hemolysis by tracking mandatory 20m standing clot and 3000 RPM separation.
      </Text>

      <View style={styles.timersGrid}>
        {/* Clotting Timer */}
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>🩸 Serum Clotting (SST)</Text>
          <Text style={styles.timerClock}>{formatMinSec(clotTimerSec)}</Text>
          <Text style={styles.timerStatus}>
            {clotTimerSec === 0 ? '✓ Complete' : clotRunning ? '● Clotting in progress' : '○ Ready to start'}
          </Text>
          <TouchableOpacity
            style={[styles.timerBtn, clotRunning && styles.timerBtnActive]}
            onPress={() => setClotRunning(!clotRunning)}
          >
            <Text style={styles.timerBtnText}>{clotRunning ? 'Pause' : 'Start 20m Clot'}</Text>
          </TouchableOpacity>
        </View>

        {/* Centrifuge Spin */}
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>🌀 Mobile Spin ({centrifugeRpm} RPM)</Text>
          <Text style={[styles.timerClock, { color: '#38bdf8' }]}>{formatMinSec(centrifugeSec)}</Text>
          <Text style={styles.timerStatus}>
            {centrifugeSec === 0 ? '✓ Serum Separated' : centrifugeRunning ? '● Spinning at 3k RPM' : '○ Standby'}
          </Text>
          <TouchableOpacity
            style={[styles.timerBtn, { backgroundColor: '#0284c7' }, centrifugeRunning && { backgroundColor: '#d97706' }]}
            onPress={() => setCentrifugeRunning(!centrifugeRunning)}
          >
            <Text style={styles.timerBtnText}>{centrifugeRunning ? 'Halt Spin' : 'Start 10m Spin'}</Text>
          </TouchableOpacity>
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
    color: '#e2e8f0',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: '#ca8a04',
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
    color: '#94a3b8',
    marginBottom: 12,
  },
  timersGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  timerCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  timerClock: {
    fontSize: 22,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 1,
  },
  timerStatus: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
    marginBottom: 8,
  },
  timerBtn: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    width: '100%',
    alignItems: 'center',
  },
  timerBtnActive: {
    backgroundColor: '#d97706',
  },
  timerBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
