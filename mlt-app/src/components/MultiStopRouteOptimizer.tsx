import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface Stop {
  id: string;
  orderNumber: number;
  patientName: string;
  address: string;
  timeSlot: string;
  testsCount: number;
  isCompleted: boolean;
}

export default function MultiStopRouteOptimizer() {
  const [optimized, setOptimized] = useState(true);
  const [stops, setStops] = useState<Stop[]>([
    {
      id: '1',
      orderNumber: 1,
      patientName: 'K. Ramesh (Diabetic Profile)',
      address: 'MIG Bus Stand Colony, Sector 3',
      timeSlot: '7:00 AM - 7:30 AM',
      testsCount: 3,
      isCompleted: true,
    },
    {
      id: '2',
      orderNumber: 2,
      patientName: 'Sunita Reddy (Thyroid Panel)',
      address: 'Near Clock Tower Circle, Anantapuramu',
      timeSlot: '7:45 AM - 8:15 AM',
      testsCount: 2,
      isCompleted: false,
    },
    {
      id: '3',
      orderNumber: 3,
      patientName: 'V. Anand (Full Body Health)',
      address: 'Opp. District Court Complex',
      timeSlot: '8:30 AM - 9:00 AM',
      testsCount: 6,
      isCompleted: false,
    },
    {
      id: '4',
      orderNumber: 4,
      patientName: '🏥 Harsha Central Lab (Handover Desk)',
      address: 'Subhash Road, Clock Tower Circle, Anantapuramu (515001)',
      timeSlot: '9:30 AM Specimen Drop',
      testsCount: 11,
      isCompleted: false,
    },
  ]);

  const handleOptimizeRoute = () => {
    setOptimized(true);
    // Reverse intermediate stops to simulate TSP reordering
    setStops((prev) => {
      const copy = [...prev];
      const middle = copy.slice(1, 3).reverse();
      return [copy[0], ...middle, copy[3]].map((s, idx) => ({ ...s, orderNumber: idx + 1 }));
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.title}>🗺️ Multi-Stop Batch Route Optimizer</Text>
            <View style={styles.optPill}>
              <Text style={styles.optPillText}>AI TSP OPTIMIZED</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Sequences 3 home visits + 1 central lab dropoff</Text>
        </View>

        <TouchableOpacity style={styles.reOptBtn} onPress={handleOptimizeRoute}>
          <Text style={styles.reOptBtnText}>⚡ Re-optimize</Text>
        </TouchableOpacity>
      </View>

      {/* Savings Metric Pills */}
      <View style={styles.savingsRow}>
        <View style={styles.savingPill}>
          <Text style={styles.savingLabel}>TOTAL ROUTE</Text>
          <Text style={styles.savingVal}>6.4 km (4 Stops)</Text>
        </View>
        <View style={styles.savingPill}>
          <Text style={styles.savingLabel}>TIME SAVED</Text>
          <Text style={[styles.savingVal, { color: '#34d399' }]}>~22 Mins</Text>
        </View>
        <View style={styles.savingPill}>
          <Text style={styles.savingLabel}>FUEL SAVINGS</Text>
          <Text style={[styles.savingVal, { color: '#38bdf8' }]}>₹65 / Shift</Text>
        </View>
      </View>

      {/* Sequential Stop Timeline */}
      <View style={styles.timeline}>
        {stops.map((stop, index) => {
          const isLast = index === stops.length - 1;
          return (
            <View key={stop.id} style={styles.stopRow}>
              {/* Left Timeline Indicator */}
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.stopCircle,
                    stop.isCompleted
                      ? styles.stopCircleDone
                      : isLast
                      ? styles.stopCircleLab
                      : styles.stopCirclePending,
                  ]}
                >
                  <Text style={styles.stopNumText}>
                    {stop.isCompleted ? '✓' : isLast ? '🏥' : stop.orderNumber}
                  </Text>
                </View>
                {!isLast && <View style={styles.timelineConnector} />}
              </View>

              {/* Right Stop Details */}
              <View style={[styles.stopDetails, stop.isCompleted && { opacity: 0.6 }]}>
                <View style={styles.stopTopLine}>
                  <Text style={styles.stopName}>{stop.patientName}</Text>
                  <Text style={styles.stopTimeTag}>{stop.timeSlot}</Text>
                </View>
                <Text style={styles.stopAddress}>{stop.address}</Text>
                <Text style={styles.stopVials}>🧪 {stop.testsCount} Sample Vials</Text>
              </View>
            </View>
          );
        })}
      </View>
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
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  optPill: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  optPillText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  reOptBtn: {
    backgroundColor: '#1e293b',
    borderColor: '#38bdf8',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  reOptBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  savingsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  savingPill: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  savingLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  savingVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: 2,
  },
  timeline: {
    gap: 2,
  },
  stopRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 28,
  },
  stopCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopCircleDone: {
    backgroundColor: '#059669',
  },
  stopCirclePending: {
    backgroundColor: '#0284c7',
  },
  stopCircleLab: {
    backgroundColor: '#7c3aed',
  },
  stopNumText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: '#334155',
    marginVertical: 2,
  },
  stopDetails: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stopTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  stopName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f8fafc',
  },
  stopTimeTag: {
    fontSize: 9,
    color: '#34d399',
    fontWeight: '700',
  },
  stopAddress: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 2,
  },
  stopVials: {
    fontSize: 9,
    color: '#38bdf8',
    fontWeight: 'bold',
  },
});
