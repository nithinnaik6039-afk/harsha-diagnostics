import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';

export interface KitItem {
  id: string;
  name: string;
  count: number;
  minWarning: number;
  unit: string;
  icon: string;
}

export default function SupplyKitTracker() {
  const [items, setItems] = useState<KitItem[]>([
    { id: '1', name: '21G Vacutainer Needles', count: 18, minWarning: 5, unit: 'pcs', icon: '💉' },
    { id: '2', name: 'Sterile Tourniquets', count: 4, minWarning: 2, unit: 'pcs', icon: '🎗️' },
    { id: '3', name: '70% Isopropyl Swabs', count: 35, minWarning: 10, unit: 'wipes', icon: '🧼' },
    { id: '4', name: 'SST Gel (Yellow) Tubes', count: 12, minWarning: 4, unit: 'vials', icon: '🟡' },
    { id: '5', name: 'EDTA (Lavender) Tubes', count: 14, minWarning: 4, unit: 'vials', icon: '🟣' },
    { id: '6', name: 'Biohazard Sharp Containers', count: 2, minWarning: 1, unit: 'boxes', icon: '☣️' },
    { id: '7', name: 'Cryo Ice Gel Packs', count: 3, minWarning: 2, unit: 'packs', icon: '🧊' },
  ]);

  const [requested, setRequested] = useState(false);

  const handleRestockRequest = () => {
    setRequested(true);
    const msg = 'Supply kit restock order sent to Harsha Central Lab. Hub dispatched replenishment.';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(msg);
    } else {
      Alert.alert('Restock Requested', msg);
    }
  };

  const decrementItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, count: Math.max(0, item.count - 1) } : item
      )
    );
  };

  const incrementItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, count: item.count + 1 } : item
      )
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 22 }}>🧰</Text>
          <View>
            <Text style={styles.title}>Phlebotomy Supply Kit</Text>
            <Text style={styles.subtitle}>Inventory in field cooler bag</Text>
          </View>
        </View>

        <TouchableOpacity
          disabled={requested}
          onPress={handleRestockRequest}
          style={[styles.restockBtn, requested && { backgroundColor: '#064e3b', borderColor: '#059669' }]}
        >
          <Text style={styles.restockBtnText}>
            {requested ? '✓ Hub Alerted' : '📦 Request Restock'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Grid of Kit Items */}
      <View style={styles.grid}>
        {items.map((item) => {
          const isLow = item.count <= item.minWarning;
          return (
            <View
              key={item.id}
              style={[styles.itemCard, isLow && styles.itemCardLow]}
            >
              <View style={styles.itemTopRow}>
                <Text style={styles.itemIcon}>{item.icon}</Text>
                {isLow && (
                  <View style={styles.lowBadge}>
                    <Text style={styles.lowText}>LOW</Text>
                  </View>
                )}
              </View>

              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>

              <View style={styles.countRow}>
                <TouchableOpacity
                  onPress={() => decrementItem(item.id)}
                  style={styles.countAdjustBtn}
                >
                  <Text style={styles.countAdjustText}>−</Text>
                </TouchableOpacity>

                <Text style={[styles.countVal, isLow && { color: '#f87171' }]}>
                  {item.count} <Text style={styles.unitText}>{item.unit}</Text>
                </Text>

                <TouchableOpacity
                  onPress={() => incrementItem(item.id)}
                  style={styles.countAdjustBtn}
                >
                  <Text style={styles.countAdjustText}>+</Text>
                </TouchableOpacity>
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
    marginBottom: 14,
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
  restockBtn: {
    backgroundColor: '#1e293b',
    borderColor: '#38bdf8',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  restockBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
  },
  itemCardLow: {
    borderColor: '#ef4444',
    backgroundColor: '#301313',
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemIcon: {
    fontSize: 18,
  },
  lowBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  lowText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ffffff',
  },
  itemName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
    minHeight: 28,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  countAdjustBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countAdjustText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  countVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34d399',
  },
  unitText: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: 'normal',
  },
});
