import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Image,
  ScrollView,
  Modal,
  Alert
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import axios from 'axios';
import { useAppStore, TestItem } from '../store/useAppStore';
import { registerForPushNotificationsAsync } from '../utils/pushNotifications';
import { ThemeText } from '../components/ThemeText';
import { ChatbotWidget } from '../components/ChatbotWidget';
import AIHealthIntelligenceHub from '../components/AIHealthIntelligenceHub';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { BACKEND_URL } from '../constants/api';

const categories = [
  { id: 'all', label_en: 'All', label_te: 'అన్నీ' },
  { id: 'Sugar', label_en: 'Diabetes', label_te: 'డయాబెటిస్' },
  { id: 'Thyroid', label_en: 'Thyroid', label_te: 'థైరాయిడ్' },
  { id: 'Lipid', label_en: 'Lipid & Heart', label_te: 'గుండె' },
  { id: 'Liver', label_en: 'Liver & Kidney', label_te: 'లివర్ & కిడ్నీ' },
  { id: 'Infection', label_en: 'Infections', label_te: 'ఇన్ఫెక్షన్లు' },
  { id: 'Vitamins', label_en: 'Vitamins', label_te: 'విటమిన్లు' },
  { id: 'Bundles', label_en: 'Packages', label_te: 'ప్యాకేజీలు' }
];

const getCategoryIcon = (category: string, name: string) => {
  const cat = category.toLowerCase();
  const testName = name.toLowerCase();

  if (cat.includes('sugar') || cat.includes('diabet') || testName.includes('sugar') || testName.includes('glucose')) {
    return require('../../assets/images/tests/diabetes.png');
  }
  if (cat.includes('lipid') || cat.includes('heart') || testName.includes('lipid') || testName.includes('cholesterol')) {
    return require('../../assets/images/tests/heart.png');
  }
  if (cat.includes('thyroid') || testName.includes('thyroid') || testName.includes('t3') || testName.includes('t4') || testName.includes('tsh')) {
    return require('../../assets/images/tests/thyroid.png');
  }
  if (cat.includes('liver') || cat.includes('kidney') || cat.includes('renal') || testName.includes('lft') || testName.includes('rft') || testName.includes('creatinine') || testName.includes('bilirubin')) {
    return require('../../assets/images/tests/organs.png');
  }
  if (cat.includes('infection') || cat.includes('screen') || testName.includes('hiv') || testName.includes('hbsag') || testName.includes('hcv') || testName.includes('vdrl') || testName.includes('dengue') || testName.includes('typhoid') || testName.includes('malaria') || testName.includes('widal')) {
    return require('../../assets/images/tests/infection.png');
  }
  if (cat.includes('vitamin') || testName.includes('vitamin')) {
    return require('../../assets/images/tests/vitamins.png');
  }
  if (cat.includes('package') || cat.includes('bundle') || testName.includes('package') || testName.includes('checkup')) {
    return require('../../assets/images/tests/packages.png');
  }
  if (testName.includes('urine') || testName.includes('cue')) {
    return require('../../assets/images/tests/urine.png');
  }
  if (testName.includes('blood picture') || testName.includes('cbp') || testName.includes('cbc') || testName.includes('haemogram') || testName.includes('blood')) {
    return require('../../assets/images/tests/hematology.png');
  }
  return require('../../assets/images/tests/general.png');
};

const promoBanners = [
  {
    title: 'Complete Health Package',
    subtitle: 'Includes CBP, Lipid Profile, LFT, and RFT at 50% discount.',
    tag: '50% OFF',
    bgColor: '#0284c7',
    actionText: 'Add Package',
    actionType: 'add_package'
  },
  {
    title: 'Reports in 6 Hours',
    subtitle: 'Guaranteed digital report delivery. Book a slot today.',
    tag: 'FASTEST',
    bgColor: '#1e293b',
    actionText: 'Book Now',
    actionType: 'book_now'
  },
  {
    title: 'Vitamins & Immunity Boost',
    subtitle: 'Check Vitamin D and Vitamin B12 levels at special rates.',
    tag: 'POPULAR',
    bgColor: '#0284c7',
    actionText: 'View Vitamins',
    actionType: 'vitamins'
  }
];

