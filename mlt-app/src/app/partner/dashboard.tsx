import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useMltStore } from '../../store/useMltStore';
import OrderQRCode from '../../components/OrderQRCode';
import ColdChainMonitor from '../../components/ColdChainMonitor';
import { BACKEND_URL } from '../../constants/api';

interface PartnerOrder {
  _id: string;
  patient?: { name: string; age?: number; gender?: string };
  tests?: Array<{ name: string; price: number }>;
  payment?: { amount: number; status: string; method: string };
  status: string;
  slot?: { date: string; time: string };
  qrToken?: string;
  address?: { addressLine: string };
}

const PartnerDashboard: React.FC = () => {
  const router = useRouter();
  const { token, mlt } = useMltStore();
  const [orders, setOrders] = useState<PartnerOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<PartnerOrder | null>(null);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (e: any) {
      console.warn('Error fetching partner orders:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const totalEarnings = orders
    .filter((o) => ['Submitted', 'ReportReady'].includes(o.status))
    .reduce((sum, o) => sum + (o.payment?.amount || 0), 0);

  const renderItem = ({ item }: { item: PartnerOrder }) => (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderTitle}>Order #{item._id.slice(-6).toUpperCase()}</Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor:
                item.status === 'ReportReady'
                  ? '#059669'
                  : item.status === 'Collected'
                  ? '#8b5cf6'
                  : '#0284c7',
            },
          ]}
        >
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.patientText}>
        🧑 {item.patient?.name || 'Patient'} ({item.patient?.age || '--'} yrs •{' '}
        {item.patient?.gender || 'Patient'})
      </Text>
      <Text style={styles.addressText}>📍 {item.address?.addressLine || 'Home Collection'}</Text>
      <Text style={styles.amountText}>
        💰 Value: ₹{item.payment?.amount || 0} ({item.payment?.status || 'Pending'})
      </Text>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.qrBtn} onPress={() => setSelectedOrder(item)}>
          <Text style={styles.qrBtnText}>📱 Accession QR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={() => router.push(`/order/${item._id}`)}
        >
          <Text style={styles.detailsBtnText}>View Task →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Partner Logistics & Fleet Hub</Text>
          <Text style={styles.subheading}>Central Lab Dispatch & Specimen Handover Desk</Text>
        </View>
        <View style={styles.fleetBadge}>
          <Text style={styles.fleetBadgeText}>FLEET ACTIVE</Text>
        </View>
      </View>

      {/* Cold Chain IoT Live Telemetry */}
      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        <ColdChainMonitor />
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TOTAL DISPATCHES</Text>
          <Text style={styles.summaryValue}>{orders.length}</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: '#10b981' }]}>
          <Text style={[styles.summaryLabel, { color: '#34d399' }]}>DELIVERED SAMPLES (₹)</Text>
          <Text style={[styles.summaryValue, { color: '#34d399' }]}>
            ₹{totalEarnings.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Leaderboard Banner */}
      <View style={styles.leaderboardCard}>
        <View style={styles.leaderboardHeader}>
          <Text style={styles.leaderboardTitle}>🏆 Weekly Phlebotomy Leaderboard</Text>
          <Text style={styles.leaderboardZone}>Anantapuramu Hub</Text>
        </View>
        <View style={styles.leaderboardList}>
          <Text style={styles.leaderboardItem}>🥇 Rajesh Kumar — 38 Samples Drawn (99.8% On-Time)</Text>
          <Text style={styles.leaderboardItem}>🥈 Anita Rao — 32 Samples Drawn (99.4% On-Time)</Text>
          <Text style={styles.leaderboardItem}>🥉 Suresh M. — 27 Samples Drawn (98.9% On-Time)</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No orders available right now.</Text>
            </View>
          }
        />
      )}

      {selectedOrder && (
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalCard}>
            <View style={styles.qrModalHeader}>
              <Text style={styles.qrModalTitle}>Specimen Accession QR Code</Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.closeIconBtn}>
                <Text style={styles.closeIconText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.qrModalSub}>
              Scan this QR code at Harsha Central Lab desk to log sample handover.
            </Text>

            <View style={styles.qrBox}>
              <OrderQRCode
                token={selectedOrder.qrToken || selectedOrder._id}
                size={220}
                label={`Order #${selectedOrder._id.slice(-6).toUpperCase()}`}
              />
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedOrder(null)}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  heading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  subheading: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  fleetBadge: {
    backgroundColor: '#064e3b',
    borderColor: '#059669',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fleetBadgeText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
  },
  leaderboardCard: {
    marginHorizontal: 16,
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leaderboardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#facc15',
  },
  leaderboardZone: {
    fontSize: 10,
    color: '#94a3b8',
  },
  leaderboardList: {
    gap: 4,
  },
  leaderboardItem: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  patientText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
  },
  amountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 12,
  },
  qrBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  qrBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  detailsBtn: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBox: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  qrModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(9, 13, 22, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  qrModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  qrModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeIconBtn: {
    padding: 4,
  },
  closeIconText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  qrModalSub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16,
  },
  qrBox: {
    marginVertical: 12,
  },
  closeBtn: {
    marginTop: 16,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default PartnerDashboard;
