import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import axios from 'axios';
import { useMltStore } from '../store/useMltStore';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { BACKEND_URL } from '../constants/api';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1594824813591-12c4315633a7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
];

export default function MltProfileScreen() {
  const router = useRouter();
  const { token, mlt, logout } = useMltStore();

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  const [name, setName] = useState(mlt?.name || 'S. Rajesh (Lead Phlebotomist)');
  const [phone, setPhone] = useState(mlt?.phone || '1112223334');
  const [councilRegId, setCouncilRegId] = useState('AP-PMC/2022/99412');
  const [experienceYears, setExperienceYears] = useState('6');
  const [bikeNumber, setBikeNumber] = useState('AP 02 CM 8841');
  const [bankUpi, setBankUpi] = useState('rajesh.phlebo@okaxis');
  const [isOnline, setIsOnline] = useState((mlt as any)?.isOnline ?? true);

  // Profile picture state
  const [localPic, setLocalPic] = useState<string | null>(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [showDpModal, setShowDpModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Certifications Checklist
  const certifications = [
    { title: '🩸 NABL Vacutainer Order of Draw Certified', date: 'Exp: Dec 2027' },
    { title: '👶 Pediatric & Geriatric Venipuncture Certified', date: 'Exp: Aug 2026' },
    { title: '🧊 Cold-Chain & IATA Cryo-Transport Certified', date: 'Exp: Nov 2026' },
    { title: '☣️ CPCB Biomedical Waste Disposal Safety', date: 'Exp: May 2027' },
  ];

  const uploadProfilePic = async (base64OrUri: string) => {
    setUploadingPic(true);
    setLocalPic(base64OrUri);
    setShowDpModal(false);
    setTimeout(() => {
      setUploadingPic(false);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('✅ Phlebotomist Profile Photo updated!');
      } else {
        Alert.alert('Success', 'Profile photo updated!');
      }
    }, 400);
  };

  const handlePickImage = async () => {
    if (typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const base64 = ev.target?.result as string;
          await uploadProfilePic(base64);
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('✅ Phlebotomist credentials & vehicle info saved!');
      } else {
        Alert.alert('Success', 'Credentials saved successfully!');
      }
    }, 400);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Phlebotomy Theme Selector */}
          <ThemeSwitcher />

          {/* Top WhatsApp DP Card */}
          <View style={styles.whatsappProfileCard}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={() => setShowDpModal(true)}
              activeOpacity={0.8}
            >
              {localPic ? (
                <Image source={{ uri: localPic }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>🧑‍⚕️</Text>
                </View>
              )}
              {/* Camera Badge Overlay */}
              <View style={styles.cameraOverlay}>
                {uploadingPic ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.cameraIcon}>📷</Text>
                )}
              </View>
            </TouchableOpacity>

            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profilePhone}>📞 {phone}</Text>

            {/* Paramedical Verified Badge */}
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ AP PARAMEDICAL COUNCIL VERIFIED • {councilRegId}</Text>
            </View>
          </View>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsBar}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>RATING</Text>
              <Text style={[styles.metricVal, { color: '#fbbf24' }]}>⭐ 4.98</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>SAMPLES</Text>
              <Text style={[styles.metricVal, { color: '#34d399' }]}>142 Collected</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>ON-TIME</Text>
              <Text style={[styles.metricVal, { color: '#38bdf8' }]}>99.4%</Text>
            </View>
          </View>

          {/* Duty Status Card */}
          <View style={styles.formCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.cardHeading}>📡 Live Dispatch Duty Status</Text>
                <Text style={styles.subHeading}>GPS Radar automatically accepts nearby Anantapur dispatches</Text>
              </View>
              <TouchableOpacity
                style={[styles.dutyBtn, isOnline ? styles.dutyBtnOn : styles.dutyBtnOff]}
                onPress={() => setIsOnline(!isOnline)}
              >
                <Text style={styles.dutyBtnText}>{isOnline ? '🟢 ON-DUTY' : '⚪ OFF-DUTY'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Professional Credentials Form */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeading}>🩺 Paramedical & Clinical Credentials</Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor="#64748b"
            />

            <View style={styles.row}>
              <View style={{ flex: 1.5, marginRight: 8 }}>
                <Text style={styles.inputLabel}>AP Paramedical Council ID</Text>
                <TextInput
                  style={styles.input}
                  value={councilRegId}
                  onChangeText={setCouncilRegId}
                  placeholderTextColor="#64748b"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Experience (Yrs)</Text>
                <TextInput
                  style={styles.input}
                  value={experienceYears}
                  onChangeText={setExperienceYears}
                  keyboardType="numeric"
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>
          </View>

          {/* Vehicle & Logistics Telemetry */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeading}>🏍️ Two-Wheeler & Fleet Telemetry</Text>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Vehicle Number</Text>
                <TextInput
                  style={styles.input}
                  value={bikeNumber}
                  onChangeText={setBikeNumber}
                  placeholderTextColor="#64748b"
                />
              </View>
              <View style={{ flex: 1.5 }}>
                <Text style={styles.inputLabel}>Instant Payout UPI VPA</Text>
                <TextInput
                  style={styles.input}
                  value={bankUpi}
                  onChangeText={setBankUpi}
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>
          </View>

          {/* Clinical Skill Certifications */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeading}>📜 NABL & Clinical Certifications</Text>
            <View style={{ gap: 8 }}>
              {certifications.map((cert, idx) => (
                <View key={idx} style={styles.certRow}>
                  <Text style={styles.certTitle}>{cert.title}</Text>
                  <Text style={styles.certDate}>{cert.date}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving Credentials...' : '💾 Update Profile & Vehicle Telemetry'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>🚪 Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* WhatsApp Fullscreen DP Modal */}
      <Modal visible={showDpModal} animationType="fade" transparent onRequestClose={() => setShowDpModal(false)}>
        <View style={styles.dpModalOverlay}>
          <View style={styles.dpModalBox}>
            <View style={styles.dpModalHeader}>
              <Text style={styles.dpModalTitle}>Phlebotomist Profile Photo</Text>
              <TouchableOpacity onPress={() => setShowDpModal(false)}>
                <Text style={styles.dpCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.largeAvatarContainer}>
              {localPic ? (
                <Image source={{ uri: localPic }} style={styles.largeAvatarImage} />
              ) : (
                <View style={styles.largeAvatarPlaceholder}>
                  <Text style={{ fontSize: 48 }}>🧑‍⚕️</Text>
                </View>
              )}
            </View>

            <Text style={styles.presetsTitle}>OR SELECT A CLINICAL AVATAR PRESET:</Text>
            <View style={styles.presetsRow}>
              {PRESET_AVATARS.map((url, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => uploadProfilePic(url)}
                  style={styles.presetThumbWrapper}
                >
                  <Image source={{ uri: url }} style={styles.presetThumb} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.dpActionRow}>
              <TouchableOpacity style={styles.dpActionBtn} onPress={handlePickImage}>
                <Text style={styles.dpActionBtnText}>📷 Upload New Photo</Text>
              </TouchableOpacity>
              {localPic && (
                <TouchableOpacity
                  style={styles.dpRemoveBtn}
                  onPress={() => {
                    setLocalPic(null);
                    setShowDpModal(false);
                  }}
                >
                  <Text style={styles.dpRemoveBtnText}>🗑️ Remove</Text>
                </TouchableOpacity>
              )}
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
    backgroundColor: '#020617',
  },
  scrollContent: {
    padding: 16,
  },
  whatsappProfileCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#10b981',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#34d399',
  },
  avatarText: {
    fontSize: 40,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0284c7',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  cameraIcon: {
    fontSize: 14,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  profilePhone: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  verifiedText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metricsBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#1e293b',
  },
  formCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeading: {
    fontSize: 13,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subHeading: {
    fontSize: 10,
    color: '#94a3b8',
  },
  dutyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  dutyBtnOn: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
    borderWidth: 1,
  },
  dutyBtnOff: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
  },
  dutyBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#020617',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 10,
    color: '#ffffff',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  certRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#020617',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  certTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  certDate: {
    fontSize: 9,
    color: '#34d399',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#0f172a',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dpModalBox: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  dpModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  dpModalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  dpCloseText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  largeAvatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#10b981',
  },
  largeAvatarImage: {
    width: '100%',
    height: '100%',
  },
  largeAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#064e3b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetsTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  presetThumbWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#10b981',
  },
  presetThumb: {
    width: '100%',
    height: '100%',
  },
  dpActionRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  dpActionBtn: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  dpActionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  dpRemoveBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  dpRemoveBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
