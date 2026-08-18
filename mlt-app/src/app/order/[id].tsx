import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useMltStore } from '../../store/useMltStore';
import * as Location from 'expo-location';
import ColdChainMonitor from '../../components/ColdChainMonitor';
import TubeCollectionGuide from '../../components/TubeCollectionGuide';
import DigitalSignaturePad from '../../components/DigitalSignaturePad';
import PatientAllergyAlert from '../../components/PatientAllergyAlert';
import VeinScannerHUD from '../../components/VeinScannerHUD';
import VoiceSpecimenMemo from '../../components/VoiceSpecimenMemo';
import ClinicalIncidentReporter from '../../components/ClinicalIncidentReporter';
import EmergencySOSModal from '../../components/EmergencySOSModal';
import RealWorldMap from '../../components/RealWorldMap';
import PatientCommunicationMask from '../../components/PatientCommunicationMask';
import ThermalDegradationAI from '../../components/ThermalDegradationAI';
import ChainOfCustodyAudit from '../../components/ChainOfCustodyAudit';
import AIPreAnalyticalAnalyzer from '../../components/AIPreAnalyticalAnalyzer';
import CentrifugeCentricTimer from '../../components/CentrifugeCentricTimer';
import BiohazardWasteAudit from '../../components/BiohazardWasteAudit';
import CriticalPanicValueNotifier from '../../components/CriticalPanicValueNotifier';
import { BACKEND_URL } from '../../constants/api';

