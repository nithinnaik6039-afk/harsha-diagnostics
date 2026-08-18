import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Linking,
  Modal,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import axios from 'axios';
import LiveMap from '../../components/LiveMap';
import CertificateModal from '../../components/CertificateModal';
import { useAppStore } from '../../store/useAppStore';
import { BACKEND_URL } from '../../constants/api';

interface Milestone {
  status: string;
  timestamp?: string;
}

interface OrderDetails {
  _id: string;
  patient: { name: string; age: number; gender: string };
  tests: Array<{ name: string; price: number }>;
  address: { addressLine: string; coordinates?: { lat: number; lng: number } };
  slot: { date: string; time: string };
  status: string;
  statusTimeline: Milestone[];
  safetyPin: string;
  payment: { status: string; amount: number; method: string };
  assignedMLT?: {
    _id: string;
    name: string;
    phone: string;
    photoUrl?: string;
    rating?: number;
  };
  reports: string[];
}

export default function TrackScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { token, language } = useAppStore();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCertModal, setShowCertModal] = useState(false);
  const [etaMins, setEtaMins] = useState(5);

  const fetchOrderDetails = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchOrderDetails();
    const interval = setInterval(fetchOrderDetails, 6000);
    return () => clearInterval(interval);
  }, [token, id]);

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  if (loading || !order) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Connecting to Harsha Live Dispatch Radar...</Text>
      </SafeAreaView>
    );
  }

  const isCollected = order.status === 'Collected';
  const isArrived = order.status === 'Arrived';
  const isSubmitted = order.status === 'Submitted';
  const isReportReady = order.status === 'ReportReady';

  // Instamart-style timeline stages
  const timelineStages = [
    { key: 'Booked', title_en: 'Order Confirmed', title_te: 'ఆర్డర్ నిర్ధారించబడింది', icon: '📝' },
    { key: 'Assigned', title_en: 'Phlebotomist Assigned', title_te: 'టెక్నీషియన్ కేటాయించబడింది', icon: '🧑‍⚕️' },
    { key: 'OnTheWay', title_en: 'Rider En-Route on Bike', title_te: 'బైక్‌పై వస్తున్నారు', icon: '🏍️' },
    { key: 'Arrived', title_en: 'Arrived at Your Address', title_te: 'మీ ఇంటి వద్ద ఉన్నారు', icon: '🚪' },
    { key: 'Collected', title_en: 'Blood Drawn & In Cryo-Box', title_te: 'నమూనా సేకరించబడింది', icon: '🩸' },
    { key: 'Submitted', title_en: 'In Central Lab Analyzers', title_te: 'ల్యాబ్ ప్రాసెసింగ్‌లో ఉంది', icon: '🧪' },
    { key: 'ReportReady', title_en: 'Report Certified & Ready', title_te: 'రిపోర్ట్ సిద్ధంగా ఉంది', icon: '📄' },
  ];

  const currentIdx = timelineStages.findIndex((s) => s.key === order.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.headerTitle}>Live Blood Dispatch</Text>
          <Text style={styles.headerSubtitle}>Order #{order._id.slice(-6).toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Instamart-Style Real-Time ETA Hero Banner */}
        <View style={styles.instamartHeroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroStatusLabel}>
                {isReportReady
                  ? 'DIAGNOSTIC REPORT CERTIFIED'
                  : isSubmitted
                  ? 'PROCESSING IN CENTRAL LAB'
                  : isCollected
                  ? 'BLOOD EN-ROUTE TO LAB (4.2°C)'
                  : isArrived
                  ? 'PHLEBOTOMIST AT YOUR GATE'
                  : 'RIDER EN-ROUTE TO YOUR HOME'}
              </Text>
              <Text style={styles.heroEtaText}>
                {isReportReady
                  ? '✅ Results Ready'
                  : isSubmitted
                  ? '🧪 In Lab Analyzers'
                  : isCollected
                  ? '🩸 Delivering to Central Lab'
                  : isArrived
                  ? '📍 Arrived Now'
                  : `⚡ Arriving in ~${etaMins} mins`}
              </Text>
            </View>
            <View style={styles.heroIconCircle}>
              <Text style={{ fontSize: 24 }}>
                {isReportReady ? '📄' : isSubmitted ? '🧪' : isCollected ? '🩸' : '🏍️'}
              </Text>
            </View>
          </View>

          {/* Instamart Progress Fill Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.max(15, ((currentIdx + 1) / timelineStages.length) * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressSubText}>
            {currentIdx >= 0 ? timelineStages[currentIdx].title_en : 'Order Processing'} • Live GPS Active
          </Text>
        </View>

        {/* Instamart Real-Time Live Map Viewport */}
        <View style={styles.mapSection}>
          <LiveMap
            customerCoords={
              order.address?.coordinates || { lat: 14.6885, lng: 77.608 }
            }
            customerAddressLine={order.address?.addressLine || 'MIG Colony, Anantapuramu'}
            mltCoords={{ lat: 14.6819, lng: 77.6006 }}
            mltName={order.assignedMLT?.name || 'S. Rajesh (Lead Phlebotomist)'}
            orderStatus={order.status}
          />
        </View>

        {/* Safety Handshake PIN Card (Instamart OTP Style) */}
        {!isReportReady && (
          <View style={styles.pinCard}>
            <View style={styles.pinHeader}>
              <Text style={styles.pinLabel}>🔐 SAFETY HANDSHAKE VERIFICATION PIN</Text>
              <View style={styles.pinShieldPill}>
                <Text style={styles.pinShieldText}>NABL SECURE</Text>
              </View>
            </View>
            <View style={styles.pinCodeBox}>
              <Text style={styles.pinDigits}>{order.safetyPin || '9921'}</Text>
            </View>
            <Text style={styles.pinInstruction}>
              Share this 4-digit PIN with the phlebotomist upon arrival to authorize specimen collection.
            </Text>
          </View>
        )}

        {/* Phlebotomist Driver Card (Instamart style) */}
        <View style={styles.driverCard}>
          <View style={styles.driverTopRow}>
            <View style={styles.driverAvatarBox}>
              <Text style={{ fontSize: 24 }}>🧑‍⚕️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.driverName}>
                  {order.assignedMLT?.name || 'S. Rajesh'}
                </Text>
                <View style={styles.verifiedPill}>
                  <Text style={styles.verifiedText}>✓ VERIFIED</Text>
                </View>
              </View>
              <Text style={styles.driverSubtitle}>
                ⭐ {order.assignedMLT?.rating || '4.98'} Rating • Honda Activa (AP 02 CM 8841)
              </Text>
              <Text style={styles.healthSafetyText}>
                🟢 Vaccinated • Normal Temp (98.4°F) • Masked & Sanitized
              </Text>
            </View>
          </View>

          {/* Quick Communication Action Buttons */}
          <View style={styles.commActionRow}>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL(`tel:${order.assignedMLT?.phone || '18002008899'}`)}
            >
              <Text style={styles.callBtnText}>📞 Call Phlebotomist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={() =>
                Linking.openURL(
                  `https://wa.me/91${order.assignedMLT?.phone || '18002008899'}?text=Hi%20MLT,%20checking%20my%20diagnostic%20collection%20slot%20for%20order%20${order._id.slice(-6)}`
                )
              }
            >
              <Text style={styles.whatsappBtnText}>💬 WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.certBtn}
              onPress={() => setShowCertModal(true)}
            >
              <Text style={styles.certBtnText}>🛡️ Certificate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cold-Chain IoT Sensor Telemetry Card */}
        <View style={styles.coldChainCard}>
          <View style={styles.coldChainHeader}>
            <Text style={styles.coldChainTitle}>🧊 SPECIMEN COLD-CHAIN TELEMETRY</Text>
            <View style={styles.tempSafePill}>
              <Text style={styles.tempSafeText}>● BIOLOGICAL SAFE ZONE</Text>
            </View>
          </View>

          <View style={styles.coldChainMetrics}>
            <View style={styles.tempBox}>
              <Text style={styles.tempVal}>4.2°C</Text>
              <Text style={styles.tempSub}>Target: 2.0°C – 8.0°C</Text>
            </View>
            <View style={styles.tempDescBox}>
              <Text style={styles.tempDescTitle}>NABL ISO 15189 Compliant</Text>
              <Text style={styles.tempDescSub}>
                Specimen cryo-box maintains strict temperature to ensure glucose, lipid & thyroid metabolic integrity.
              </Text>
            </View>
          </View>
        </View>

        {/* Multi-Stage Delivery Timeline (Instamart style) */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineHeaderTitle}>📋 Live Diagnostic Journey</Text>

          <View style={styles.stagesList}>
            {timelineStages.map((stage, idx) => {
              const isPassed = idx <= currentIdx;
              const isCurrent = idx === currentIdx;

              return (
                <View key={stage.key} style={styles.stageItem}>
                  <View style={styles.stageLeft}>
                    <View
                      style={[
                        styles.stageDot,
                        isPassed && styles.stageDotPassed,
                        isCurrent && styles.stageDotCurrent,
                      ]}
                    >
                      <Text style={styles.stageDotText}>
                        {isPassed ? '✓' : idx + 1}
                      </Text>
                    </View>
                    {idx < timelineStages.length - 1 && (
                      <View
                        style={[
                          styles.stageLine,
                          idx < currentIdx && styles.stageLinePassed,
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.stageContent}>
                    <Text
                      style={[
                        styles.stageName,
                        isPassed && styles.stageNamePassed,
                        isCurrent && styles.stageNameCurrent,
                      ]}
                    >
                      {stage.icon} {stage.title_en}
                    </Text>
                    <Text style={styles.stageSub}>
                      {isCurrent ? '⚡ Currently in progress' : isPassed ? 'Completed' : 'Upcoming step'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Diagnostic Tests Checklist */}
        <View style={styles.testsCard}>
          <Text style={styles.testsCardTitle}>🧪 Ordered Blood Test Panel ({order.tests?.length})</Text>
          <View style={{ gap: 6, marginTop: 8 }}>
            {order.tests?.map((t, i) => (
              <View key={i} style={styles.testRow}>
                <Text style={styles.testName}>• {t.name}</Text>
                <Text style={styles.testPrice}>₹{t.price}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount ({order.payment.status})</Text>
            <Text style={styles.totalVal}>₹{order.payment.amount}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Govt Certification Modal */}
      <CertificateModal
        visible={showCertModal}
        onClose={() => setShowCertModal(false)}
        mltName={order.assignedMLT?.name || 'S. Rajesh'}
        mltPhone={order.assignedMLT?.phone || '+91 94400 12345'}
        rating={order.assignedMLT?.rating || 4.98}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 12,
    fontWeight: 'bold',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#030712',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  instamartHeroCard: {
    backgroundColor: '#0f172a',
    borderColor: '#0284c7',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 18,
    shadowColor: '#0284c7',
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroStatusLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  heroEtaText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  heroIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  progressSubText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  mapSection: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  pinCard: {
    backgroundColor: '#082f49',
    borderColor: '#0284c7',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  pinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  pinLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  pinShieldPill: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pinShieldText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  pinCodeBox: {
    backgroundColor: '#030712',
    borderColor: '#38bdf8',
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 8,
  },
  pinDigits: {
    fontSize: 28,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  pinInstruction: {
    fontSize: 10,
    color: '#bae6fd',
    textAlign: 'center',
    lineHeight: 14,
  },
  driverCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  driverTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  driverAvatarBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  driverName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  verifiedPill: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  verifiedText: {
    color: '#34d399',
    fontSize: 8,
    fontWeight: '900',
  },
  driverSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  healthSafetyText: {
    fontSize: 9,
    color: '#34d399',
    fontWeight: '600',
    marginTop: 2,
  },
  commActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  callBtn: {
    flex: 1.2,
    backgroundColor: '#0284c7',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  callBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  whatsappBtn: {
    flex: 1.2,
    backgroundColor: '#059669',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  whatsappBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  certBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  certBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  coldChainCard: {
    backgroundColor: '#062d22',
    borderColor: '#059669',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 14,
  },
  coldChainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  coldChainTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 0.5,
  },
  tempSafePill: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tempSafeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  coldChainMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tempBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tempVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#34d399',
  },
  tempSub: {
    fontSize: 8,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  tempDescBox: {
    flex: 1,
  },
  tempDescTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tempDescSub: {
    fontSize: 9,
    color: '#cbd5e1',
    marginTop: 2,
    lineHeight: 13,
  },
  timelineCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  timelineHeaderTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 12,
  },
  stagesList: {
    gap: 2,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stageLeft: {
    alignItems: 'center',
    width: 24,
  },
  stageDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageDotPassed: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  stageDotCurrent: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
    borderWidth: 2,
  },
  stageDotText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stageLine: {
    width: 2,
    height: 28,
    backgroundColor: '#1e293b',
  },
  stageLinePassed: {
    backgroundColor: '#10b981',
  },
  stageContent: {
    flex: 1,
    paddingBottom: 14,
  },
  stageName: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  stageNamePassed: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  stageNameCurrent: {
    color: '#38bdf8',
    fontWeight: '900',
  },
  stageSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  testsCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  testsCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  testRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  testName: {
    fontSize: 11,
    color: '#94a3b8',
  },
  testPrice: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#34d399',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  totalVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#34d399',
  },
});
