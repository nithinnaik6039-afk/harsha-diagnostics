import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useRouter, Redirect, useFocusEffect } from 'expo-router';
import axios from 'axios';
import { useAppStore } from '../store/useAppStore';
import { BACKEND_URL } from '../constants/api';

interface OrderItem {
  _id: string;
  patient: {
    name: string;
    age: number;
    gender: string;
  };
  tests: Array<{
    _id: string;
    name: string;
    price: number;
  }>;
  slot: {
    date: string;
    time: string;
  };
  status: string;
  payment: {
    status: string;
    amount: number;
  };
  safetyPin: string;
  createdAt: string;
}

export default function OrdersScreen() {
  const router = useRouter();
  const { token, language } = useAppStore();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch orders from API
  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch orders when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        fetchOrders();
      }
    }, [token])
  );

  // Enforce authentication redirect if no session exists
  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ReportReady':
        return { bg: '#dcfce7', text: '#16a34a' }; // Green
      case 'Cancelled':
        return { bg: '#fee2e2', text: '#dc2626' }; // Red
      case 'Booked':
        return { bg: '#e0f2fe', text: '#0284c7' }; // Sky Blue
      case 'Assigned':
      case 'OnTheWay':
      case 'Arrived':
        return { bg: '#f0f9ff', text: '#0284c7' }; // Clean Blue
      case 'Collected':
      case 'Submitted':
        return { bg: '#f3e8ff', text: '#9333ea' }; // Purple
      default:
        return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(language === 'te' ? 'te-IN' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderOrderCard = ({ item }: { item: OrderItem }) => {
    const statusColors = getStatusColor(item.status);
    const testNames = item.tests.map((t) => t.name).join(', ');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.patientName}>🧑‍⚕️ {item.patient.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={styles.dateText}>
          📅 {formatDate(item.slot.date)} | ⏰ {item.slot.time}
        </Text>

        <Text style={styles.testsText} numberOfLines={2}>
          🧪 {testNames}
        </Text>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.priceLabel}>
              {language === 'te' ? 'మొత్తం ధర:' : 'Amount:'}
            </Text>
            <Text style={styles.price}>₹ {item.payment.amount}</Text>
          </View>

          {item.status !== 'Cancelled' && item.status !== 'ReportReady' && (
            <View style={styles.pinContainer}>
              <Text style={styles.pinLabel}>PIN</Text>
              <Text style={styles.pinCode}>{item.safetyPin}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => router.push(`/track/${item._id}`)}
          >
            <Text style={styles.trackBtnText}>
              {language === 'te' ? 'ట్రాక్ చేయండి →' : 'Track →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {language === 'te' ? 'నా బుకింగ్‌లు' : 'My Bookings'}
        </Text>
      </View>

      {loading && orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {language === 'te' ? 'మీకు ఇంకా ఏ బుకింగ్‌లు లేవు.' : "You don't have any bookings yet."}
              </Text>
              <TouchableOpacity
                style={styles.bookNowBtn}
                onPress={() => router.replace('/')}
              >
                <Text style={styles.bookNowBtnText}>
                  {language === 'te' ? 'టెస్ట్ బుక్ చేయండి' : 'Book a Test Now'}
                </Text>
              </TouchableOpacity>
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
    backgroundColor: '#f8fafc'
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  listContent: {
    padding: 16
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    marginTop: 50
  },
  emptyText: {
    color: '#64748b',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20
  },
  bookNowBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10
  },
  bookNowBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  dateText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 8
  },
  testsText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12
  },
  priceLabel: {
    fontSize: 10,
    color: '#64748b'
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  pinContainer: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderColor: '#cbd5e1',
    borderWidth: 1
  },
  pinLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b'
  },
  pinCode: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 1
  },
  trackBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  trackBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12
  }
});
