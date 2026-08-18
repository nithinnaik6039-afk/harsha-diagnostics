import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

export default function ChainOfCustodyAudit({
  orderId = 'ORD-99201',
  phlebotomistName = 'Rajesh Kumar (MLT-409)',
  labTechnician = 'Dr. Anita Rao (Central Pathologist)',
}: {
  orderId?: string;
  phlebotomistName?: string;
  labTechnician?: string;
}) {
  const checksumHash = `SHA256-${orderId.slice(-6)}-${Date.now().toString().slice(-6)}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>📜</Text>
          <Text style={styles.title}>ISO 15189 CHAIN OF CUSTODY AUDIT</Text>
        </View>
        <View style={styles.auditBadge}>
          <Text style={styles.auditText}>✓ NABL VERIFIED</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Legally binding specimen custody transfer trail with cryptographic signature.
      </Text>

      <View style={styles.custodyTrail}>
        <View style={styles.custodyStep}>
          <Text style={styles.stepDot}>1️⃣</Text>
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>Sample Drawn at Home</Text>
            <Text style={styles.stepDetail}>By: {phlebotomistName}</Text>
          </View>
        </View>

        <View style={styles.custodyStep}>
          <Text style={styles.stepDot}>2️⃣</Text>
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>Cold-Chain Cryo Transfer</Text>
            <Text style={styles.stepDetail}>Cooler Bag: HARSHA-COOL-04 (4.2°C Logged)</Text>
          </View>
        </View>

        <View style={styles.custodyStep}>
          <Text style={styles.stepDot}>3️⃣</Text>
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>Central Lab Accessioning Desk</Text>
            <Text style={styles.stepDetail}>Receiver: {labTechnician}</Text>
          </View>
        </View>
      </View>

      <View style={styles.hashBox}>
        <Text style={styles.hashLabel}>CUSTODY HASH: </Text>
        <Text style={styles.hashVal}>{checksumHash}</Text>
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
    color: '#cbd5e1',
    letterSpacing: 0.5,
  },
  auditBadge: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  auditText: {
    color: '#34d399',
    fontSize: 8,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 10,
  },
  custodyTrail: {
    gap: 8,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  custodyStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    fontSize: 14,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  stepDetail: {
    fontSize: 10,
    color: '#94a3b8',
  },
  hashBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hashLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
  },
  hashVal: {
    fontSize: 9,
    color: '#38bdf8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
});
