import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Vibration,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useRouter, Redirect, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { useMltStore } from '../store/useMltStore';
import { BACKEND_URL } from '../constants/api';

export default function IncomingAlertScreen() {
  const router = useRouter();
  const { token, mlt } = useMltStore();
  const params = useLocalSearchParams();
  const { orderId, patientName, testsCount, addressLine, slotTime, lat, lng } = params;

  const [timeLeft, setTimeLeft] = useState(30);
  const [assigning, setAssigning] = useState(false);

  // Vibrate on alert load
  useEffect(() => {
    if (!token) return;
    if (Platform.OS !== 'web') {
      Vibration.vibrate([400, 300, 400, 300], true);
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleDecline('Broadcast expired. Offer routed to Anita Rao.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      if (Platform.OS !== 'web') {
        Vibration.cancel();
      }
    };
  }, [token]);

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  const handleDecline = async (reason = 'Request declined.') => {
    if (orderId) {
      try {
        await axios.post(
          `${BACKEND_URL}/api/orders/${orderId}/decline`,
          { mltId: mlt?._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err: any) {
        console.error('Error declining job:', err.message);
      }
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(reason);
    } else {
      Alert.alert('Broadcast Cancelled', reason);
    }
    router.replace('/');
  };

  const handleAccept = async () => {
    setAssigning(true);
    try {
      let targetOrderId = orderId;

      if (!targetOrderId) {
        // Fallback: Find unassigned order in the database
        const ordersRes = await axios.get(`${BACKEND_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (ordersRes.data.success) {
          const unassignedOrder = ordersRes.data.data.find(
            (o: any) => o.status === 'Booked' && !o.assignedMLT
          );

          if (!unassignedOrder) {
            const msg =
              'No unassigned "Booked" orders found in the database. Please place a booking in the Customer App first!';
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.alert(msg);
            } else {
              Alert.alert('Dispatch Info', msg);
            }
            router.replace('/');
            return;
          }
          targetOrderId = unassignedOrder._id;
        }
      }

      // Assign the order to this MLT and update status
      const assignRes = await axios.patch(
        `${BACKEND_URL}/api/orders/${targetOrderId}/status`,
        { status: 'Assigned', mltId: mlt?._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (assignRes.data.success) {
        const msg = '⚡ Order Accepted! Opening GPS Turn-by-Turn Navigation.';
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert(msg);
        } else {
          Alert.alert('Accepted', msg);
        }
        router.replace(`/order/${targetOrderId}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Assignment Error: ' + msg);
      } else {
        Alert.alert('Assignment Error', msg);
      }
    } finally {
      setAssigning(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.alertContent}>
        {/* Flashing Alert Beacon */}
        <View style={styles.beaconRing}>
          <Text style={styles.beaconIcon}>🚨</Text>
        </View>

        <Text style={styles.title}>INCOMING SPECIMEN DISPATCH</Text>
        <Text style={styles.subtitle}>Harsha Diagnostics Central Hub Dispatcher</Text>

        {/* Countdown Timer with Earnings Badge */}
        <View style={styles.timerCircle}>
          <Text style={styles.timeVal}>{timeLeft}</Text>
          <Text style={styles.timeUnit}>seconds to accept</Text>
        </View>

        {/* Earnings Estimate Banner */}
        <View style={styles.earningsPill}>
          <Text style={styles.earningsText}>💰 Estimated Payout: ₹180 – ₹240</Text>
          <Text style={styles.earningsSub}>Base ₹120 + Distance ₹20 + Peak Surge ₹40</Text>
        </View>

        {/* Job Details Preview */}
        <View style={styles.previewCard}>
          <View style={styles.row}>
            <Text style={styles.previewLabel}>Patient Name:</Text>
            <Text style={styles.previewVal}>{patientName || 'Rajesh Varma'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.previewLabel}>Schedule Slot:</Text>
            <Text style={styles.previewVal}>{slotTime || '7:00 AM - 8:00 AM'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.previewLabel}>Collection Address:</Text>
            <Text style={[styles.previewVal, { maxWidth: '60%' }]} numberOfLines={1}>
              {addressLine || 'MIG Bus Stand Road, Anantapuramu'}
            </Text>
          </View>
          <View
            style={[
              styles.row,
              { borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 8, marginTop: 8 },
            ]}
          >
            <Text style={styles.previewLabel}>Tests / Specimen:</Text>
            <Text style={[styles.previewVal, { color: '#38bdf8', fontWeight: 'bold' }]}>
              {testsCount ? `${testsCount} Blood Tests` : 'Lipid & CBC Profile'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.previewLabel}>Cold-Chain Protocol:</Text>
            <Text style={[styles.previewVal, { color: '#34d399', fontWeight: 'bold' }]}>
              ❄️ 2°C - 8°C Cryo Gel Box
            </Text>
          </View>

          <TouchableOpacity
            style={styles.previewMapBtn}
            onPress={() => {
              const targetLat = lat || '14.6819';
              const targetLng = lng || '77.6006';
              const url = `https://www.google.com/maps/search/?api=1&query=${targetLat},${targetLng}`;
              Linking.openURL(url);
            }}
          >
            <Text style={styles.previewMapBtnText}>🗺️ Preview Patient Pin on Google Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.btn, styles.declineBtn]}
            onPress={() => handleDecline('Request declined by technician.')}
            disabled={assigning}
          >
            <Text style={styles.btnText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.acceptBtn]}
            onPress={handleAccept}
            disabled={assigning}
          >
            {assigning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Accept & Route ⚡</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#052317', // Deep Emerald
  },
  alertContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  beaconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#064e3b',
    borderColor: '#059669',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  beaconIcon: {
    fontSize: 38,
  },
  title: {
    color: '#34d399',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#a7f3d0',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  timerCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderColor: '#f59e0b',
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  timeVal: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '900',
  },
  timeUnit: {
    color: '#94a3b8',
    fontSize: 9,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  earningsPill: {
    backgroundColor: '#064e3b',
    borderColor: '#059669',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    maxWidth: 340,
  },
  earningsText: {
    color: '#34d399',
    fontSize: 14,
    fontWeight: '900',
  },
  earningsSub: {
    color: '#a7f3d0',
    fontSize: 10,
    marginTop: 2,
  },
  previewCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 16,
    width: '100%',
    maxWidth: 340,
    borderColor: '#1e293b',
    borderWidth: 1,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  previewLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  previewVal: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  previewMapBtn: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  previewMapBtnText: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 11,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 340,
    gap: 10,
  },
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineBtn: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
  },
  acceptBtn: {
    backgroundColor: '#10b981',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
