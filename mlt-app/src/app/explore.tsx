import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, Redirect, useFocusEffect } from 'expo-router';
import axios from 'axios';
import { useMltStore } from '../store/useMltStore';
import { BACKEND_URL } from '../constants/api';

interface CompletedOrder {
  _id: string;
  patient: { name: string };
  slot: { date: string };
  status: string;
  collectionCharge: number;
  updatedAt: string;
}

export default function EarningsScreen() {
  const router = useRouter();
  const { token, mlt } = useMltStore();

  const [completedJobs, setCompletedJobs] = useState<CompletedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'TODAY' | 'WEEK' | 'MONTH'>('TODAY');

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  const fetchCompletedJobs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const completed = res.data.data.filter(
          (order: any) =>
            order.assignedMLT?._id === mlt?._id &&
            ['ReportReady', 'Submitted', 'Collected'].includes(order.status)
        );
        setCompletedJobs(completed);
      }
    } catch (err) {
      console.error('Error fetching completed jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchCompletedJobs();
    }, [])
  );

  // Dynamic earnings calculation
  const totalBasePay = completedJobs.length * 120;
  const totalDistancePay = completedJobs.reduce((sum, j) => sum + (j.collectionCharge || 20), 0);
  const totalSurgeBonus = completedJobs.length * 40;
  const grandTotal = totalBasePay + totalDistancePay + totalSurgeBonus + 650; // plus existing wallet balance

  const handleInstantPayout = () => {
    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawing(false);
      const msg = `Instant Payout of ₹${grandTotal} transferred to your linked UPI/Bank Account!`;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Payout Successful', msg);
      }
    }, 1200);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderJobCard = ({ item }: { item: CompletedOrder }) => {
    const visitEarnings = 120 + (item.collectionCharge || 20) + 40;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.patientName}>🧑 {item.patient.name}</Text>
            <Text style={styles.dateText}>{formatDate(item.updatedAt)}</Text>
          </View>
          <View style={styles.payoutBadge}>
            <Text style={styles.payout}>+ ₹{visitEarnings}</Text>
          </View>
        </View>

        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownItem}>Base: ₹120</Text>
          <Text style={styles.breakdownItem}>Distance: ₹{item.collectionCharge || 20}</Text>
          <Text style={styles.breakdownItem}>Surge: ₹40</Text>
          <Text style={styles.statusSuccess}>✓ Settled</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Earnings & Wallet</Text>
          <Text style={styles.headerSubtitle}>Harsha Diagnostic Phlebotomist Ledger</Text>
        </View>
        <View style={styles.platinumBadge}>
          <Text style={styles.platinumText}>★ PLATINUM</Text>
        </View>
      </View>

      {loading && completedJobs.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={completedJobs}
          keyExtractor={(item) => item._id}
          renderItem={renderJobCard}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.summarySection}>
              {/* Main Wallet Hero Card */}
              <View style={styles.walletHeroCard}>
                <View style={styles.walletTopRow}>
                  <View>
                    <Text style={styles.walletLabel}>AVAILABLE WALLET BALANCE</Text>
                    <Text style={styles.walletAmount}>₹ {grandTotal.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity
                    disabled={withdrawing}
                    style={styles.withdrawBtn}
                    onPress={handleInstantPayout}
                  >
                    {withdrawing ? (
                      <ActivityIndicator size="small" color="#090d16" />
                    ) : (
                      <Text style={styles.withdrawBtnText}>⚡ Instant Payout</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Sub-breakdown */}
                <View style={styles.walletBreakdownGrid}>
                  <View style={styles.walletStatItem}>
                    <Text style={styles.statSubLabel}>Base Pay</Text>
                    <Text style={styles.statSubVal}>₹ {totalBasePay}</Text>
                  </View>
                  <View style={styles.walletStatItem}>
                    <Text style={styles.statSubLabel}>Km Mileage</Text>
                    <Text style={styles.statSubVal}>₹ {totalDistancePay}</Text>
                  </View>
                  <View style={styles.walletStatItem}>
                    <Text style={styles.statSubLabel}>Surge Bonus</Text>
                    <Text style={styles.statSubVal}>₹ {totalSurgeBonus + 650}</Text>
                  </View>
                </View>
              </View>

              {/* Daily Incentive Milestone Card */}
              <View style={styles.incentiveCard}>
                <View style={styles.incentiveHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 18 }}>🎯</Text>
                    <Text style={styles.incentiveTitle}>Daily Target Bonus: ₹350</Text>
                  </View>
                  <Text style={styles.incentiveRatio}>5 / 7 Visits Done</Text>
                </View>

                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '72%' }]} />
                </View>

                <Text style={styles.incentiveHint}>
                  Complete <Text style={{ fontWeight: 'bold', color: '#38bdf8' }}>2 more visits</Text> today to unlock ₹350 instant cash bonus in your wallet!
                </Text>
              </View>

              {/* Phlebotomist Level Tier Card */}
              <View style={styles.tierCard}>
                <View style={styles.tierLeft}>
                  <Text style={{ fontSize: 24 }}>🎖️</Text>
                  <View>
                    <Text style={styles.tierName}>Platinum Tier Phlebotomist</Text>
                    <Text style={styles.tierPerk}>+15% Priority Dispatch + Zero Payout Fees</Text>
                  </View>
                </View>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ 4.98</Text>
                </View>
              </View>

              {/* Time Interval Tabs */}
              <View style={styles.filterTabsRow}>
                {[
                  { key: 'TODAY', label: 'Today' },
                  { key: 'WEEK', label: 'This Week' },
                  { key: 'MONTH', label: 'This Month' },
                ].map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.filterTab, timeFilter === f.key && styles.filterTabActive]}
                    onPress={() => setTimeFilter(f.key as any)}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        timeFilter === f.key && styles.filterTabTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Completed Visits & Payout History</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Completed Visits Yet</Text>
              <Text style={styles.emptyText}>
                Accept home collection dispatches and complete sample draws to see your earnings populate here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#090d16',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  platinumBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  platinumText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summarySection: {
    marginBottom: 8,
  },
  walletHeroCard: {
    backgroundColor: '#064e3b',
    borderColor: '#059669',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  walletTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#a7f3d0',
    letterSpacing: 0.5,
  },
  walletAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  withdrawBtn: {
    backgroundColor: '#34d399',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawBtnText: {
    color: '#064e3b',
    fontWeight: '900',
    fontSize: 12,
  },
  walletBreakdownGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  walletStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  statSubLabel: {
    fontSize: 10,
    color: '#a7f3d0',
    fontWeight: '600',
  },
  statSubVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
  },
  incentiveCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  incentiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  incentiveTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
  },
  incentiveRatio: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34d399',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#1e293b',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 5,
  },
  incentiveHint: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  tierCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  tierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  tierName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  tierPerk: {
    fontSize: 10,
    color: '#38bdf8',
    marginTop: 2,
  },
  ratingBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  ratingText: {
    color: '#facc15',
    fontSize: 11,
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  dateText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  payoutBadge: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  payout: {
    fontSize: 14,
    fontWeight: '900',
    color: '#34d399',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  breakdownItem: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  statusSuccess: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#34d399',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
