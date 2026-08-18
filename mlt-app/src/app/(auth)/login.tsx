import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useMltStore } from '../../store/useMltStore';
import { auth, isFirebaseConfigured } from '../../utils/firebase';
import AuthTabs from '../../components/AuthTabs';
import { BACKEND_URL } from '../../constants/api';

export default function MltLoginScreen() {
  const router = useRouter();
  const { setMltAuth } = useMltStore();

  const [activeTab, setActiveTab] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSendOtp = async (targetPhone?: string) => {
    const activePhone = targetPhone || phone;
    setErrorMsg('');
    setInfoMsg('');

    if (!activePhone || activePhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      showAlert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/send-otp`, {
        phone: activePhone,
        role: 'mlt'
      });

      if (res.data.success) {
        setOtpSent(true);
        setInfoMsg('OTP Sent! For testing, use code: 123456');
        setOtp('123456'); // Pre-fill test OTP for convenient testing
      } else {
        setErrorMsg(res.data.message || 'Failed to send OTP.');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Network error occurred.';
      setErrorMsg(msg);
      showAlert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg('');
    setInfoMsg('');

    if (!otp || otp.length < 6) {
      setErrorMsg('Please enter the 6-digit OTP code.');
      showAlert('Invalid OTP', 'Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/verify-otp`, {
        phone: phone || '1112223334',
        otp,
        role: 'mlt',
        name: name || 'MLT Technician'
      });

      if (res.data.success) {
        setMltAuth(res.data.token, res.data.user);
        router.replace('/');
      } else {
        setErrorMsg(res.data.message || 'Verification failed.');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Verification failed.';
      setErrorMsg(msg);
      showAlert('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    setErrorMsg('');
    setInfoMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both staff email and password.');
      return;
    }

    setLoading(true);
    try {
      // Simulate/Authenticate via Firebase or Backend
      if (isFirebaseConfigured && auth) {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        await completeGoogleLogin(userCred.user.uid, email, email.split('@')[0]);
      } else {
        // Direct OTP send for staff email or fallback login
        const res = await axios.post(`${BACKEND_URL}/api/auth/firebase-google`, {
          firebaseUid: `staff-mlt-${Date.now()}`,
          email,
          name: name || email.split('@')[0],
          role: 'mlt'
        });

        if (res.data.success) {
          setMltAuth(res.data.token, res.data.user);
          router.replace('/');
        } else {
          throw new Error(res.data.message || 'Login failed.');
        }
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Staff login failed.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  const handleGoogleSignIn = async () => {
    if (isFirebaseConfigured && auth) {
      setLoading(true);
      setErrorMsg('');
      try {
        const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;
        await completeGoogleLogin(fbUser.uid, fbUser.email || '', fbUser.displayName || 'MLT Staff');
      } catch (error: any) {
        const msg = error.message || 'Google Popup Sign-In failed.';
        setErrorMsg(msg);
        showAlert('Google Login Failed', msg);
        setLoading(false);
      }
    } else {
      setShowGoogleModal(true);
    }
  };

  const completeGoogleLogin = async (firebaseUid: string, email: string, nameToUse: string) => {
    setLoading(true);
    setErrorMsg('');
    setShowGoogleModal(false);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/firebase-google`, {
        firebaseUid,
        email,
        name: nameToUse,
        role: 'mlt'
      });

      if (res.data.success) {
        setMltAuth(res.data.token, res.data.user);
        router.replace('/');
      } else {
        throw new Error(res.data.message || 'Google login failed.');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Google login failed.';
      setErrorMsg(msg);
      showAlert('Google Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const quickFillDemo = (demoName: string, demoPhone: string) => {
    setName(demoName);
    setPhone(demoPhone);
    setErrorMsg('');
    setInfoMsg('');
    handleSendOtp(demoPhone);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.logoIcon}>💼</Text>
            <Text style={styles.title}>Harsha MLT Portal</Text>
            <Text style={styles.subtitle}>Phlebotomist Companion App. Sign in to view and accept collection requests.</Text>

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>⚠️ {errorMsg}</Text>
              </View>
            ) : null}

            {infoMsg ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>ℹ️ {infoMsg}</Text>
              </View>
            ) : null}

            {!otpSent ? (
              <View style={styles.form}>
                {/* Unified AuthTabs */}
                <AuthTabs activeTab={activeTab} setActiveTab={setActiveTab}>
                  {{
                    phone: (
                      <View>
                        <Text style={styles.inputLabel}>Full Name</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. Rajesh Kumar"
                          value={name}
                          onChangeText={(val) => { setName(val); setErrorMsg(''); }}
                          placeholderTextColor="#94a3b8"
                        />

                        <Text style={styles.inputLabel}>Mobile Number</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. 1112223334"
                          keyboardType="phone-pad"
                          value={phone}
                          onChangeText={(val) => { setPhone(val); setErrorMsg(''); }}
                          maxLength={10}
                          placeholderTextColor="#94a3b8"
                        />

                        <TouchableOpacity style={styles.btn} onPress={() => handleSendOtp()} disabled={loading}>
                          {loading ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text style={styles.btnText}>Send OTP Code</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ),
                    email: (
                      <View>
                        <Text style={styles.inputLabel}>Staff Email</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. rajesh.mlt@harsha.com"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          value={email}
                          onChangeText={(val) => { setEmail(val); setErrorMsg(''); }}
                          placeholderTextColor="#94a3b8"
                        />

                        <Text style={styles.inputLabel}>Password</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="••••••••"
                          secureTextEntry
                          value={password}
                          onChangeText={(val) => { setPassword(val); setErrorMsg(''); }}
                          placeholderTextColor="#94a3b8"
                        />

                        <TouchableOpacity style={styles.btn} onPress={handleEmailLogin} disabled={loading}>
                          {loading ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text style={styles.btnText}>Sign In as MLT Staff</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    )
                  }}
                </AuthTabs>

                {/* OR Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Direct Google Login */}
                <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} disabled={loading}>
                  <Text style={styles.googleBtnIcon}>G</Text>
                  <Text style={styles.googleBtnText}>Continue with Google Account</Text>
                </TouchableOpacity>

                {/* Demo Accounts Quick-Fill */}
                <View style={styles.demoSection}>
                  <Text style={styles.demoTitle}>Quick Demo Sign-In:</Text>
                  <TouchableOpacity
                    style={styles.demoBtn}
                    onPress={() => quickFillDemo('Rajesh Kumar (MLT)', '1112223334')}
                  >
                    <Text style={styles.demoBtnText}>⚡ Rajesh Kumar (1112223334)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.demoBtn}
                    onPress={() => quickFillDemo('Anita Rao (MLT)', '8765432109')}
                  >
                    <Text style={styles.demoBtnText}>⚡ Anita Rao (8765432109)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.inputLabel}>Enter 6-digit OTP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 123456"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={(val) => { setOtp(val); setErrorMsg(''); }}
                  maxLength={6}
                  placeholderTextColor="#94a3b8"
                />

                <TouchableOpacity style={styles.btn} onPress={handleVerifyOtp} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Verify and Login</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.backBtn} onPress={() => { setOtpSent(false); setErrorMsg(''); setInfoMsg(''); }}>
                  <Text style={styles.backBtnText}>← Edit details</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Google Account Selection Modal */}
      <Modal visible={showGoogleModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 360, backgroundColor: '#1e293b', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#334155' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#ea4335' }}>G</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#ffffff' }}>Select MLT Account</Text>
              </View>
              <TouchableOpacity onPress={() => setShowGoogleModal(false)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#94a3b8' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
              Choose a phlebotomist account to sign in to Harsha MLT App:
            </Text>

            <View style={{ gap: 8, marginBottom: 16 }}>
              {[
                { name: 'Rajesh Kumar (Lead MLT)', email: 'mlt_rajesh@harsha.com', uid: 'google-mlt-uid-777' },
                { name: 'Suresh Babu (Phlebotomist)', email: 'suresh.mlt@gmail.com', uid: 'google-mlt-uid-778' },
                { name: 'Anitha Reddy (MLT Specialist)', email: 'anitha.mlt@gmail.com', uid: 'google-mlt-uid-779' }
              ].map((acc) => (
                <TouchableOpacity
                  key={acc.email}
                  onPress={() => completeGoogleLogin(acc.uid, acc.email, acc.name)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#334155' }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>🧑‍⚕️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff' }}>{acc.name}</Text>
                    <Text style={{ fontSize: 11, color: '#94a3b8' }}>{acc.email}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Google Email Entry */}
            <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                Or Custom MLT Google Email:
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  placeholder="name@gmail.com"
                  style={{ flex: 1, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#ffffff' }}
                  value={customGoogleEmail}
                  onChangeText={setCustomGoogleEmail}
                  autoCapitalize="none"
                  placeholderTextColor="#64748b"
                />
                <TouchableOpacity
                  disabled={!customGoogleEmail.includes('@')}
                  onPress={() => completeGoogleLogin(`custom-mlt-uid-${Date.now()}`, customGoogleEmail, customGoogleEmail.split('@')[0])}
                  style={{ backgroundColor: '#10b981', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center', opacity: customGoogleEmail.includes('@') ? 1 : 0.4 }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Go</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  keyboardView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30
  },
  card: {
    backgroundColor: '#1e293b',
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  logoIcon: {
    fontSize: 50,
    marginBottom: 12
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    paddingHorizontal: 8
  },
  errorBox: {
    backgroundColor: '#451a1a',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    width: '100%'
  },
  errorBoxText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center'
  },
  infoBox: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    width: '100%'
  },
  infoBoxText: {
    color: '#6ee7b7',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center'
  },
  form: {
    width: '100%',
    marginTop: 20
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#cbd5e1',
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  input: {
    backgroundColor: '#334155',
    borderColor: '#475569',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#fff'
  },
  btn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  demoSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
    width: '100%'
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  demoBtn: {
    backgroundColor: '#334155',
    borderColor: '#475569',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    alignItems: 'center'
  },
  demoBtnText: {
    color: '#38bdf8',
    fontWeight: '600',
    fontSize: 13
  },
  backBtn: {
    marginTop: 16,
    alignItems: 'center'
  },
  backBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500'
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    width: '100%'
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155'
  },
  dividerText: {
    paddingHorizontal: 12,
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold'
  },
  googleBtn: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4
  },
  googleBtnIcon: {
    color: '#ea4335',
    fontWeight: '900',
    fontSize: 18,
    marginRight: 10
  },
  googleBtnText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 14
  }
});
