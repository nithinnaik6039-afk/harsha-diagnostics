import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Platform,
  Linking,
  Image
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import axios from 'axios';
import { WebView } from 'react-native-webview';
import { useAppStore, TestItem } from '../store/useAppStore';
import { calculateDistance } from '../utils/distance';
import { BACKEND_URL } from '../constants/api';
const CENTER_COORDS = { lat: 14.6819, lng: 77.6006 };

export default function CartScreen() {
  const router = useRouter();
  const { token, cart, removeFromCart, clearCart, language, user } = useAppStore();

  const [loading, setLoading] = useState(false);

  // Form States
  const [patientName, setPatientName] = useState(user?.name || '');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  
  const [slotDate, setSlotDate] = useState('2026-07-10');
  const [slotTime, setSlotTime] = useState('7:00 AM - 8:00 AM');

  const [addressLine, setAddressLine] = useState('');
  const [lat, setLat] = useState('14.6830'); // Default: Close preset (0.13 km)
  const [lng, setLng] = useState('77.6010');

  const [distance, setDistance] = useState(0);
  const [visitFee, setVisitFee] = useState(0);
  const [outsideZone, setOutsideZone] = useState(false);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'CashOnCollection'>('UPI');
  const [upiSubMethod, setUpiSubMethod] = useState<'AppPay' | 'Scanner' | 'Razorpay'>('AppPay');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'GooglePay' | 'PhonePe' | 'Paytm' | 'BHIM'>('Paytm');

  // Direct payment verification states
  const [showDirectPayConfirm, setShowDirectPayConfirm] = useState(false);
  const [directPayOrderId, setDirectPayOrderId] = useState('');
  const [directPayTxId, setDirectPayTxId] = useState('');

  // Razorpay checkout modal
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [rzpHtml, setRzpHtml] = useState('');
  const [pendingOrderId, setPendingOrderId] = useState('');

  // Calculate distance and collection charges dynamically in frontend for UI feedback
  useEffect(() => {
    if (!token) return;
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      const dist = calculateDistance(CENTER_COORDS.lat, CENTER_COORDS.lng, latNum, lngNum);
      setDistance(dist);

      if (dist > 5.0) {
        setOutsideZone(true);
        setVisitFee(0);
      } else {
        setOutsideZone(false);
        setVisitFee(dist > 3.0 ? 20 : 0);
      }
    }
  }, [lat, lng, token]);

  // Enforce authentication redirect if no session exists
  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const total = subtotal + visitFee;

  // Preset location shortcuts for testing
  const applyPreset = (preset: 'free' | 'visitCharge' | 'outside') => {
    if (preset === 'free') {
      setAddressLine('MIG Bus Stand, Anantapuramu');
      setLat('14.6830');
      setLng('77.6010');
    } else if (preset === 'visitCharge') {
      setAddressLine('Prasanth Nagar, Anantapuramu');
      setLat('14.7100');
      setLng('77.6100');
    } else {
      setAddressLine('Dharmavaram bypass road, AP');
      setLat('14.4100');
      setLng('77.7100');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (!patientName.trim()) {
      Alert.alert('Error', language === 'te' ? 'రోగి పేరు నమోదు చేయండి' : 'Patient name is required');
      return;
    }
    if (!patientAge || isNaN(parseInt(patientAge))) {
      Alert.alert('Error', language === 'te' ? 'సరైన వయస్సు నమోదు చేయండి' : 'Valid patient age is required');
      return;
    }
    if (!addressLine.trim()) {
      Alert.alert('Error', language === 'te' ? 'చిరునామా నమోదు చేయండి' : 'Address is required');
      return;
    }

    if (outsideZone) {
      Alert.alert(
        language === 'te' ? 'సర్వీస్ అందుబాటులో లేదు' : 'Outside Service Zone',
        language === 'te'
          ? 'ప్రస్తుతం మేము మీ చిరునామాకు సేవ చేయలేము. మీరు వెయిట్‌లిస్ట్‌లో చేరాలనుకుంటున్నారా?'
          : 'We cannot service this area. Would you like to join our waiting list?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: language === 'te' ? 'వెయిట్‌లిస్ట్‌లో చేరండి' : 'Join Waitlist',
            onPress: () => {
              Alert.alert(
                language === 'te' ? 'ధన్యవాదాలు' : 'Thank You',
                language === 'te' ? 'మిమ్మల్ని వెయిట్‌లిస్ట్‌లో చేర్చాము.' : 'You have been added to the waitlist.'
              );
              clearCart();
              router.replace('/');
            }
          }
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const parsedAge = parseInt(patientAge);
      const safeAge = isNaN(parsedAge) || parsedAge <= 0 ? 28 : parsedAge;
      const parsedLat = parseFloat(lat);
      const safeLat = isNaN(parsedLat) ? 14.6819 : parsedLat;
      const parsedLng = parseFloat(lng);
      const safeLng = isNaN(parsedLng) ? 77.6006 : parsedLng;

      const payload = {
        patient: { name: patientName || 'Patient', age: safeAge, gender: patientGender || 'Male' },
        tests: cart.map((item) => item._id),
        address: { addressLine, coordinates: { lat: safeLat, lng: safeLng } },
        slot: { date: slotDate, time: slotTime },
        paymentMethod
      };

      const orderRes = await axios.post(`${BACKEND_URL}/api/orders`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!orderRes.data.success) throw new Error(orderRes.data.message);
      const createdOrder = orderRes.data.data;

      // STEP 2: For Cash on Collection — go directly to tracking
      if (paymentMethod === 'CashOnCollection') {
        clearCart();
        Alert.alert(
          language === 'te' ? 'విజయవంతం' : 'Booking Confirmed',
          language === 'te'
            ? 'మీ బుకింగ్ నిర్ధారించబడింది. సేకరణ సమయంలో చెల్లించండి.'
            : 'Booking confirmed. Pay cash when the phlebotomist arrives.'
        );
        router.replace(`/track/${createdOrder._id}`);
        return;
      }

      // STEP 2.5: For direct UPI / Scanner payment
      if (paymentMethod === 'UPI' && upiSubMethod !== 'Razorpay') {
        setDirectPayOrderId(createdOrder._id);
        const randomTx = 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        setDirectPayTxId(randomTx);
        
        if (upiSubMethod === 'AppPay') {
          // Construct App-specific deep links
          let upiUrl = '';
          const baseQuery = `pa=harshadiagnostics@oksbi&pn=Harsha%20Diagnostics&am=${total}&cu=INR&tn=Booking%20${createdOrder._id}`;
          
          if (selectedUpiApp === 'Paytm') {
            upiUrl = `paytmmp://pay?${baseQuery}`;
          } else if (selectedUpiApp === 'PhonePe') {
            upiUrl = `phonepe://pay?${baseQuery}`;
          } else if (selectedUpiApp === 'GooglePay') {
            upiUrl = `gpay://upi/pay?${baseQuery}`;
          } else {
            upiUrl = `upi://pay?${baseQuery}`;
          }
          
          Linking.openURL(upiUrl).catch((err) => {
            console.log('Deep link launch failed, opening general UPI link:', err.message);
            Linking.openURL(`upi://pay?${baseQuery}`).catch((e) => {
              console.log('General UPI link launch failed:', e.message);
            });
          });
        }
        
        setShowDirectPayConfirm(true);
        return;
      }

      // STEP 3: For UPI/Card — get Razorpay order and launch checkout
      const rzpRes = await axios.post(
        `${BACKEND_URL}/api/payments/create-order`,
        { orderId: createdOrder._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!rzpRes.data.success) throw new Error(rzpRes.data.message);
      const rzpData = rzpRes.data.data;

      // Build Razorpay checkout HTML page
      const html = buildRazorpayHtml(rzpData, createdOrder._id);
      setRzpHtml(html);
      setPendingOrderId(createdOrder._id);
      setShowRazorpay(true);

      if (Platform.OS === 'web') {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.open();
          newWindow.document.write(html);
          newWindow.document.close();
        } else {
          Alert.alert('Popup Blocked', 'Please allow popups in your browser to proceed with payment.');
        }
      }

    } catch (err: any) {
      Alert.alert('Booking Error', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Build the Razorpay HTML page injected into WebView
  const buildRazorpayHtml = (rzpData: any, orderId: string) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    body { font-family: sans-serif; background: #0f172a; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
    .card { background:#1e293b; border-radius:16px; padding:32px; text-align:center; color:white; max-width:360px; width:90%; }
    h2 { color:#38bdf8; margin-bottom:8px; } p { color:#94a3b8; margin-bottom:24px; }
    .amt { font-size:28px; font-weight:bold; color:#34d399; margin:16px 0; }
    .pay-btn { background: linear-gradient(135deg,#2563eb,#1d4ed8); color:white; border:none; padding:14px 32px; border-radius:12px; font-size:16px; font-weight:bold; cursor:pointer; width:100%; }
    .cash-btn { background:#334155; color:#94a3b8; border:none; padding:12px; border-radius:10px; font-size:14px; cursor:pointer; width:100%; margin-top:12px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>💳 Harsha Diagnostics</h2>
    <p>${rzpData.description || 'Blood Sample Collection'}</p>
    <div class="amt">₹ ${(rzpData.amount / 100).toFixed(2)}</div>
    <button class="pay-btn" onclick="openRazorpay()">Pay Securely</button>
    <button class="cash-btn" onclick="cancelPayment()">Cancel Payment</button>
  </div>
  <script>
    function sendPaymentMessage(msgObj) {
      var payload = JSON.stringify(msgObj);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(payload);
      } else if (window.opener) {
        window.opener.postMessage(payload, '*');
        window.close();
      }
    }
    function openRazorpay() {
      var options = {
        key: "${rzpData.keyId}",
        amount: "${rzpData.amount}",
        currency: "${rzpData.currency}",
        name: "Harsha Diagnostics",
        description: "${rzpData.description}",
        order_id: "${rzpData.rzpOrderId}",
        handler: function(response) {
          sendPaymentMessage({
            type: 'PAYMENT_SUCCESS',
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            orderId: "${orderId}"
          });
        },
        prefill: { name: "${rzpData.patientName}" },
        theme: { color: "#2563eb" },
        modal: {
          ondismiss: function() {
            sendPaymentMessage({ type: 'PAYMENT_DISMISSED' });
          }
        }
      };
      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function(response) {
        sendPaymentMessage({ type: 'PAYMENT_FAILED', error: response.error.description });
      });
      rzp.open();
    }
    function cancelPayment() {
      sendPaymentMessage({ type: 'PAYMENT_DISMISSED' });
    }
    // Auto-open on load
    window.onload = function() { setTimeout(openRazorpay, 400); }
  </script>
</body>
</html>`;
  };

  // Handle messages from the Razorpay WebView
  const handleWebViewMessage = async (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);

      if (msg.type === 'PAYMENT_SUCCESS') {
        setShowRazorpay(false);
        setLoading(true);
        try {
          // Verify the payment signature on the backend
          const verifyRes = await axios.post(
            `${BACKEND_URL}/api/payments/verify`,
            {
              razorpayOrderId: msg.razorpay_order_id,
              razorpayPaymentId: msg.razorpay_payment_id,
              razorpaySignature: msg.razorpay_signature,
              orderId: msg.orderId
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (verifyRes.data.success) {
            clearCart();
            Alert.alert(
              language === 'te' ? '💳 చెల్లింపు సఫలం' : '💳 Payment Successful',
              language === 'te'
                ? `₹${verifyRes.data.data.amount} చెల్లించబడింది. మీ బుకింగ్ నిర్ధారించబడింది!`
                : `₹${verifyRes.data.data.amount} paid. Your appointment is confirmed!`
            );
            router.replace(`/track/${msg.orderId}`);
          } else {
            Alert.alert('Verification Failed', verifyRes.data.message);
          }
        } catch (err: any) {
          Alert.alert('Verification Error', err.response?.data?.message || err.message);
        } finally {
          setLoading(false);
        }

      } else if (msg.type === 'PAYMENT_DISMISSED') {
        setShowRazorpay(false);
        Alert.alert(
          language === 'te' ? 'చెల్లింపు రద్దు' : 'Payment Cancelled',
          language === 'te'
            ? 'చెల్లింపు రద్దు చేయబడింది. మీ బుకింగ్ Pending స్థితిలో ఉంది.'
            : 'Payment cancelled. Your booking is saved with Pending payment status.'
        );
        // Still navigate to tracking — booking exists, payment pending
        router.replace(`/track/${pendingOrderId}`);
      } else if (msg.type === 'PAYMENT_FAILED') {
        setShowRazorpay(false);
        Alert.alert('Payment Failed', msg.error || 'Payment could not be processed');
      }
    } catch (e) {
      console.error('WebView message parse error:', e);
    }
  };

  // Listen to postMessage from the opened window on web platform
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebMessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'PAYMENT_SUCCESS' || msg.type === 'PAYMENT_DISMISSED' || msg.type === 'PAYMENT_FAILED') {
            handleWebViewMessage({
              nativeEvent: { data: event.data }
            });
          }
        } catch (e) {
          // Ignore non-JSON messages
        }
      };
      window.addEventListener('message', handleWebMessage);
      return () => {
        window.removeEventListener('message', handleWebMessage);
      };
    }
  }, [pendingOrderId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            router.replace('/');
          }}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'te' ? 'నా కార్ట్' : 'Your Cart'}
        </Text>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>
            {language === 'te' ? 'మీ కార్ట్ ఖాళీగా ఉంది. పరీక్షలను జోడించండి.' : 'Your cart is empty. Please add blood tests from the catalog.'}
          </Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/')}>
            <Text style={styles.browseText}>
              {language === 'te' ? 'బుకింగ్ ప్రారంభించండి' : 'Browse Tests'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
          {/* Cart Items List */}
          <Text style={styles.sectionTitle}>
            {language === 'te' ? 'ఎంచుకున్న పరీక్షలు' : 'Selected Tests'}
          </Text>
          {cart.map((item) => (
            <View key={item._id} style={styles.cartItemCard}>
              <View style={styles.cartItemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category} • ₹ {item.price}</Text>
              </View>
              <TouchableOpacity
                onPress={() => removeFromCart(item._id)}
                style={styles.removeBtn}
              >
                <Text style={styles.removeIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Patient Details Form */}
          <Text style={styles.sectionTitle}>
            {language === 'te' ? 'రోగి వివరాలు' : 'Patient Details'}
          </Text>
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>
              {language === 'te' ? 'రోగి పేరు' : 'Patient Name'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Harsha Naik"
              value={patientName}
              onChangeText={setPatientName}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.inputLabel}>
                  {language === 'te' ? 'వయస్సు' : 'Age'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 45"
                  keyboardType="number-pad"
                  value={patientAge}
                  onChangeText={setPatientAge}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>
                  {language === 'te' ? 'లింగం' : 'Gender'}
                </Text>
                <View style={styles.genderRow}>
                  {['Male', 'Female'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderBtn,
                        patientGender === g && styles.activeGenderBtn
                      ]}
                      onPress={() => setPatientGender(g)}
                    >
                      <Text style={[
                        styles.genderText,
                        patientGender === g && styles.activeGenderText
                      ]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Collection Time Slot Selector */}
          <Text style={styles.sectionTitle}>
            {language === 'te' ? 'తేదీ & టైమ్ స్లాట్' : 'Date & Time Slot'}
          </Text>
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.input}
              value={slotDate}
              onChangeText={setSlotDate}
            />
            <Text style={styles.inputLabel}>Preferred Time Window</Text>
            <View style={styles.slotsGrid}>
              {['6:00 AM - 7:00 AM', '7:00 AM - 8:00 AM', '8:00 AM - 9:00 AM', '9:00 AM - 10:00 AM'].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.slotBtn,
                    slotTime === time && styles.activeSlotBtn
                  ]}
                  onPress={() => setSlotTime(time)}
                >
                  <Text style={[
                    styles.slotText,
                    slotTime === time && styles.activeSlotText
                  ]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Address & GPS Geofence Simulator */}
          <Text style={styles.sectionTitle}>
            {language === 'te' ? 'చిరునామా & లొకేషన్ సిమ్యులేటర్' : 'Address & Location Simulator'}
          </Text>
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>
              {language === 'te' ? 'చిరునామా' : 'Full Address'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter home collection street & area..."
              value={addressLine}
              onChangeText={setAddressLine}
            />

            <Text style={styles.inputLabel}>GPS Coordinates Simulator</Text>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.subInputLabel}>Latitude</Text>
                <TextInput
                  style={styles.smallInput}
                  value={lat}
                  onChangeText={setLat}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subInputLabel}>Longitude</Text>
                <TextInput
                  style={styles.smallInput}
                  value={lng}
                  onChangeText={setLng}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={[styles.subInputLabel, { marginTop: 10, marginBottom: 4 }]}>Quick Location Presets</Text>
            <View style={[styles.row, { marginBottom: 12 }]}>
              <TouchableOpacity
                style={[styles.genderBtn, { flex: 1, marginRight: 6, paddingVertical: 8 }]}
                onPress={() => applyPreset('free')}
              >
                <Text style={[styles.genderText, { fontSize: 12 }]}>Free Zone</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderBtn, { flex: 1, marginRight: 6, paddingVertical: 8 }]}
                onPress={() => applyPreset('visitCharge')}
              >
                <Text style={[styles.genderText, { fontSize: 12 }]}>Visit Fee Zone</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderBtn, { flex: 1, paddingVertical: 8 }]}
                onPress={() => applyPreset('outside')}
              >
                <Text style={[styles.genderText, { fontSize: 12 }]}>Outside Zone</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.verifyMapBtn}
              onPress={() => {
                const latNum = parseFloat(lat);
                const lngNum = parseFloat(lng);
                if (!isNaN(latNum) && !isNaN(lngNum)) {
                  const url = `https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`;
                  Linking.openURL(url);
                } else {
                  Alert.alert(
                    language === 'te' ? 'తప్పు కోఆర్డినేట్లు' : 'Invalid Coordinates',
                    language === 'te' 
                      ? 'దయచేసి సరైన లాటిట్యూడ్ మరియు లాంగిట్యూడ్ నమోదు చేయండి.' 
                      : 'Please enter valid numbers for latitude and longitude.'
                  );
                }
              }}
            >
              <Text style={styles.verifyMapBtnText}>
                {language === 'te' ? '🗺️ గూగుల్ మ్యాప్స్ లో సరిచూడండి' : '🗺️ Verify on Google Maps'}
              </Text>
            </TouchableOpacity>

            {/* Distance Feedback Badge */}
            <View style={[
              styles.feedbackBadge,
              outsideZone ? styles.badFeedback : styles.goodFeedback
            ]}>
              <Text style={[
                styles.feedbackText,
                outsideZone ? styles.badFeedbackText : styles.goodFeedbackText
              ]}>
                📍 Distance: {distance} km • {outsideZone 
                  ? (language === 'te' ? 'పరిధి దాటినది (సర్వీస్ లేదు)' : 'Outside Geofence Zone') 
                  : (language === 'te' ? 'పరిధిలో ఉంది (సర్వీస్ కలదు)' : 'Inside Service Zone')}
              </Text>
            </View>
          </View>

          {/* Payment Method Selector */}
          <Text style={styles.sectionTitle}>
            {language === 'te' ? 'చెల్లింపు పద్ధతి' : 'Payment Method'}
          </Text>
          <View style={styles.formCard}>
            {(['UPI', 'Card', 'CashOnCollection'] as const).map((method) => (
              <View key={method}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodRow,
                    paymentMethod === method && styles.paymentMethodActive
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text style={styles.paymentMethodIcon}>
                    {method === 'UPI' ? '📲' : method === 'Card' ? '💳' : '💵'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.paymentMethodLabel,
                      paymentMethod === method && { color: '#2563eb', fontWeight: 'bold' }
                    ]}>
                      {method === 'UPI' ? 'UPI Pay (Direct / Scan / Razorpay)' :
                       method === 'Card' ? 'Credit / Debit Card' :
                       (language === 'te' ? 'సేకరణ సమయంలో నగదు' : 'Cash on Collection')}
                    </Text>
                    <Text style={styles.paymentMethodSub}>
                      {method === 'CashOnCollection'
                        ? (language === 'te' ? 'ఫ్లెబోటోమిస్ట్ వచ్చినప్పుడు చెల్లించండి' : 'Pay when phlebotomist arrives')
                        : (method === 'UPI' ? 'Pay directly via apps or scan QR' : 'Secured by Razorpay')}
                    </Text>
                  </View>
                  <View style={[
                    styles.radioOuter,
                    paymentMethod === method && styles.radioOuterActive
                  ]}>
                    {paymentMethod === method && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>

                {/* Sub-selector for UPI */}
                {method === 'UPI' && paymentMethod === 'UPI' && (
                  <View style={styles.upiSubContainer}>
                    {/* Segment Tab Controls */}
                    <View style={styles.segmentContainer}>
                      <TouchableOpacity
                        style={[styles.segmentBtn, upiSubMethod === 'AppPay' && styles.segmentBtnActive]}
                        onPress={() => setUpiSubMethod('AppPay')}
                      >
                        <Text style={[styles.segmentText, upiSubMethod === 'AppPay' && styles.segmentTextActive]}>
                          📱 UPI Apps
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.segmentBtn, upiSubMethod === 'Scanner' && styles.segmentBtnActive]}
                        onPress={() => setUpiSubMethod('Scanner')}
                      >
                        <Text style={[styles.segmentText, upiSubMethod === 'Scanner' && styles.segmentTextActive]}>
                          📷 Scan QR
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.segmentBtn, upiSubMethod === 'Razorpay' && styles.segmentBtnActive]}
                        onPress={() => setUpiSubMethod('Razorpay')}
                      >
                        <Text style={[styles.segmentText, upiSubMethod === 'Razorpay' && styles.segmentTextActive]}>
                          🌐 Cards/Net
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Rendering corresponding UPI flows */}
                    {upiSubMethod === 'AppPay' && (
                      <View style={styles.upiAppsContainer}>
                        <Text style={styles.upiInstruction}>Select your preferred UPI app:</Text>
                        <View style={styles.upiAppsRow}>
                          {(['Paytm', 'PhonePe', 'GooglePay', 'BHIM'] as const).map((app) => (
                            <TouchableOpacity
                              key={app}
                              style={[
                                styles.upiAppBtn,
                                selectedUpiApp === app && styles.upiAppBtnActive
                              ]}
                              onPress={() => setSelectedUpiApp(app)}
                            >
                              <Text style={styles.upiAppIcon}>
                                {app === 'Paytm' ? '💰' : app === 'PhonePe' ? '🟣' : app === 'GooglePay' ? '🔵' : '🇮🇳'}
                              </Text>
                              <Text style={styles.upiAppName}>
                                {app === 'GooglePay' ? 'GPay' : app}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {upiSubMethod === 'Scanner' && (
                      <View style={styles.scannerContainer}>
                        <Text style={styles.upiInstruction}>
                          Scan QR Code on check-out to pay directly using any app.
                        </Text>
                        <View style={styles.qrPlaceholder}>
                          <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>
                            QR Code will generate upon clicking Pay & Confirm
                          </Text>
                        </View>
                      </View>
                    )}

                    {upiSubMethod === 'Razorpay' && (
                      <View style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
                        <Text style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>
                          Standard Razorpay checkout supporting cards, net banking, and other UPI IDs.
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Pricing Review */}
          <Text style={styles.sectionTitle}>
            {language === 'te' ? 'ధరల వివరాలు' : 'Pricing Summary'}
          </Text>
          <View style={styles.summaryCard}>
            <View style={styles.priceDetailRow}>
              <Text style={styles.summaryLabel}>
                {language === 'te' ? 'పరీక్షల మొత్తం:' : 'Tests Subtotal'}
              </Text>
              <Text style={styles.summaryValue}>₹ {subtotal}</Text>
            </View>

            <View style={styles.priceDetailRow}>
              <Text style={styles.summaryLabel}>
                {language === 'te' ? 'హోమ్ విజిటింగ్ ఛార్జీ:' : 'Home Visit Fee'}
              </Text>
              <Text style={[styles.summaryValue, visitFee === 0 && { color: '#16a34a' }]}>
                {visitFee === 0 ? 'FREE' : `₹ ${visitFee}`}
              </Text>
            </View>

            <View style={[styles.priceDetailRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>
                {language === 'te' ? 'మొత్తం చెల్లించవలసినది:' : 'Total Amount'}
              </Text>
              <Text style={styles.totalValue}>₹ {total}</Text>
            </View>

            {outsideZone && (
              <Text style={styles.warningText}>
                ⚠️ {language === 'te'
                  ? 'చిరునామా సేవ చేయలేని దూరంలో ఉంది.'
                  : 'Address is outside the service boundary.'}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.checkoutBtn, (outsideZone || loading) && styles.disabledBtn]}
              onPress={handleCheckout}
              disabled={outsideZone || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.checkoutBtnText}>
                  {paymentMethod === 'CashOnCollection'
                    ? (language === 'te' ? 'బుకింగ్ నిర్ధారించండి →' : 'Confirm Booking →')
                    : (language === 'te' ? '💳 చెల్లించి నిర్ధారించండి →' : '💳 Pay & Confirm →')}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Razorpay Checkout WebView Modal */}
          <Modal visible={showRazorpay} animationType="slide" statusBarTranslucent>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
              <View style={styles.rzpHeader}>
                <Text style={styles.rzpHeaderTitle}>💳 Secure Payment</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowRazorpay(false);
                    Alert.alert('Payment Cancelled', 'Your booking is saved with Pending payment.');
                    router.replace(`/track/${pendingOrderId}`);
                  }}
                  style={styles.rzpCloseBtn}
                >
                  <Text style={styles.rzpCloseText}>✕ Close</Text>
                </TouchableOpacity>
              </View>
              {Platform.OS === 'web' ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                  <Text style={{ color: '#94a3b8', textAlign: 'center', fontSize: 15, lineHeight: 24 }}>
                    🌐 Razorpay checkout is opening in a new browser tab.{`\n\n`}
                    After completing payment, return here and your booking will be confirmed.
                  </Text>
                </View>
              ) : (
                <WebView
                  source={{ html: rzpHtml }}
                  onMessage={handleWebViewMessage}
                  style={{ flex: 1 }}
                  javaScriptEnabled
                  domStorageEnabled
                  startInLoadingState
                />
              )}
            </SafeAreaView>
          </Modal>

          {/* Direct Payment Confirmation Overlay Modal */}
          <Modal visible={showDirectPayConfirm} animationType="slide" statusBarTranslucent>
            <SafeAreaView style={styles.directPayConfirmContainer}>
              <View style={styles.directPayConfirmCard}>
                <Text style={styles.directPayTitle}>
                  {upiSubMethod === 'Scanner' ? '📷 Scan QR & Pay' : `📲 Pay via ${selectedUpiApp}`}
                </Text>
                <Text style={styles.directPaySub}>
                  {upiSubMethod === 'Scanner'
                    ? 'Scan the QR code below using any UPI app to complete payment.'
                    : `Please complete the payment on your launched ${selectedUpiApp} app.`}
                </Text>

                {upiSubMethod === 'Scanner' && (
                  <View style={{ marginBottom: 20, alignItems: 'center' }}>
                    <Image
                      style={styles.qrImage}
                      source={{
                        uri: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                          `upi://pay?pa=harshadiagnostics@oksbi&pn=Harsha%20Diagnostics&am=${total}&cu=INR&tn=Booking%20${directPayOrderId}`
                        )}`
                      }}
                    />
                  </View>
                )}

                <View style={styles.directPayDetails}>
                  <View style={styles.directPayDetailRow}>
                    <Text style={styles.directPayLabel}>Booking ID</Text>
                    <Text style={styles.directPayValue}>{directPayOrderId}</Text>
                  </View>
                  <View style={styles.directPayDetailRow}>
                    <Text style={styles.directPayLabel}>Total Amount</Text>
                    <Text style={[styles.directPayValue, { color: '#38bdf8' }]}>₹ {total}</Text>
                  </View>
                  <View style={styles.directPayDetailRow}>
                    <Text style={styles.directPayLabel}>Transaction ID</Text>
                    <Text style={styles.directPayValue}>{directPayTxId}</Text>
                  </View>
                  <View style={styles.directPayDetailRow}>
                    <Text style={styles.directPayLabel}>Status</Text>
                    <Text style={[styles.directPayValue, { color: '#fbbf24' }]}>Pending Verification</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.verifyBtn}
                  onPress={async () => {
                    try {
                      const verifyRes = await axios.post(
                        `${BACKEND_URL}/api/payments/confirm-direct`,
                        {
                          orderId: directPayOrderId,
                          paymentMethod: upiSubMethod === 'Scanner' ? 'UPI_Scanner' : `UPI_${selectedUpiApp}`,
                          transactionId: directPayTxId
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );

                      if (verifyRes.data.success) {
                        clearCart();
                        setShowDirectPayConfirm(false);
                        Alert.alert(
                          'Payment Verified',
                          `₹${total} paid successfully! Your booking is confirmed.`
                        );
                        router.replace(`/track/${directPayOrderId}`);
                      } else {
                        throw new Error(verifyRes.data.message);
                      }
                    } catch (err: any) {
                      Alert.alert('Verification Error', err.response?.data?.message || err.message);
                    }
                  }}
                >
                  <Text style={styles.verifyBtnText}>Verify & Confirm Payment</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelDirectBtn}
                  onPress={() => {
                    setShowDirectPayConfirm(false);
                    Alert.alert('Payment Saved', 'Your booking has been saved as Pending payment.');
                    clearCart();
                    router.replace(`/track/${directPayOrderId}`);
                  }}
                >
                  <Text style={styles.cancelDirectBtnText}>Cancel & Pay Later</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Modal>

        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  backBtn: {
    padding: 6,
    marginRight: 12
  },
  backIcon: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 80
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 15,
    marginBottom: 24
  },
  browseBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12
  },
  browseText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  scrollContent: {
    flex: 1
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 40
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  cartItemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: '#e2e8f0',
    borderWidth: 1
  },
  cartItemDetails: {
    flex: 1
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  itemCategory: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4
  },
  removeBtn: {
    padding: 8
  },
  removeIcon: {
    fontSize: 18
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    marginBottom: 8
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 6
  },
  subInputLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 12,
    marginBottom: 6,
    fontWeight: '500'
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 14,
    color: '#0f172a'
  },
  smallInput: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  genderRow: {
    flexDirection: 'row',
    height: 42
  },
  genderBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginRight: 6
  },
  activeGenderBtn: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7'
  },
  genderText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600'
  },
  activeGenderText: {
    color: '#0284c7'
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4
  },
  slotBtn: {
    width: '48%',
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1%',
    marginBottom: 8
  },
  activeSlotBtn: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7'
  },
  slotText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600'
  },
  activeSlotText: {
    color: '#0284c7'
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  presetBtn: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    width: '31%',
    alignItems: 'center'
  },
  presetText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600'
  },
  feedbackBadge: {
    marginTop: 16,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center'
  },
  goodFeedback: {
    backgroundColor: '#f0fdf4'
  },
  badFeedback: {
    backgroundColor: '#fef2f2'
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  goodFeedbackText: {
    color: '#16a34a'
  },
  badFeedbackText: {
    color: '#dc2626'
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderColor: '#cbd5e1',
    borderWidth: 1
  },
  priceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  summaryLabel: {
    fontSize: 14,
    color: '#475569'
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a'
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginTop: 6,
    marginBottom: 16
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0284c7'
  },
  warningText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 16
  },
  checkoutBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  disabledBtn: {
    backgroundColor: '#cbd5e1'
  },
  checkoutBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  // Payment method selector styles
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginBottom: 10
  },
  paymentMethodActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff'
  },
  paymentMethodIcon: {
    fontSize: 24,
    marginRight: 12
  },
  paymentMethodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b'
  },
  paymentMethodSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioOuterActive: {
    borderColor: '#2563eb'
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb'
  },
  // Razorpay modal header styles
  rzpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a'
  },
  rzpHeaderTitle: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: 'bold'
  },
  rzpCloseBtn: {
    padding: 8
  },
  rzpCloseText: {
    color: '#94a3b8',
    fontSize: 14
  },
  verifyMapBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10
  },
  verifyMapBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12
  },
  // UPI Sub-Selector Styles
  upiSubContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginTop: -4,
    marginBottom: 10,
    marginLeft: 12,
    marginRight: 12
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 2,
    marginBottom: 12
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6
  },
  segmentBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b'
  },
  segmentTextActive: {
    color: '#0f172a'
  },
  upiAppsContainer: {
    paddingVertical: 4
  },
  upiInstruction: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 8,
    fontWeight: '500'
  },
  upiAppsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4
  },
  upiAppBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    marginHorizontal: 3
  },
  upiAppBtnActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
    borderWidth: 2
  },
  upiAppIcon: {
    fontSize: 20,
    marginBottom: 4
  },
  upiAppName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155'
  },
  scannerContainer: {
    alignItems: 'center',
    paddingVertical: 8
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    textAlign: 'center',
    marginTop: 8
  },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: 8
  },
  // Direct payment verification overlay styles
  directPayConfirmContainer: {
    backgroundColor: '#0f172a',
    flex: 1,
    padding: 24,
    justifyContent: 'center'
  },
  directPayConfirmCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  directPayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 8,
    textAlign: 'center'
  },
  directPaySub: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 20,
    textAlign: 'center'
  },
  directPayDetails: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  directPayDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4
  },
  directPayLabel: {
    fontSize: 12,
    color: '#64748b'
  },
  directPayValue: {
    fontSize: 12,
    color: '#f1f5f9',
    fontWeight: '600'
  },
  verifyBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12
  },
  verifyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15
  },
  cancelDirectBtn: {
    paddingVertical: 10
  },
  cancelDirectBtnText: {
    color: '#94a3b8',
    fontSize: 13
  }
});