const samplePrescriptions = [
  {
    id: 1,
    doctor: 'Dr. A. K. Prasad, MD',
    diagnosis: 'Routine wellness assessment, complains of mild fatigue.',
    recommendedTests: ['Complete Blood Picture (CBP/CBC)', 'Thyroid Profile (T3, T4, TSH)'],
    badge: 'Wellness Plan'
  },
  {
    id: 2,
    doctor: 'Dr. S. Lakshmi, Cardiologist',
    diagnosis: 'Follow-up for diabetes and high cholesterol screen.',
    recommendedTests: ['Fasting Sugar', 'HBA1c (3-Month Avg. Blood Sugar)', 'Lipid Profile'],
    badge: 'Diabetes & Heart'
  },
  {
    id: 3,
    doctor: 'Dr. Rohit Verma, Neurologist',
    diagnosis: 'Complains of muscle weakness, tingling sensation in hands.',
    recommendedTests: ['Vitamin D', 'Vitamin B12'],
    badge: 'Neuro-Vitamins'
  }
];

export default function HomeScreen() {
  const router = useRouter();
  const { token, cart, addToCart, isInCart, language, toggleLanguage, logout, user } = useAppStore();

  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Bookings and Tracking States
  const [orders, setOrders] = useState<any[]>([]);

  // Prescription Modal States
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedPrescId, setSelectedPrescId] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [mappedTests, setMappedTests] = useState<TestItem[]>([]);
  const [selectedMappingIds, setSelectedMappingIds] = useState<string[]>([]);

  // AI Health Intelligence Suite Modal State
  const [showAiHub, setShowAiHub] = useState(false);
  const [aiHubTab, setAiHubTab] = useState('risk');

  // Register push tokens when home screen loads
  useEffect(() => {
    if (token) {
      registerForPushNotificationsAsync(token, BACKEND_URL);
    }
  }, [token]);

  // Fetch orders from API
  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const activeBooking = orders.find(o => o.status !== 'ReportReady' && o.status !== 'Cancelled');

  // Fetch tests from API when category/search changes
  const fetchTests = async () => {
    setLoading(true);
    try {
      let url = `${BACKEND_URL}/api/tests`;
      const params: any = {};
      
      if (selectedCategory !== 'all') {
        params.category = selectedCategory === 'Bundles' ? 'Bundles' : undefined;
      }
      if (search) {
        params.search = search;
      }

      const res = await axios.get(url, { params });
      if (res.data.success) {
        // Handle local category filter logic since DB uses sub-categories
        let filtered = res.data.data;
        if (selectedCategory !== 'all' && selectedCategory !== 'Bundles') {
          filtered = res.data.data.filter((item: TestItem) => 
            item.category.toLowerCase().includes(selectedCategory.toLowerCase())
          );
        }
        setTests(filtered);
      }
    } catch (err) {
      console.error('Error fetching tests catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTests();
    }
  }, [search, selectedCategory, token]);

  // Enforce authentication redirect if no session exists
  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  const handleBannerAction = (actionType: string) => {
    if (actionType === 'add_package') {
      const pkg = tests.find(t => t.category.toLowerCase().includes('bundle') || t.category.toLowerCase().includes('package') || t.name.toLowerCase().includes('package'));
      if (pkg) {
        if (!isInCart(pkg._id)) {
          addToCart(pkg);
          Alert.alert(language === 'te' ? 'కార్ట్‌కి జోడించబడింది' : 'Added to Cart', pkg.name);
        } else {
          router.push('/cart');
        }
      } else {
        setSelectedCategory('Bundles');
      }
    } else if (actionType === 'book_now') {
      router.push('/explore');
    } else if (actionType === 'vitamins') {
      setSelectedCategory('Vitamins');
    }
  };

  const handleSelectPrescription = (prescId: number) => {
    setSelectedPrescId(prescId);
    setAnalyzing(true);
    setMappedTests([]);
    setSelectedMappingIds([]);

    setTimeout(() => {
      setAnalyzing(false);
      const presc = samplePrescriptions.find(p => p.id === prescId);
      if (presc) {
        const matched = tests.filter(t => presc.recommendedTests.some(rec => t.name.toLowerCase().includes(rec.toLowerCase()) || rec.toLowerCase().includes(t.name.toLowerCase())));
        setMappedTests(matched);
        setSelectedMappingIds(matched.map(m => m._id));
      }
    }, 1500);
  };

  const handleAddMappedToCart = () => {
    const toAdd = mappedTests.filter(t => selectedMappingIds.includes(t._id));
    toAdd.forEach(t => {
      if (!isInCart(t._id)) {
        addToCart(t);
      }
    });
    setShowPrescriptionModal(false);
    setSelectedPrescId(null);
    setMappedTests([]);
    setSelectedMappingIds([]);
    Alert.alert(
      language === 'te' ? 'కార్ట్‌కి జోడించబడ్డాయి' : 'Success',
      language === 'te' ? 'రక్త పరీక్షలు కార్ట్‌కి జోడించబడ్డాయి!' : 'Recommended tests added to your cart successfully!'
    );
  };

  const toggleMappingSelection = (id: string) => {
    setSelectedMappingIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const renderTestCard = ({ item }: { item: TestItem }) => {
    const isAdded = isInCart(item._id);
    const categoryIcon = getCategoryIcon(item.category, item.name);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardCategory}>{item.category}</Text>
          <View style={styles.sampleBadge}>
            <Text style={styles.sampleText}>🧬 {item.sampleType}</Text>
          </View>
        </View>

        <View style={styles.cardBodyContainer}>
          {/* Side Thumbnail Image */}
          <View style={styles.thumbnailContainer}>
            <Image 
              source={categoryIcon} 
              style={styles.thumbnailImage} 
              resizeMode="cover"
            />
          </View>

          <View style={styles.cardTextContent}>
            <Text style={styles.cardName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.detailsRow}>
          {item.fastingRequirement && (
            <Text style={styles.detailItem}>
              ⏳ {item.fastingRequirement.includes('Fasting') 
                ? (language === 'te' ? 'ఖాళీ కడుపు ఉండాలి' : 'Fasting Required') 
                : (language === 'te' ? 'ఫాస్టింగ్ అవసరం లేదు' : 'No Fasting')}
            </Text>
          )}
          {item.turnaroundTime && (
            <Text style={styles.detailItem}>⏱️ {item.turnaroundTime}</Text>
          )}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹ {item.price}</Text>
          <TouchableOpacity
            style={[styles.bookBtn, isAdded && styles.addedBtn]}
            onPress={() => {
              if (isAdded) {
                router.push('/cart');
              } else {
                addToCart(item);
              }
            }}
          >
            <Text style={[styles.bookBtnText, isAdded && styles.addedBtnText]}>
              {isAdded 
                ? (language === 'te' ? 'కార్ట్‌కి వెళ్ళండి' : 'Go to Cart') 
                : (language === 'te' ? 'బుక్ చేయండి' : 'Book Visit')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>
            {language === 'te' ? 'హలో,' : 'Hello,'} {user?.name || 'Guest'}
          </Text>
          <ThemeText tid="appName" style={styles.logoText} />
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
            <Text style={styles.langText}>{language === 'en' ? 'తెలుగు' : 'EN'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Catalog Listing with Banners/Actions in Header */}
      {loading && tests.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      ) : (
        <FlatList
          data={tests}
          keyExtractor={(item) => item._id}
          renderItem={renderTestCard}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {/* Pro Healthcare Theme Selector */}
              <ThemeSwitcher />

              {/* Active Booking Tracker Banner */}
              {activeBooking && (
                <TouchableOpacity 
                  style={styles.activeBookingBanner} 
                  onPress={() => router.push(`/track/${activeBooking._id}`)}
                >
                  <View style={styles.activeBookingIcon}>
                    <Text style={{ fontSize: 16 }}>🔔</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activeBookingText}>
                      {language === 'te' ? 'యాక్టివ్ ఆర్డర్ ట్రాకింగ్' : 'Live Booking Tracking'}
                    </Text>
                    <Text style={styles.activeBookingSub}>
                      Phlebotomist status: <Text style={{ fontWeight: 'bold' }}>{activeBooking.status}</Text>
                    </Text>
                  </View>
                  <Text style={styles.activeBookingLink}>
                    {language === 'te' ? 'చూడండి →' : 'Track →'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Banners Carousel */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.bannerScroll}
                contentContainerStyle={styles.bannerScrollContent}
              >
                {promoBanners.map((banner, index) => (
                  <View key={index} style={[styles.bannerCard, { backgroundColor: banner.bgColor }]}>
                    <View style={styles.bannerBadgeContainer}>
                      <Text style={styles.bannerBadge}>{banner.tag}</Text>
                    </View>
                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                    <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                    <TouchableOpacity 
                      style={styles.bannerActionBtn}
                      onPress={() => handleBannerAction(banner.actionType)}
                    >
                      <Text style={styles.bannerActionText}>{banner.actionText}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              {/* Quick Actions Grid */}
              <View style={styles.quickGrid}>
                <TouchableOpacity 
                  style={styles.quickCard} 
                  onPress={() => {
                    setAiHubTab('ocr');
                    setShowAiHub(true);
                  }}
                >
                  <View style={[styles.quickIconContainer, { backgroundColor: '#f0fdf4' }]}>
                    <Text style={styles.quickIcon}>📄</Text>
                  </View>
                  <Text style={styles.quickTitle}>
                    {language === 'te' ? 'ప్రిస్క్రిప్షన్ OCR' : 'Prescription OCR'}
                  </Text>
                  <Text style={styles.quickDesc}>
                    {language === 'te' ? 'AI హ్యాండ్‌రైటింగ్ స్కాన్' : 'Instant AI cart mapping'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.quickCard} 
                  onPress={() => {
                    setAiHubTab('risk');
                    setShowAiHub(true);
                  }}
                >
                  <View style={[styles.quickIconContainer, { backgroundColor: '#ecfdf5' }]}>
                    <Text style={styles.quickIcon}>🤖</Text>
                  </View>
                  <Text style={styles.quickTitle}>
                    {language === 'te' ? 'AI హెల్త్ రిస్క్' : 'AI Health Suite'}
                  </Text>
                  <Text style={styles.quickDesc}>
                    {language === 'te' ? '7 క్లినికల్ AI టూల్స్' : '7 Pro AI engines'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.quickCard} 
                  onPress={() => {
                    const active = orders.find(o => o.status !== 'ReportReady' && o.status !== 'Cancelled');
                    if (active) {
                      router.push(`/track/${active._id}`);
                    } else {
                      router.push('/explore');
                    }
                  }}
                >
                  <View style={[styles.quickIconContainer, { backgroundColor: '#e0f2fe' }]}>
                    <Text style={styles.quickIcon}>📍</Text>
                  </View>
                  <Text style={styles.quickTitle}>
                    {language === 'te' ? 'లైవ్ ట్రాకింగ్' : 'Track Lab Visits'}
                  </Text>
                  <Text style={styles.quickDesc}>
                    {language === 'te' ? 'phlebotomist & పిన్' : 'Live phlebotomist & PIN'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.quickCard} 
                  onPress={() => {
                    setAiHubTab('bioage');
                    setShowAiHub(true);
                  }}
                >
                  <View style={[styles.quickIconContainer, { backgroundColor: '#fdf4ff' }]}>
                    <Text style={styles.quickIcon}>🧬</Text>
                  </View>
                  <Text style={styles.quickTitle}>
                    {language === 'te' ? 'బయో-ఏజ్ & డైట్' : 'Bio-Age & Diet'}
                  </Text>
                  <Text style={styles.quickDesc}>
                    {language === 'te' ? 'లాంగెవిటీ కాలిక్యులేటర్' : 'Longevity & nutrition'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Harsha AI Medical Intelligence Suite Pro Banner */}
              <TouchableOpacity
                style={styles.aiSuiteBanner}
                onPress={() => {
                  setAiHubTab('risk');
                  setShowAiHub(true);
                }}
              >
                <View style={styles.aiSuiteLeft}>
                  <View style={styles.aiBadgePill}>
                    <Text style={styles.aiBadgePillText}>★ PRO CLINICAL AI</Text>
                  </View>
                  <Text style={styles.aiSuiteTitle}>
                    {language === 'te' ? '✨ హర్ష AI హెల్త్ ఇంటెలిజెన్స్ హబ్' : '✨ Harsha AI Health Intelligence Suite'}
                  </Text>
                  <Text style={styles.aiSuiteSub}>
                    {language === 'te'
                      ? '7 అధునాతన AI సాధనాలు: రిస్క్ ఎవల్యూటర్, ప్రిస్క్రిప్షన్ OCR, బయో-ఏజ్, ASCVD & డైట్ AI'
                      : '7 Clinical Engines: Symptom Risk, Prescription OCR, Bio-Age, 10-Yr ASCVD & Diet AI'}
                  </Text>
                </View>
                <View style={styles.aiSuiteRight}>
                  <Text style={styles.aiLaunchText}>Launch AI →</Text>
                </View>
              </TouchableOpacity>

              {/* Search Bar */}
              <View style={styles.searchContainerInside}>
                <TextInput
                  style={styles.searchInput}
                  placeholder={language === 'te' ? 'రక్త పరీక్షలు లేదా ప్యాకేజీలు వెతకండి...' : 'Search 22+ tests or health packages...'}
                  value={search}
                  onChangeText={setSearch}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Categories Scroll */}
              <View style={styles.categoriesContainerInside}>
                <FlatList
                  data={categories}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.categoryChip,
                        selectedCategory === item.id && styles.activeChip
                      ]}
                      onPress={() => setSelectedCategory(item.id)}
                    >
                      <Text
                        style={[
                          styles.categoryLabel,
                          selectedCategory === item.id && styles.activeCategoryLabel
                        ]}
                      >
                        {language === 'te' ? item.label_te : item.label_en}
                      </Text>
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.categoriesScrollContent}
                />
              </View>

              {/* List Header title */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleText}>
                  {language === 'te' ? 'రోగనిర్ధారణ పరీక్షలు' : 'Popular Diagnostics Catalog'}
                </Text>
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {language === 'te' ? 'ఏ పరీక్షలు కనుగొనబడలేదు.' : 'No tests found matching your criteria.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            <View style={styles.cleanListFooter}>
              <View style={styles.nablFooterBox}>
                <Text style={{ fontSize: 18 }}>🏥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nablFooterTitle}>NABL & ICMR Certified Diagnostics</Text>
                  <Text style={styles.nablFooterSub}>
                    Harsha Diagnostic Centre • Subhash Road, Clock Tower Circle, Anantapuramu
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.floatingAiFooterBtn}
                onPress={() => {
                  setAiHubTab('risk');
                  setShowAiHub(true);
                }}
              >
                <Text style={styles.floatingAiFooterText}>✨ Open Harsha AI Health Intelligence Suite (7 Tools) ↗</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </View>
          }
        />
      )}

      {/* Prescription Auto-Mapping Modal */}
      <Modal
        visible={showPrescriptionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPrescriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'te' ? 'వైద్యుడి ప్రిస్క్రిప్షన్ అప్‌లోడ్' : 'Prescription Auto-Mapping'}
              </Text>
              <TouchableOpacity 
                style={styles.closeBtn} 
                onPress={() => {
                  setShowPrescriptionModal(false);
                  setSelectedPrescId(null);
                  setMappedTests([]);
                }}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                {language === 'te' ? 'కింది నమూనా ప్రిస్క్రిప్షన్లలో ఒకదాన్ని ఎంచుకోండి. మా AI సిస్టమ్ రక్త పరీక్షలను స్కాన్ చేస్తుంది.' 
                                   : 'Select a prescription below. Our diagnostics engine will scan the doctor\'s handwriting and auto-map to our tests.'}
              </Text>

              {/* Prescription Selector */}
              <View style={styles.prescSelectorRow}>
                {samplePrescriptions.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.prescOptionCard,
                      selectedPrescId === p.id && styles.activePrescOptionCard
                    ]}
                    onPress={() => handleSelectPrescription(p.id)}
                  >
                    <Text style={[styles.prescOptionBadge, selectedPrescId === p.id && styles.activePrescOptionBadge]}>{p.badge}</Text>
                    <Text style={styles.prescOptionDoc}>{p.doctor}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Analysis Status */}
              {analyzing && (
                <View style={styles.analyzingContainer}>
                  <ActivityIndicator size="small" color="#0284c7" />
                  <Text style={styles.analyzingText}>
                    {language === 'te' ? 'హర్ష AI ప్రిస్క్రిప్షన్‌ను విశ్లేషిస్తోంది...' : 'Harsha AI scanning prescription handwriting...'}
                  </Text>
                </View>
              )}

              {/* Recommendations list */}
              {!analyzing && mappedTests.length > 0 && (
                <View style={styles.recommendationsBlock}>
                  <Text style={styles.recomTitle}>
                    {language === 'te' ? 'ఆటో-మ్యాప్ చేయబడిన రక్త పరీక్షలు:' : 'Detected Medical Diagnostics:'}
                  </Text>
                  
                  {mappedTests.map(t => (
                    <TouchableOpacity
                      key={t._id}
                      style={styles.recomItemRow}
                      onPress={() => toggleMappingSelection(t._id)}
                    >
                      <View style={[
                        styles.recomCheckbox,
                        selectedMappingIds.includes(t._id) && styles.recomCheckboxChecked
                      ]}>
                        {selectedMappingIds.includes(t._id) && (
                          <Text style={styles.recomCheckIcon}>✓</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recomItemName}>{t.name}</Text>
                        <Text style={styles.recomItemCategory}>{t.category} • ₹{t.price}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={styles.addMappedBtn}
                    onPress={handleAddMappedToCart}
                    disabled={selectedMappingIds.length === 0}
                  >
                    <Text style={styles.addMappedBtnText}>
                      {language === 'te' ? `ఎంచుకున్న పరీక్షలను కార్ట్‌కి జోడించండి (${selectedMappingIds.length})` 
                                         : `Add Selected Tests to Cart (${selectedMappingIds.length})`}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Floating Cart Bar */}
      {cart.length > 0 && (
        <View style={styles.cartFloatingBar}>
          <View>
            <Text style={styles.cartCountText}>
              {cart.length} {cart.length === 1 ? 'Test' : 'Tests'} {language === 'te' ? 'జోడించబడ్డాయి' : 'Selected'}
            </Text>
            <Text style={styles.cartTotalText}>
              Subtotal: ₹ {cart.reduce((sum, item) => sum + item.price, 0)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => router.push('/cart')}
          >
            <Text style={styles.checkoutBtnText}>
              {language === 'te' ? 'కార్ట్ చూడండి →' : 'View Cart →'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chatbot Overlay */}
      <ChatbotWidget />

      {/* Harsha AI Medical Intelligence Suite Modal */}
      <AIHealthIntelligenceHub
        visible={showAiHub}
        onClose={() => setShowAiHub(false)}
        initialTab={aiHubTab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc' // Slate-50
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  welcomeText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500'
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  langBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 10
  },
  langText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  logoutBtn: {
    padding: 6
  },
  logoutText: {
    fontSize: 20
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff'
  },
  searchInput: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a'
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  categoriesScrollContent: {
    paddingHorizontal: 16
  },
  categoryChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8
  },
  activeChip: {
    backgroundColor: '#0284c7' // Sky-600
  },
  categoryLabel: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600'
  },
  activeCategoryLabel: {
    color: '#fff'
  },
  listContent: {
    padding: 16,
    paddingBottom: 100 // Leave space for floating cart
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
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
  cardCategory: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0284c7',
    textTransform: 'uppercase'
  },
  sampleBadge: {
    backgroundColor: '#f0fdf4', // Green-50
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  sampleText: {
    color: '#16a34a', // Green-600
    fontSize: 10,
    fontWeight: 'bold'
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 0
  },
  cardBodyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    width: '100%'
  },
  thumbnailContainer: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  thumbnailImage: {
    width: '100%',
    height: '100%'
  },
  cardTextContent: {
    flex: 1,
    justifyContent: 'center'
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 16
  },
  detailItem: {
    fontSize: 11,
    color: '#475569',
    marginRight: 16,
    fontWeight: '500'
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  bookBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10
  },
  addedBtn: {
    backgroundColor: '#e0f2fe', // Sky-100
    borderColor: '#0284c7',
    borderWidth: 1
  },
  bookBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  addedBtnText: {
    color: '#0284c7'
  },
  cartFloatingBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#0f172a', // Slate-900
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  cartCountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  cartTotalText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2
  },
  checkoutBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10
  },
  checkoutBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  // Banners, Grid & Prescriptions
  activeBookingBanner: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  activeBookingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  activeBookingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  activeBookingSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  activeBookingLink: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0284c7',
    marginLeft: 8
  },
  bannerScroll: {
    marginHorizontal: -16,
    marginBottom: 20
  },
  bannerScrollContent: {
    paddingHorizontal: 16,
    gap: 12
  },
  bannerCard: {
    width: Dimensions.get('window').width * 0.8,
    maxWidth: 320,
    borderRadius: 20,
    padding: 18,
    justifyContent: 'space-between',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  bannerBadgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8
  },
  bannerBadge: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12
  },
  bannerActionBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10
  },
  bannerActionText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: 'bold'
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2
  },
  quickIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  quickIcon: {
    fontSize: 18
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4
  },
  quickDesc: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 14
  },
  searchContainerInside: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 2,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    marginBottom: 14
  },
  categoriesContainerInside: {
    marginHorizontal: -16,
    marginBottom: 16
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 12
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: 30
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  closeBtn: {
    padding: 4
  },
  closeBtnText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: 'bold'
  },
  modalBody: {
    padding: 20
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16
  },
  prescSelectorRow: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20
  },
  prescOptionCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14
  },
  activePrescOptionCard: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff'
  },
  prescOptionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e2e8f0',
    color: '#475569',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  activePrescOptionBadge: {
    backgroundColor: '#0284c7',
    color: '#fff'
  },
  prescOptionDoc: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20
  },
  analyzingText: {
    fontSize: 13,
    color: '#0284c7',
    fontWeight: '500'
  },
  recommendationsBlock: {
    marginTop: 10
  },
  recomTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12
  },
  recomItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10
  },
  recomCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  recomCheckboxChecked: {
    borderColor: '#0284c7',
    backgroundColor: '#0284c7'
  },
  recomCheckIcon: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  recomItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  recomItemCategory: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  addMappedBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16
  },
  addMappedBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  aiSuiteBanner: {
    backgroundColor: '#0f172a',
    borderColor: '#0284c7',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    shadowColor: '#0284c7',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  aiSuiteLeft: {
    flex: 1,
  },
  aiBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  aiBadgePillText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  aiSuiteTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  aiSuiteSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 14,
  },
  aiSuiteRight: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  aiLaunchText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cleanListFooter: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
    gap: 12,
  },
  nablFooterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 14,
    width: '100%',
  },
  nablFooterTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  nablFooterSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  floatingAiFooterBtn: {
    backgroundColor: '#0f172a',
    borderColor: '#0284c7',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
  },
  floatingAiFooterText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
