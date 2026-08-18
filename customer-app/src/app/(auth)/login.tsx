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
  ScrollView,
  Dimensions,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../constants/translations';
import { auth, isFirebaseConfigured } from '../../utils/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import AuthTabs from '../../components/AuthTabs';
import { BACKEND_URL } from '../../constants/api';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth, language, toggleLanguage } = useAppStore();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  // Login Fields
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupAge, setSignupAge] = useState('');
  const [signupGender, setSignupGender] = useState<'Male' | 'Female' | 'Other' | ''>('');

  // OTP Fields & Timer
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  React.useEffect(() => {
    let interval: any = null;
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  const handleResendOtp = async () => {
    if (!canResend) return;
    setCanResend(false);
    setTimer(60);
    if (activeTab === 'login') {
      await handleLoginSubmit();
    } else {
      await handleSignupSubmit();
    }
  };

  const t = translations[language];

  // Send login OTP
  const handleLoginSubmit = async () => {
    if (!identifier) {
      Alert.alert(
        language === 'te' ? 'తప్పు వివరాలు' : 'Missing Fields',
        language === 'te' ? 'దయచేసి ఈమెయిల్ లేదా ఫోన్ నంబర్ నమోదు చేయండి.' : 'Please enter your email or phone number.'
      );
      return;
    }
    if (!loginPassword) {
      Alert.alert(
        language === 'te' ? 'పాస్ వర్డ్ అవసరం' : 'Password Required',
        language === 'te' ? 'దయచేసి మీ పాస్ వర్డ్ నమోదు చేయండి.' : 'Please enter your password.'
      );
      return;
    }

    setLoading(true);
    try {
      let firebaseUid = null;

      if (isFirebaseConfigured) {
        console.log('[Firebase] Authenticating email/password credentials...');
        // Map phone number to email if identifier is not an email
        const emailToUse = identifier.includes('@') ? identifier : `${identifier}@harsha.com`;
        const userCredential = await signInWithEmailAndPassword(auth, emailToUse, loginPassword);
        firebaseUid = userCredential.user.uid;
        console.log('[Firebase] Authenticated successfully. UID:', firebaseUid);
      }

      // Call send-otp (bypasses password check on backend if firebaseUid is provided)
      const res = await axios.post(`${BACKEND_URL}/api/auth/send-otp`, {
        identifier,
        firebaseUid,
        password: loginPassword, // Fallback for local auth
        role: 'customer'
      });

      if (res.data.success) {
        setOtpPhone(res.data.phone);
        setOtpSent(true);
        Alert.alert(
          t.sendOtp,
          language === 'te' ? 'టెస్టింగ్ కోసం 123456 ఉపయోగించండి.' : 'Use code 123456 for testing.'
        );
      } else {
        throw new Error(res.data.message);
      }
    } catch (error: any) {
      Alert.alert(
        language === 'te' ? 'లాగిన్ విఫలమైంది' : 'Login Failed',
        error.response?.data?.message || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Send signup OTP
  const handleSignupSubmit = async () => {
    if (!firstName || !lastName || !signupPhone || !signupPassword) {
      Alert.alert(
        language === 'te' ? 'తప్పు వివరాలు' : 'Missing Fields',
        language === 'te' ? 'మొదటి పేరు, చివరి పేరు, ఫోన్ నంబర్ మరియు పాస్ వర్డ్ తప్పనిసరి.' : 'First name, last name, phone number, and password are required.'
      );
      return;
    }

    setLoading(true);
    try {
      // Validate that signup info doesn't already exist on backend first
      const res = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        firstName,
        lastName,
        phone: signupPhone,
        email: signupEmail,
        password: signupPassword,
        age: signupAge ? Number(signupAge) : null,
        gender: signupGender
      });

      if (res.data.success) {
        setOtpPhone(signupPhone);
        setOtpSent(true);
        Alert.alert(
          t.sendOtp,
          language === 'te' ? 'టెస్టింగ్ కోసం 123456 ఉపయోగించండి.' : 'Use code 123456 for testing.'
        );
      } else {
        throw new Error(res.data.message);
      }
    } catch (error: any) {
      Alert.alert(
        language === 'te' ? 'రిజిస్ట్రేషన్ విఫలమైంది' : 'Registration Failed',
        error.response?.data?.message || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP request and authenticate
  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert(
        language === 'te' ? 'తప్పు OTP' : 'Invalid OTP',
        language === 'te' ? 'దయచేసి 6 అంకెల OTP నమోదు చేయండి.' : 'Please enter the 6-digit OTP code.'
      );
      return;
    }

    setLoading(true);
    try {
      let firebaseUid = null;

      if (activeTab === 'signup' && isFirebaseConfigured) {
        console.log('[Firebase] Registering user credentials...');
        const emailToUse = signupEmail ? signupEmail : `${signupPhone}@harsha.com`;
        const userCredential = await createUserWithEmailAndPassword(auth, emailToUse, signupPassword);
        firebaseUid = userCredential.user.uid;
        console.log('[Firebase] Registered successfully. UID:', firebaseUid);
      }

      const url = activeTab === 'login' 
        ? `${BACKEND_URL}/api/auth/verify-otp`
        : `${BACKEND_URL}/api/auth/verify-register`;

      const payload = activeTab === 'login'
        ? { phone: otpPhone, otp, role: 'customer' }
        : { phone: otpPhone, otp, firebaseUid };

      const res = await axios.post(url, payload);

      if (res.data.success) {
        setAuth(res.data.token, res.data.user);
        router.replace('/');
      } else {
        throw new Error(res.data.message);
      }
    } catch (error: any) {
      Alert.alert(
        language === 'te' ? 'ధృవీకరణ విఫలమైంది' : 'Verification Failed',
        error.response?.data?.message || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    if (isFirebaseConfigured) {
      setLoading(true);
      try {
        const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;
        await completeGoogleLogin(fbUser.uid, fbUser.email || '', fbUser.displayName || 'Google User');
      } catch (error: any) {
        Alert.alert(
          language === 'te' ? 'గూగుల్ లాగిన్ విఫలమైంది' : 'Google Login Failed',
          error.message
        );
        setLoading(false);
      }
    } else {
      setShowGoogleModal(true);
    }
  };

  const completeGoogleLogin = async (firebaseUid: string, email: string, name: string) => {
    setLoading(true);
    setShowGoogleModal(false);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/firebase-google`, {
        firebaseUid,
        email,
        name
      });

      if (res.data.success) {
        setAuth(res.data.token, res.data.user);
        Alert.alert(
          language === 'te' ? 'లాగిన్ విజయవంతమైంది' : 'Login Successful',
          language === 'te' ? `గూగుల్ ద్వారా విజయవంతంగా లాగిన్ అయ్యారు: ${res.data.user.name}` : `Logged in as: ${res.data.user.name}`
        );
        router.replace('/');
      } else {
        throw new Error(res.data.message);
      }
    } catch (error: any) {
      Alert.alert(
        language === 'te' ? 'గూగుల్ లాగిన్ విఫలమైంది' : 'Google Login Failed',
        error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Language Bar */}
      <View style={styles.langBar}>
        <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
          <Text style={styles.langBtnText}>
            {language === 'en' ? 'తెలుగు ⇄ EN' : 'English ⇄ తెలుగు'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            {/* Logo & Intro */}
            <Text style={styles.logoIcon}>🩸</Text>
            <Text style={styles.title}>{t.appName}</Text>
            <Text style={styles.tagline}>{t.tagline}</Text>
            <Text style={styles.subtitle}>{t.loginSubtitle}</Text>

            {/* OTP Input Form */}
            {otpSent ? (
              <View style={styles.form}>
                <Text style={styles.inputLabel}>{t.otpPlaceholder}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 123456"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={6}
                  placeholderTextColor="#94a3b8"
                />

                {/* Resend & Timer */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600' }}>
                    {timer > 0 ? `Resend OTP in 00:${timer < 10 ? `0${timer}` : timer}` : 'Didn\'t receive OTP?'}
                  </Text>
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    disabled={!canResend}
                    style={{ opacity: canResend ? 1 : 0.4 }}
                  >
                    <Text style={{ fontSize: 12, color: '#0284c7', fontWeight: '700' }}>
                      {language === 'te' ? 'మళ్ళీ పంపు' : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.btn} onPress={handleVerifyOtp} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>{t.verifyOtp}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.backBtn} onPress={() => { setOtpSent(false); setTimer(60); setCanResend(false); }}>
                  <Text style={styles.backBtnText}>
                    {language === 'te' ? '← వివరాలు సవరించు' : '← Edit details'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Login / Signup Form
              <View style={styles.form}>
                {/* AuthTabs Component */}
                <AuthTabs
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  loginLabel={language === 'te' ? 'లాగిన్' : 'Sign In'}
                  signupLabel={language === 'te' ? 'కొత్త ఖాతా' : 'Create Account'}
                >
                  {{
                    login: (
                      <View>
                        {/* LOG IN FORM */}
                        <View>
                          <Text style={styles.inputLabel}>{t.emailOrPhone}</Text>
                          <TextInput
                            style={styles.input}
                            placeholder={language === 'te' ? 'ఈమెయిల్ లేదా మొబైల్ నంబర్' : 'Email or mobile number'}
                            value={identifier}
                            onChangeText={setIdentifier}
                            placeholderTextColor="#94a3b8"
                            autoCapitalize="none"
                          />
                          <Text style={styles.inputLabel}>{t.password}</Text>
                          <TextInput
                            style={styles.input}
                            placeholder={t.password}
                            secureTextEntry
                            value={loginPassword}
                            onChangeText={setLoginPassword}
                            placeholderTextColor="#94a3b8"
                            autoCapitalize="none"
                          />
                          <TouchableOpacity style={styles.btn} onPress={handleLoginSubmit} disabled={loading}>
                            {loading ? (
                              <ActivityIndicator color="#fff" />
                            ) : (
                              <Text style={styles.btnText}>{t.sendOtp}</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ),
                    signup: (
                      <View>
                        {/* SIGN UP FORM */}
                        <View>
                          <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                              <Text style={styles.inputLabel}>{t.firstName}</Text>
                              <TextInput
                                style={styles.input}
                                placeholder="First name"
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholderTextColor="#94a3b8"
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.inputLabel}>{t.lastName}</Text>
                              <TextInput
                                style={styles.input}
                                placeholder="Last name"
                                value={lastName}
                                onChangeText={setLastName}
                                placeholderTextColor="#94a3b8"
                              />
                            </View>
                          </View>
                          <Text style={styles.inputLabel}>{t.phonePlaceholder}</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="10-digit mobile number"
                            keyboardType="phone-pad"
                            value={signupPhone}
                            onChangeText={setSignupPhone}
                            maxLength={10}
                            placeholderTextColor="#94a3b8"
                          />
                          <Text style={styles.inputLabel}>{t.email} ({language === 'te' ? 'ఐచ్ఛికం' : 'Optional'})</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="e.g. name@example.com"
                            keyboardType="email-address"
                            value={signupEmail}
                            onChangeText={setSignupEmail}
                            placeholderTextColor="#94a3b8"
                            autoCapitalize="none"
                          />
                          <Text style={styles.inputLabel}>{t.password}</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Password"
                            secureTextEntry
                            value={signupPassword}
                            onChangeText={setSignupPassword}
                            placeholderTextColor="#94a3b8"
                            autoCapitalize="none"
                          />
                          <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                              <Text style={styles.inputLabel}>{t.age}</Text>
                              <TextInput
                                style={styles.input}
                                placeholder="Age"
                                keyboardType="numeric"
                                value={signupAge}
                                onChangeText={signupAge => setSignupAge(signupAge.replace(/[^0-9]/g, ''))}
                                maxLength={3}
                                placeholderTextColor="#94a3b8"
                              />
                            </View>
                            <View style={{ flex: 2 }}>
                              <Text style={styles.inputLabel}>{t.gender}</Text>
                              <View style={styles.genderContainer}>
                                {(['Male', 'Female', 'Other'] as const).map((g) => (
                                  <TouchableOpacity
                                    key={g}
                                    style={[
                                      styles.genderBtn,
                                      signupGender === g && styles.genderBtnActive,
                                    ]}
                                    onPress={() => setSignupGender(g)}
                                  >
                                    <Text
                                      style={[
                                        styles.genderBtnText,
                                        signupGender === g && styles.genderBtnTextActive,
                                      ]}
                                    >
                                      {g === 'Male' ? (language === 'te' ? 'పురుషుడు' : 'Male') :
                                        g === 'Female' ? (language === 'te' ? 'స్త్రీ' : 'Female') :
                                        (language === 'te' ? 'ఇతర' : 'Other')}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          </View>
                          <TouchableOpacity style={styles.btn} onPress={handleSignupSubmit} disabled={loading}>
                            {loading ? (
                              <ActivityIndicator color="#fff" />
                            ) : (
                              <Text style={styles.btnText}>{t.sendOtp}</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ),
                  }}
                </AuthTabs>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>
                    {language === 'te' ? 'లేదా' : 'OR'}
                  </Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} disabled={loading}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ea4335' }}>G</Text>
                  <Text style={styles.googleBtnText}>
                    {language === 'te' ? 'గూగుల్ తో కొనసాగండి' : 'Continue with Google'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Google Account Selection Modal */}
      <Modal visible={showGoogleModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 360, backgroundColor: '#ffffff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#ea4335' }}>G</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>Choose an Account</Text>
              </View>
              <TouchableOpacity onPress={() => setShowGoogleModal(false)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#64748b' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
              {language === 'te' ? 'హర్షా డయాగ్నోస్టిక్స్ కోసం మీ గూగుల్ ఖాతాను ఎంచుకోండి:' : 'Select a Google Account to sign in to Harsha Diagnostics:'}
            </Text>

            <View style={{ gap: 8, marginBottom: 16 }}>
              {[
                { name: 'Rahul Sharma (Customer)', email: 'rahul.patient@gmail.com', uid: 'google-customer-uid-101' },
                { name: 'Priya Verma', email: 'priya.verma@gmail.com', uid: 'google-customer-uid-102' },
                { name: 'Test Customer Google Account', email: 'customer.test@gmail.com', uid: 'google-customer-uid-103' }
              ].map((acc) => (
                <TouchableOpacity
                  key={acc.email}
                  onPress={() => completeGoogleLogin(acc.uid, acc.email, acc.name)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#0284c7', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{acc.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>{acc.name}</Text>
                    <Text style={{ fontSize: 11, color: '#64748b' }}>{acc.email}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Google Email Entry */}
            <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
                Or Custom Google Email:
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  placeholder="name@gmail.com"
                  style={{ flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#0f172a' }}
                  value={customGoogleEmail}
                  onChangeText={setCustomGoogleEmail}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  disabled={!customGoogleEmail.includes('@')}
                  onPress={() => completeGoogleLogin(`custom-uid-${Date.now()}`, customGoogleEmail, customGoogleEmail.split('@')[0])}
                  style={{ backgroundColor: '#0284c7', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center', opacity: customGoogleEmail.includes('@') ? 1 : 0.4 }}
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
    backgroundColor: '#f8fafc'
  },
  langBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16
  },
  langBtn: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  langBtnText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 12
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
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  logoIcon: {
    fontSize: 50,
    marginBottom: 12
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center'
  },
  tagline: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
    paddingHorizontal: 8
  },
  form: {
    width: '100%',
    marginTop: 24
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    marginBottom: 20
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center'
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0284c7'
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b'
  },
  activeTabText: {
    color: '#0284c7'
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#0f172a'
  },
  row: {
    flexDirection: 'row',
    marginBottom: 0
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 4,
    height: 48,
    marginBottom: 16
  },
  genderBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  genderBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7'
  },
  genderBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  genderBtnTextActive: {
    color: '#fff'
  },
  btn: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  backBtn: {
    marginTop: 16,
    alignItems: 'center'
  },
  backBtnText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500'
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    width: '100%'
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#cbd5e1'
  },
  dividerText: {
    paddingHorizontal: 12,
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600'
  },
  googleBtn: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  googleBtnText: {
    color: '#334155',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8
  }
});
