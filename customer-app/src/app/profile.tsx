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
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../constants/translations';
import { auth, isFirebaseConfigured } from '../utils/firebase';
import { signOut } from 'firebase/auth';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { BACKEND_URL } from '../constants/api';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
];

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  gender: string;
  bloodGroup: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { token, user, setAuth, setProfilePic, logout, language } = useAppStore();

  if (!token || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  const t = translations[language];

  // Editable Profile Fields
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [email, setEmail] = useState(user.email || '');
  const [age, setAge] = useState(user.age ? String(user.age) : '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>((user.gender as any) || '');
  const [bloodGroup, setBloodGroup] = useState(user.bloodGroup || 'O+');
  const [dob, setDob] = useState(user.dob || '');
  const [emergencyContact, setEmergencyContact] = useState(user.emergencyContact || '');

  // Allergies and Chronic Conditions
  const [allergies, setAllergies] = useState('Penicillin, Dust Mites');
  const [chronicConditions, setChronicConditions] = useState('Type-2 Diabetes (Controlled)');

  // Profile picture state
  const [localPic, setLocalPic] = useState<string | null>(user.profilePic || null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [showDpModal, setShowDpModal] = useState(false);

  // Family Members State
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { id: '1', name: 'Suneetha Devi', relation: 'Mother', age: 62, gender: 'Female', bloodGroup: 'B+' },
    { id: '2', name: 'Ramesh Naidu', relation: 'Father', age: 68, gender: 'Male', bloodGroup: 'O+' },
  ]);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [famName, setFamName] = useState('');
  const [famRelation, setFamRelation] = useState('Spouse');
  const [famAge, setFamAge] = useState('');
  const [famBlood, setFamBlood] = useState('O+');

  const [saving, setSaving] = useState(false);

  // Sync fields when user object changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setAge(user.age ? String(user.age) : '');
      setGender((user.gender as any) || '');
      setBloodGroup(user.bloodGroup || 'O+');
      setDob(user.dob || '');
      setEmergencyContact(user.emergencyContact || '');
      setLocalPic(user.profilePic || null);
    }
  }, [user]);

  // Upload Profile Picture
  const uploadProfilePic = async (base64OrUri: string) => {
    setUploadingPic(true);
    try {
      setLocalPic(base64OrUri);
      setProfilePic(base64OrUri);
      setShowDpModal(false);

      const res = await axios.patch(
        `${BACKEND_URL}/api/auth/profile-pic`,
        { profilePic: base64OrUri },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setAuth(token, res.data.user);
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert('✅ Profile photo updated successfully!');
        } else {
          Alert.alert('Success', 'Profile photo updated successfully!');
        }
      }
    } catch (err: any) {
      console.error('Error uploading photo:', err);
    } finally {
      setUploadingPic(false);
    }
  };

  const handlePickImage = async () => {
    if (Platform.OS === 'web') {
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
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]?.base64) {
        await uploadProfilePic(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (e: any) {
      console.log('Image picker error:', e);
    }
  };

  const handleRemovePhoto = async () => {
    setLocalPic(null);
    setProfilePic('');
    setShowDpModal(false);
    try {
      await axios.patch(
        `${BACKEND_URL}/api/auth/profile-pic`,
        { profilePic: '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {}
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await axios.put(
        `${BACKEND_URL}/api/auth/profile`,
        {
          firstName,
          lastName,
          email,
          age: age ? parseInt(age, 10) : undefined,
          gender,
          bloodGroup,
          dob,
          emergencyContact,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setAuth(token, res.data.user);
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert('✅ Profile details saved successfully!');
        } else {
          Alert.alert('Success', 'Profile details saved successfully!');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddFamilyMember = () => {
    if (!famName.trim()) return;
    const newMember: FamilyMember = {
      id: String(Date.now()),
      name: famName.trim(),
      relation: famRelation,
      age: parseInt(famAge, 10) || 30,
      gender: ['Mother', 'Daughter', 'Wife'].includes(famRelation) ? 'Female' : 'Male',
      bloodGroup: famBlood,
    };
    setFamilyMembers((prev) => [...prev, newMember]);
    setFamName('');
    setFamAge('');
    setShowAddFamily(false);
  };

  const getInitials = () => {
    const f = firstName.charAt(0).toUpperCase();
    const l = lastName.charAt(0).toUpperCase();
    return f && l ? f + l : user.name ? user.name.substring(0, 2).toUpperCase() : 'U';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Healthcare Theme Selector */}
          <ThemeSwitcher />

          {/* Top WhatsApp-style Profile Card */}
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
                  <Text style={styles.avatarText}>{getInitials()}</Text>
                </View>
              )}
              {/* WhatsApp Camera Badge Overlay */}
              <View style={styles.cameraOverlay}>
                {uploadingPic ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.cameraIcon}>📷</Text>
                )}
              </View>
            </TouchableOpacity>

            <Text style={styles.profileName}>{user.name || `${firstName} ${lastName}`}</Text>
            <Text style={styles.profilePhone}>📞 {user.phone}</Text>

            {/* Health Loyalty Pass Badge */}
            <View style={styles.loyaltyBadge}>
              <Text style={styles.loyaltyText}>★ HARSHA PLATINUM HEALTH MEMBER • 1,200 COINS</Text>
            </View>
          </View>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsBar}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>BLOOD GROUP</Text>
              <Text style={[styles.metricVal, { color: '#f87171' }]}>{bloodGroup}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>WALLET CASH</Text>
              <Text style={[styles.metricVal, { color: '#34d399' }]}>₹450</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>LAB REPORTS</Text>
              <Text style={[styles.metricVal, { color: '#38bdf8' }]}>8 Ready</Text>
            </View>
          </View>

          {/* Personal Details Form */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeading}>👤 Personal & Identification Details</Text>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First Name"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last Name"
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. nithin@example.com"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  placeholder="Age"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View style={{ flex: 2 }}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.genderRow}>
                  {['Male', 'Female', 'Other'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                      onPress={() => setGender(g as any)}
                    >
                      <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Emergency Medical & ICE Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardHeading}>🚨 Emergency Medical & ICE Card</Text>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Blood Group</Text>
                <TextInput
                  style={styles.input}
                  value={bloodGroup}
                  onChangeText={setBloodGroup}
                  placeholder="e.g. O+, B+, AB-"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View style={{ flex: 1.5 }}>
                <Text style={styles.inputLabel}>ICE Emergency Contact</Text>
                <TextInput
                  style={styles.input}
                  value={emergencyContact}
                  onChangeText={setEmergencyContact}
                  keyboardType="phone-pad"
                  placeholder="Relative Phone"
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Known Drug / Food Allergies</Text>
            <TextInput
              style={styles.input}
              value={allergies}
              onChangeText={setAllergies}
              placeholder="e.g. Penicillin, Sulfa, Peanuts"
              placeholderTextColor="#64748b"
            />

            <Text style={styles.inputLabel}>Chronic Conditions</Text>
            <TextInput
              style={styles.input}
              value={chronicConditions}
              onChangeText={setChronicConditions}
              placeholder="e.g. Type-2 Diabetes, Hypertension"
              placeholderTextColor="#64748b"
            />
          </View>

          {/* Family Health Profiles */}
          <View style={styles.formCard}>
            <View style={styles.familyHeaderRow}>
              <Text style={styles.cardHeading}>👨‍👩‍👧‍👦 Family Health Profiles ({familyMembers.length})</Text>
              <TouchableOpacity
                style={styles.addFamBtn}
                onPress={() => setShowAddFamily(true)}
              >
                <Text style={styles.addFamBtnText}>+ Add Member</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8 }}>
              {familyMembers.map((member) => (
                <View key={member.id} style={styles.familyCard}>
                  <View style={styles.familyAvatar}>
                    <Text style={{ fontSize: 18 }}>{member.gender === 'Female' ? '👩' : '👨'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.famNameText}>{member.name}</Text>
                    <Text style={styles.famDetailsText}>
                      {member.relation} • {member.age} yrs • Blood Group: <Text style={{ color: '#f87171', fontWeight: 'bold' }}>{member.bloodGroup}</Text>
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setFamilyMembers((prev) => prev.filter((m) => m.id !== member.id))}
                  >
                    <Text style={{ color: '#94a3b8', fontSize: 14 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.7 }]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving Profile...' : '💾 Save Profile & Medical Info'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>🚪 Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* WhatsApp-Style Fullscreen Profile Picture Modal */}
      <Modal visible={showDpModal} animationType="fade" transparent onRequestClose={() => setShowDpModal(false)}>
        <View style={styles.dpModalOverlay}>
          <View style={styles.dpModalBox}>
            <View style={styles.dpModalHeader}>
              <Text style={styles.dpModalTitle}>Profile Photo</Text>
              <TouchableOpacity onPress={() => setShowDpModal(false)}>
                <Text style={styles.dpCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Large Avatar Preview */}
            <View style={styles.largeAvatarContainer}>
              {localPic ? (
                <Image source={{ uri: localPic }} style={styles.largeAvatarImage} />
              ) : (
                <View style={styles.largeAvatarPlaceholder}>
                  <Text style={styles.largeAvatarText}>{getInitials()}</Text>
                </View>
              )}
            </View>

            {/* Preset Avatar Gallery */}
            <Text style={styles.presetsTitle}>OR CHOOSE A PRESET AVATAR:</Text>
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

            {/* WhatsApp Actions */}
            <View style={styles.dpActionRow}>
              <TouchableOpacity style={styles.dpActionBtn} onPress={handlePickImage}>
                <Text style={styles.dpActionBtnText}>📷 Upload New Photo</Text>
              </TouchableOpacity>
              {localPic && (
                <TouchableOpacity style={styles.dpRemoveBtn} onPress={handleRemovePhoto}>
                  <Text style={styles.dpRemoveBtnText}>🗑️ Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Family Member Modal */}
      <Modal visible={showAddFamily} animationType="slide" transparent onRequestClose={() => setShowAddFamily(false)}>
        <View style={styles.dpModalOverlay}>
          <View style={styles.familyModalBox}>
            <Text style={styles.dpModalTitle}>Add Family Member</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={famName}
              onChangeText={setFamName}
              placeholderTextColor="#64748b"
            />
            <TextInput
              style={styles.input}
              placeholder="Relationship (e.g. Spouse, Child, Sibling)"
              value={famRelation}
              onChangeText={setFamRelation}
              placeholderTextColor="#64748b"
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="Age"
                keyboardType="numeric"
                value={famAge}
                onChangeText={setFamAge}
                placeholderTextColor="#64748b"
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Blood Group (e.g. O+)"
                value={famBlood}
                onChangeText={setFamBlood}
                placeholderTextColor="#64748b"
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TouchableOpacity
                style={[styles.saveButton, { flex: 1, backgroundColor: '#334155' }]}
                onPress={() => setShowAddFamily(false)}
              >
                <Text style={styles.saveButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { flex: 1 }]}
                onPress={handleAddFamilyMember}
              >
                <Text style={styles.saveButtonText}>Add Member</Text>
              </TouchableOpacity>
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
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 16,
  },
  whatsappProfileCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
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
    borderColor: '#0284c7',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#38bdf8',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#059669',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
  loyaltyBadge: {
    backgroundColor: '#082f49',
    borderColor: '#0284c7',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  loyaltyText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metricsBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
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
    backgroundColor: '#334155',
  },
  formCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeading: {
    fontSize: 13,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    color: '#ffffff',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 4,
  },
  genderBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  genderBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  genderBtnTextActive: {
    color: '#ffffff',
  },
  familyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addFamBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addFamBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  familyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  familyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  famNameText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  famDetailsText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  saveButton: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#059669',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#1e293b',
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
    borderColor: '#334155',
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
    borderColor: '#0284c7',
  },
  largeAvatarImage: {
    width: '100%',
    height: '100%',
  },
  largeAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeAvatarText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
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
    borderColor: '#0284c7',
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
    backgroundColor: '#0284c7',
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
  familyModalBox: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
});
