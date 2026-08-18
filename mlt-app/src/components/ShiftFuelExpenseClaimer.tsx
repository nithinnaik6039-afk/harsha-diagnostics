import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';

export default function ShiftFuelExpenseClaimer() {
  const [shiftKm, setShiftKm] = useState(28.4);
  const [ratePerKm, setRatePerKm] = useState(3.5);
  const [claimed, setClaimed] = useState(false);

  const totalFuelAllowance = Math.round(shiftKm * ratePerKm);

  const handleClaim = () => {
    setClaimed(true);
    const msg = `⛽ Fuel Claim of ₹${totalFuelAllowance} for ${shiftKm} km submitted! Amount credited to your Harsha Instant Wallet.`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(msg);
    } else {
      Alert.alert('Fuel Claim Approved', msg);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>⛽</Text>
          <Text style={styles.title}>FIELD TRAVEL & FUEL ALLOWANCE</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>INSTANT PAYOUT</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        GPS-audited mileage allowance calculated automatically at ₹{ratePerKm.toFixed(2)}/km.
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>GPS DISTANCE</Text>
          <Text style={styles.statVal}>{shiftKm} KM</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>RATE / KM</Text>
          <Text style={[styles.statVal, { color: '#38bdf8' }]}>₹{ratePerKm.toFixed(2)}</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>CLAIM AMOUNT</Text>
          <Text style={[styles.statVal, { color: '#34d399' }]}>₹{totalFuelAllowance}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.claimBtn, claimed && styles.claimBtnDone]}
        onPress={handleClaim}
        disabled={claimed}
      >
        <Text style={styles.claimBtnText}>
          {claimed ? '✓ ₹' + totalFuelAllowance + ' Claim Credited to Wallet' : '⚡ 1-Click Claim ₹' + totalFuelAllowance + ' Fuel Payout'}
        </Text>
      </TouchableOpacity>
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
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  statVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#f8fafc',
    marginTop: 2,
  },
  claimBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  claimBtnDone: {
    backgroundColor: '#064e3b',
  },
  claimBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
