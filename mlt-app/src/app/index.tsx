import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, Redirect, useFocusEffect } from 'expo-router';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useMltStore, ActiveOrder } from '../store/useMltStore';
import { registerForPushNotificationsAsync } from '../utils/pushNotifications';
import ColdChainMonitor from '../components/ColdChainMonitor';
import SupplyKitTracker from '../components/SupplyKitTracker';
import OfflineSyncBanner from '../components/OfflineSyncBanner';
import EmergencySOSModal from '../components/EmergencySOSModal';
import MultiStopRouteOptimizer from '../components/MultiStopRouteOptimizer';
import ShiftFuelExpenseClaimer from '../components/ShiftFuelExpenseClaimer';
import MLTLeaderboardRewards from '../components/MLTLeaderboardRewards';
import PhlebotomyKnowledgeBase from '../components/PhlebotomyKnowledgeBase';
import LiveDispatchRadarMap from '../components/LiveDispatchRadarMap';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { BACKEND_URL } from '../constants/api';

export default function MltDashboardScreen() {
  const router = useRouter();
  const { token, mlt, isOnline, toggleOnline, activeOrder, setActiveOrder, logout } =
    useMltStore();

  const [loading, setLoading] = useState(false);
  const [assignedOrders, setAssignedOrders] = useState<ActiveOrder[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'EN_ROUTE' | 'COLLECTED'>('ALL');
  const [showSupplyModal, setShowSupplyModal] = useState(false);

  // Register push tokens when MLT dashboard loads
  useEffect(() => {
    if (token) {
      registerForPushNotificationsAsync(token, BACKEND_URL);
    }
  }, [token]);

  // Fetch orders assigned to this MLT
  const fetchAssignedOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        // Filter orders assigned to this MLT that are active
        const active = res.data.data.filter(
          (order: any) =>
            order.assignedMLT?._id === mlt?._id &&
            !['ReportReady', 'Cancelled'].includes(order.status)
        );
        setAssignedOrders(active);

        if (active.length > 0) {
          setActiveOrder(active[0]);
        } else {
          setActiveOrder(null);
        }
      }
    } catch (err) {
      console.error('Error fetching MLT bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        fetchAssignedOrders();
      }
    }, [isOnline, token])
  );

  useEffect(() => {
    if (!token || !mlt || !isOnline) return;

    const socket = io(BACKEND_URL);

    socket.on('connect', () => {
      console.log('MLT Dashboard WS connected successfully');
      socket.emit('join-room', `mlt_${mlt._id}`);
    });

    socket.on('incoming-order', (data: any) => {
      console.log('MLT WS received incoming-order offer:', data);
      router.push({
        pathname: '/incoming-alert',
        params: {
          orderId: data.orderId,
          patientName: data.patient.name,
          testsCount: data.tests.length,
          addressLine: data.address.addressLine,
          slotTime: data.slot.time,
          lat: data.address.coordinates?.lat || 14.6819,
          lng: data.address.coordinates?.lng || 77.6006,
        },
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, mlt?._id, isOnline]);

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Booked':
        return '#0284c7';
      case 'Assigned':
        return '#0284c7';
      case 'OnTheWay':
        return '#0ea5e9';
      case 'Arrived':
        return '#10b981';
      case 'Collected':
        return '#8b5cf6';
      case 'Submitted':
        return '#6366f1';
      default:
        return '#64748b';
    }
  };

  const filteredOrders = assignedOrders.filter((order) => {
    if (activeFilter === 'PENDING') return ['Booked', 'Assigned'].includes(order.status);
    if (activeFilter === 'EN_ROUTE') return ['OnTheWay', 'Arrived'].includes(order.status);
    if (activeFilter === 'COLLECTED') return ['Collected', 'Submitted'].includes(order.status);
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerProfile}
          onPress={() => router.push('/profile')}
          activeOpacity={0.8}
        >
          <View style={styles.avatarBox}>
            <Text style={{ fontSize: 18 }}>🧑‍⚕️</Text>
            {isOnline && <View style={styles.onlinePing} />}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <Text style={styles.mltName} numberOfLines={1}>
                {mlt?.name || 'Phlebotomist Lead'}
              </Text>
              <View style={styles.badgeTier}>
                <Text style={styles.badgeTierText}>★ PLATINUM</Text>
              </View>
            </View>
            <Text style={styles.ratingSubtitle} numberOfLines={1}>
              📍 Anantapuramu • ⭐ 4.98
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <EmergencySOSModal />
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => Linking.openURL('tel:18002008899')}
          >
            <Text style={styles.headerIconText}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutIcon}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main List & Scroll Container */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.activeCard}>
            {/* Card Top */}
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={styles.dispatchPill}>
                  <Text style={styles.dispatchPillText}>📍 UBER-GPS DISPATCH</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>

            {/* Patient & Tests */}
            <Text style={styles.patientName}>
              🧑 {item.patient.name} ({item.patient.age} yrs • {item.patient.gender})
            </Text>
            <Text style={styles.address}>📍 {item.address.addressLine}</Text>
            
            <View style={styles.cardMetaRow}>
              <Text style={styles.slotText}>⏰ Slot: {item.slot.time}</Text>
              <Text style={styles.pinTag}>🔐 PIN: {item.safetyPin}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.cardActionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push(`/order/${item._id}`)}
              >
                <Text style={styles.actionBtnText}>
                  {item.status === 'Collected' ? 'Deliver to Lab →' : 'Navigate & Collect Specimen →'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navMapsBtn}
                onPress={() => {
                  const lat = item.address.coordinates?.lat || 14.6819;
                  const lng = item.address.coordinates?.lng || 77.6006;
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                  Linking.openURL(url);
                }}
              >
                <Text style={styles.navMapsBtnText}>🗺️ Maps</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.dashboardSection}>
            {/* Phlebotomy Theme Selector */}
            <ThemeSwitcher />

            {/* Offline Network Resilience & Cloud Sync Banner */}
            <OfflineSyncBanner />

            {/* Duty Status Switch */}
            <View
              style={[
                styles.toggleCard,
                isOnline && { borderColor: '#059669', borderWidth: 1.5, backgroundColor: '#062d22' },
              ]}
            >
              <View>
                <Text style={styles.toggleTitle}>Phlebotomist Duty Status</Text>
                <Text
                  style={[
                    styles.toggleSubtitle,
                    isOnline && { color: '#34d399', fontWeight: 'bold' },
                  ]}
                >
                  {isOnline ? '● ONLINE — Live Dispatch Active' : '○ OFFLINE — Sleep Mode'}
                </Text>
              </View>
              <Switch
                trackColor={{ false: '#334155', true: '#059669' }}
                thumbColor={isOnline ? '#34d399' : '#94a3b8'}
                onValueChange={toggleOnline}
                value={isOnline}
              />
            </View>

            {/* Shift Metrics Bar */}
            <View style={styles.metricsContainer}>
              <View style={styles.metricCard}>
                <Text style={styles.metricIcon}>💰</Text>
                <Text style={styles.metricValue}>₹1,680</Text>
                <Text style={styles.metricLabel}>Today Payout</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricIcon}>🧪</Text>
                <Text style={styles.metricValue}>9 Vials</Text>
                <Text style={styles.metricLabel}>Specimens</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricIcon}>⚡</Text>
                <Text style={styles.metricValue}>99%</Text>
                <Text style={styles.metricLabel}>On-Time</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricIcon}>⭐</Text>
                <Text style={styles.metricValue}>4.98</Text>
                <Text style={styles.metricLabel}>Rating</Text>
              </View>
            </View>

            {/* Cold Chain IoT Telemetry Module */}
            <ColdChainMonitor />

            {/* Quick Toggle for Supply Kit Drawer */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.supplyDrawerTrigger}
              onPress={() => setShowSupplyModal(!showSupplyModal)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 18 }}>🧰</Text>
                <Text style={styles.supplyTriggerText}>
                  {showSupplyModal ? 'Hide Phlebotomy Supply Kit ▲' : 'Open Phlebotomy Supply Kit & Needles (7 Items) ▼'}
                </Text>
              </View>
            </TouchableOpacity>

            {showSupplyModal && <SupplyKitTracker />}

            {/* Multi-Stop TSP Batch Route Planner */}
            <MultiStopRouteOptimizer />

            {/* Instant Field Travel & Mileage Reimbursement */}
            <ShiftFuelExpenseClaimer />

            {/* Phlebotomy Champions League & Weekly Badges */}
            <MLTLeaderboardRewards />

            {/* NABL SOP Knowledge Handbook & Search */}
            <PhlebotomyKnowledgeBase />

            {/* Live Dispatch Radar & Multi-Engine Mapping Hub */}
            {isOnline && <LiveDispatchRadarMap />}

            {/* Queue Filter Tabs */}
            {assignedOrders.length > 0 && (
              <View style={styles.filterTabsRow}>
                {[
                  { key: 'ALL', label: 'All Tasks' },
                  { key: 'PENDING', label: 'Pending' },
                  { key: 'EN_ROUTE', label: 'En-Route' },
                  { key: 'COLLECTED', label: 'Collected' },
                ].map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.filterTab, activeFilter === f.key && styles.filterTabActive]}
                    onPress={() => setActiveFilter(f.key as any)}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        activeFilter === f.key && styles.filterTabTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    width: '100%',
    maxWidth: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    width: '100%',
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 6,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#064e3b',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#059669',
    flexShrink: 0,
  },
  onlinePing: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  mltName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  badgeTier: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  badgeTierText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  ratingSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerIconText: {
    fontSize: 14,
  },
  logoutBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2d1515',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  logoutIcon: {
    fontSize: 14,
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
    width: '100%',
    maxWidth: '100%',
  },
  dashboardSection: {
    marginBottom: 8,
    width: '100%',
  },
  toggleCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderColor: '#1e293b',
    borderWidth: 1,
    width: '100%',
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  toggleSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    width: '100%',
  },
  metricCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  metricIcon: {
    fontSize: 16,
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#34d399',
  },
  metricLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  supplyDrawerTrigger: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  supplyTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  broadcastCard: {
    backgroundColor: '#0f2233',
    borderColor: '#0284c7',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  broadcastTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  broadcastDesc: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
    marginBottom: 10,
  },
  broadcastBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  broadcastBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  filterTab: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#059669',
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  activeCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dispatchPill: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dispatchPillText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 8,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 8,
    borderRadius: 10,
    marginBottom: 14,
  },
  slotText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  pinTag: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: '800',
  },
  cardActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  navMapsBtn: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navMapsBtnText: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