interface OrderDetails {
  _id: string;
  patient: { name: string; age: number; gender: string };
  tests: Array<{ _id: string; name: string; price: number; sampleType: string }>;
  address: {
    addressLine: string;
    coordinates: { lat: number; lng: number };
  };
  slot: { date: string; time: string };
  status: string;
  safetyPin: string;
  payment: { status: string; amount: number; method: string };
  qrToken?: string;
}

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { token, mlt } = useMltStore();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: 14.6819,
    lng: 77.6006,
  });

  // State Machine inputs
  const [pinInput, setPinInput] = useState('');
  const [vialsCollected, setVialsCollected] = useState(false);
  const [signedData, setSignedData] = useState<string | null>(null);
  const [fastingConfirmed, setFastingConfirmed] = useState(true);
  const [vitals, setVitals] = useState({ bp: '120/80', pulse: '74 bpm', temp: '98.4°F' });
  const [simulatingRoute, setSimulatingRoute] = useState(false);
  const [simSpeed, setSimSpeed] = useState(38);
  const [simEta, setSimEta] = useState(6);

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  const fetchOrderDetails = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Error: ' + msg);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  // Real GPS watch position
  useEffect(() => {
    if (!id || !order || !mlt) return;

    const socket = io(BACKEND_URL);
    let locationSubscription: Location.LocationSubscription | null = null;

    socket.on('connect', () => {
      socket.emit('join-room', `order_${id}`);
    });

    const startTracking = async () => {
      if (order.status === 'OnTheWay') {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            locationSubscription = await Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.High,
                timeInterval: 3000,
                distanceInterval: 10,
              },
              (location) => {
                const { latitude, longitude } = location.coords;
                setCurrentCoords({ lat: latitude, lng: longitude });
                socket.emit('update-location', {
                  mltId: mlt._id,
                  orderId: id,
                  lat: latitude,
                  lng: longitude,
                });
              }
            );
          }
        } catch (e) {
          console.warn('Location watch error:', e);
        }
      }
    };

    startTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      socket.disconnect();
    };
  }, [id, order?.status, mlt]);

  // Simulated GPS route driving
  useEffect(() => {
    let simInterval: any = null;
    if (simulatingRoute && order && mlt) {
      const socket = io(BACKEND_URL);
      const targetLat = order.address?.coordinates?.lat || 14.683;
      const targetLng = order.address?.coordinates?.lng || 77.601;

      simInterval = setInterval(() => {
        setCurrentCoords((prev) => {
          const nextLat = prev.lat + (targetLat - prev.lat) * 0.2;
          const nextLng = prev.lng + (targetLng - prev.lng) * 0.2;

          socket.emit('update-location', {
            mltId: mlt._id,
            orderId: id,
            lat: nextLat,
            lng: nextLng,
          });

          setSimEta((eta) => Math.max(1, eta - 1));
          setSimSpeed(Math.floor(30 + Math.random() * 15));

          const dist = Math.abs(nextLat - targetLat) + Math.abs(nextLng - targetLng);
          if (dist < 0.0005) {
            clearInterval(simInterval);
            setSimulatingRoute(false);
            const msg = '📍 Arrived at Patient Location! Ask patient for Safety Verification PIN.';
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.alert(msg);
            } else {
              Alert.alert('Arrived', msg);
            }
          }

          return { lat: nextLat, lng: nextLng };
        });
      }, 2000);

      return () => {
        if (simInterval) clearInterval(simInterval);
        socket.disconnect();
      };
    }
  }, [simulatingRoute, order, id, mlt]);

  const updateStatus = async (nextStatus: string, extraData: any = {}) => {
    setUpdating(true);
    try {
      const res = await axios.patch(
        `${BACKEND_URL}/api/orders/${id}/status`,
        { status: nextStatus, ...extraData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setOrder(res.data.data);
        const alertMsg = `Appointment status is now: ${nextStatus}`;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert(alertMsg);
        } else {
          Alert.alert('Status Updated', alertMsg);
        }

        if (['Submitted', 'ReportReady'].includes(nextStatus)) {
          router.replace('/');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Update Failed: ' + msg);
      } else {
        Alert.alert('Update Failed', msg);
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenNavigation = () => {
    if (!order) return;
    const { lat, lng } = order.address.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: '#fff' }}>Booking not found</Text>
      </View>
    );
  }

  const generatedBarcode = `HAR-${order._id.substring(order._id.length - 6).toUpperCase()}-BLD`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task #{order._id.substring(order._id.length - 5)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <EmergencySOSModal />
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{order.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        {/* Cold-Chain IoT Live Telemetry Card */}
        <ColdChainMonitor compact />

        {/* Patient Allergy & Clinical Caution Alerts */}
        <PatientAllergyAlert />

        {/* Real-World Interactive Navigation & Live GPS Route Map */}
        <RealWorldMap
          destination={order.address?.coordinates || { lat: 14.6885, lng: 77.608 }}
          patientName={order.patient.name}
          addressLine={order.address.addressLine}
          onArrived={() => updateStatus('Arrived', { safetyPin: order.safetyPin })}
        />

        {/* Secure Masked Calling & SMS Presets */}
        <PatientCommunicationMask patientName={order.patient.name} />

        {/* Specimen Barcode & Accession Card */}
        <View style={styles.barcodeCard}>
          <View style={styles.barcodeHeader}>
            <Text style={styles.barcodeLabel}>SPECIMEN VIAL BARCODE</Text>
            <Text style={styles.barcodeCode}>{generatedBarcode}</Text>
          </View>
          <View style={styles.barcodeGraphic}>
            <Text style={styles.barcodeGraphicText}>||| | |||| | || ||||| ||| | |||</Text>
          </View>
          <Text style={styles.barcodeTip}>
            Scan with handheld reader or stick printed barcode label onto SST/EDTA vials.
          </Text>
        </View>

        {/* Interactive Multi-Stage Collection Workflow */}
        <Text style={styles.sectionTitle}>Phlebotomy Clinical Workflow</Text>

        {/* Stage 1: Depart for Patient Location */}
        {order.status === 'Assigned' && (
          <View style={styles.workflowCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumBox}><Text style={styles.stepNum}>1</Text></View>
              <Text style={styles.workflowTitle}>Depart for Address</Text>
            </View>
            <Text style={styles.workflowDesc}>
              Confirm your cooler box has 2°C–8°C ice packs and sterile vacutainer needles.
            </Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => updateStatus('OnTheWay')}
              disabled={updating}
            >
              {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Depart: Mark On The Way 🚀</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Stage 2: Patient Arrival & PIN Verification */}
        {order.status === 'OnTheWay' && (
          <View style={styles.workflowCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumBox}><Text style={styles.stepNum}>2</Text></View>
              <Text style={styles.workflowTitle}>Arrive & Verify Safety PIN</Text>
            </View>
            <Text style={styles.workflowDesc}>
              Ask patient for their 4-digit verification PIN displayed on their live tracking screen:
            </Text>

            <View style={styles.pinBox}>
              <TextInput
                style={styles.pinInput}
                placeholder="••••"
                placeholderTextColor="#64748b"
                keyboardType="number-pad"
                maxLength={4}
                value={pinInput}
                onChangeText={setPinInput}
              />
              <TouchableOpacity
                style={styles.pinFillBtn}
                onPress={() => setPinInput(order.safetyPin)}
              >
                <Text style={styles.pinFillText}>⚡ Auto-Fill ({order.safetyPin})</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => updateStatus('Arrived', { safetyPin: pinInput })}
              disabled={updating}
            >
              {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Verify PIN & Check In 🔑</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Stage 3: Clinical Pre-requisites & Vacutainer Tube Drawing */}
        {order.status === 'Arrived' && (
          <View style={{ gap: 14 }}>
            {/* Pre-draw Clinical Checklist */}
            <View style={styles.checklistCard}>
              <Text style={styles.cardLabel}>PRE-DRAW CLINICAL CHECKS</Text>
              
              <TouchableOpacity
                style={styles.checkToggleRow}
                onPress={() => setFastingConfirmed(!fastingConfirmed)}
              >
                <View style={[styles.checkCircle, fastingConfirmed && styles.checkCircleActive]}>
                  {fastingConfirmed && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.checkToggleLabel}>10-12 Hour Fasting Verified (if applicable)</Text>
              </TouchableOpacity>

              <View style={styles.vitalsRow}>
                <View style={styles.vitalField}>
                  <Text style={styles.vitalLabel}>Blood Pressure</Text>
                  <TextInput
                    style={styles.vitalInput}
                    value={vitals.bp}
                    onChangeText={(t) => setVitals((v) => ({ ...v, bp: t }))}
                  />
                </View>
                <View style={styles.vitalField}>
                  <Text style={styles.vitalLabel}>Pulse Rate</Text>
                  <TextInput
                    style={styles.vitalInput}
                    value={vitals.pulse}
                    onChangeText={(t) => setVitals((v) => ({ ...v, pulse: t }))}
                  />
                </View>
              </View>
            </View>

            {/* Critical Panic Value Escalation Protocol */}
            <CriticalPanicValueNotifier patientName={order.patient.name} />

            {/* AI Pre-Analytical Quality & Physics Analyzer */}
            <AIPreAnalyticalAnalyzer orderId={order._id} />

            {/* AI Vein Finder & Optical Venipuncture Guide */}
            <VeinScannerHUD />

            {/* Vacutainer Order of Draw Guide */}
            <TubeCollectionGuide
              tests={order.tests}
              onAllCollected={(done) => setVialsCollected(done)}
            />

            {/* Field Centrifuge & Serum Clotting Suite */}
            <CentrifugeCentricTimer />

            {/* Voice Specimen Memo for Accessioning */}
            <VoiceSpecimenMemo patientName={order.patient.name} />

            {/* Digital Signature Pad */}
            <DigitalSignaturePad
              patientName={order.patient.name}
              onSigned={(sign) => setSignedData(sign)}
            />

            {/* Biomedical Waste & Sharps Disposal Audit */}
            <BiohazardWasteAudit orderId={order._id} />

            {/* NABL Quality Incident Reporter */}
            <ClinicalIncidentReporter orderId={order._id} />

            {/* Confirm Collection Button */}
            <TouchableOpacity
              style={[styles.actionBtn, (!vialsCollected || !signedData) && styles.disabledBtn]}
              disabled={updating || !vialsCollected || !signedData}
              onPress={() => updateStatus('Collected')}
            >
              {updating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionBtnText}>
                  {!vialsCollected
                    ? 'Check Off All Tubes Above ↑'
                    : !signedData
                    ? 'Sign Consent Above ↑'
                    : 'Confirm Specimen Collection 🩸'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Stage 4: Specimen Handover to Central Laboratory */}
        {order.status === 'Collected' && (
          <View style={styles.workflowCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumBox}><Text style={styles.stepNum}>4</Text></View>
              <Text style={styles.workflowTitle}>Laboratory Specimen Handover</Text>
            </View>
            <Text style={styles.workflowDesc}>
              Deliver the cold-chain sample vials to the central lab analyzer accessioning desk at Harsha Diagnostics.
            </Text>

            {/* Audio Voice Memo Player */}
            <VoiceSpecimenMemo patientName={order.patient.name} />

            {/* Specimen Thermal Degradation & Analyte Viability AI */}
            <ThermalDegradationAI />

            <View style={styles.paymentReceipt}>
              <Text style={styles.paymentTitle}>💰 Payment Settlement</Text>
              <Text style={styles.paymentDetail}>
                Amount: ₹{order.payment.amount} • Method: {order.payment.method} • Status: {order.payment.status}
              </Text>
            </View>

            {/* ISO 15189 Chain of Custody Audit Trail */}
            <ChainOfCustodyAudit orderId={order._id} />

            {/* Biomedical Waste & Sharps Segregation Audit */}
            <BiohazardWasteAudit orderId={order._id} />

            {/* Clinical Incident Logger */}
            <ClinicalIncidentReporter orderId={order._id} />

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => updateStatus('Submitted')}
              disabled={updating}
            >
              {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Submit Vials to Lab Analyzers 🧪</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Stage 5: Done */}
        {order.status === 'Submitted' && (
          <View style={styles.workflowCard}>
            <Text style={styles.workflowTitle}>✅ Processing in Central Lab</Text>
            <Text style={styles.workflowDesc}>
              Pathologists and automated analyzers are processing the specimen. Lab reports will be published shortly.
            </Text>
          </View>
        )}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backIcon: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38bdf8',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  statusPill: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '900',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 48,
  },
  card: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#064e3b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
  },
  gpsPillText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: 'bold',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  slotText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  navWidget: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#38bdf8',
  },
  navWidgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  navWidgetTurn: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  navWidgetEta: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: '600',
    marginTop: 1,
  },
  speedPill: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  speedText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: 'bold',
  },
  routeBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  navBtnText: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 12,
  },
  simBtn: {
    flex: 1,
    backgroundColor: '#064e3b',
    borderColor: '#059669',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  simBtnActive: {
    backgroundColor: '#7c2d12',
    borderColor: '#ea580c',
  },
  simBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  barcodeCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  barcodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  barcodeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
  },
  barcodeCode: {
    fontSize: 12,
    fontWeight: '900',
    color: '#38bdf8',
  },
  barcodeGraphic: {
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 4,
  },
  barcodeGraphicText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 4,
  },
  barcodeTip: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workflowCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  stepNumBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNum: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  workflowTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  workflowDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 14,
  },
  pinBox: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  pinInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34d399',
    textAlign: 'center',
    letterSpacing: 4,
  },
  pinFillBtn: {
    backgroundColor: '#1e293b',
    borderColor: '#38bdf8',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  pinFillText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  checklistCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  checkToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#64748b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkToggleLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  vitalField: {
    flex: 1,
  },
  vitalLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 4,
  },
  vitalInput: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionBtn: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledBtn: {
    backgroundColor: '#334155',
    opacity: 0.7,
  },
  paymentReceipt: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#34d399',
    marginBottom: 2,
  },
  paymentDetail: {
    fontSize: 11,
    color: '#cbd5e1',
  },
});
