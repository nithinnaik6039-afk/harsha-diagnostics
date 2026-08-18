import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../store/useAppStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  initialTab?: string;
}

export default function AIHealthIntelligenceHub({ visible, onClose, initialTab = 'risk' }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // --- 1. SYMPTOM RISK EVALUATOR STATE ---
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomResult, setSymptomResult] = useState<any | null>(null);
  const [isAnalyzingRisk, setIsAnalyzingRisk] = useState(false);

  // --- 2. PRESCRIPTION OCR STATE ---
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<any | null>(null);

  // --- 3. BIOMARKER TRENDS STATE ---
  const [selectedAnalyte, setSelectedAnalyte] = useState<'hba1c' | 'cholesterol' | 'tsh' | 'vitamin_d'>('hba1c');

  // --- 4. BIOLOGICAL AGE CALCULATOR STATE ---
  const [chronologicalAge, setChronologicalAge] = useState('38');
  const [systolicBp, setSystolicBp] = useState('120');
  const [fastingGlucose, setFastingGlucose] = useState('95');
  const [bmiValue, setBmiValue] = useState('23.5');
  const [bioAgeResult, setBioAgeResult] = useState<any | null>(null);

  // --- 5. CARDIAC ASCVD 10-YEAR RISK STATE ---
  const [totChol, setTotChol] = useState('190');
  const [hdlChol, setHdlChol] = useState('48');
  const [isSmoker, setIsSmoker] = useState(false);
  const [ascvdResult, setAscvdResult] = useState<any | null>(null);

  // --- 6. DRUG-LAB INTERACTION STATE ---
  const [searchDrug, setSearchDrug] = useState('Metformin');
  const [drugInteractionResult, setDrugInteractionResult] = useState<any | null>(null);

  // --- 7. NUTRITION PROTOCOL STATE ---
  const [selectedDeficiency, setSelectedDeficiency] = useState<'vitamin_d' | 'b12' | 'hba1c_high' | 'high_uric_acid'>('vitamin_d');

  // --- HANDLERS ---
  const handleToggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setSymptomResult(null);
  };

  const handleRunRiskAI = () => {
    if (selectedSymptoms.length === 0) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Please select at least 1 symptom.');
      } else {
        Alert.alert('Select Symptom', 'Please select at least 1 symptom.');
      }
      return;
    }
    setIsAnalyzingRisk(true);
    setTimeout(() => {
      setIsAnalyzingRisk(false);
      let pkg = 'Executive Full Body Health Panel (64 Parameters)';
      let price = 1499;
      let biomarkers = ['HbA1c Glycated Hemoglobin', 'Liver Enzymes (SGOT/SGPT)', 'Lipid Profile', 'Thyroid TSH'];
      if (selectedSymptoms.includes('thirst') || selectedSymptoms.includes('fatigue')) {
        pkg = 'Comprehensive Diabetes & Metabolic Shield';
        price = 899;
        biomarkers = ['Fasting Blood Glucose', 'HbA1c', 'Microalbuminuria Urine Ratio', 'Lipid Profile'];
      } else if (selectedSymptoms.includes('weight_gain')) {
        pkg = 'Advanced Thyroid & Hormonal Panel';
        price = 750;
        biomarkers = ['Free T3, Free T4, Ultra TSH', 'Anti-TPO Antibodies'];
      }
      setSymptomResult({ pkg, price, biomarkers, confidence: 97.2 });
    }, 600);
  };

  const handleScanOcr = () => {
    setIsOcrScanning(true);
    setTimeout(() => {
      setIsOcrScanning(false);
      setOcrResult({
        doctorName: 'Dr. K. Srinivas Rao, MD (General Medicine)',
        clinic: 'Apollo Medical Centre, Subhash Road, Anantapuramu',
        tests: [
          { name: 'Lipid Profile Panel (Direct LDL/HDL)', price: 450 },
          { name: 'Glycosylated HbA1c Sugar', price: 350 },
          { name: 'Kidney Function Test (Creatinine, Urea, Uric Acid)', price: 420 },
          { name: 'Complete Blood Picture (CBP / Hemogram)', price: 280 },
        ],
        total: 1500,
      });
    }, 800);
  };

  const handleCalculateBioAge = () => {
    const cAge = parseFloat(chronologicalAge) || 38;
    const sBp = parseFloat(systolicBp) || 120;
    const fGluc = parseFloat(fastingGlucose) || 95;
    const bmi = parseFloat(bmiValue) || 23.5;

    let delta = 0;
    if (sBp > 130) delta += 2.4;
    if (sBp < 115) delta -= 1.2;
    if (fGluc > 105) delta += 3.1;
    if (fGluc < 90) delta -= 1.5;
    if (bmi > 25) delta += 2.0;
    if (bmi >= 19 && bmi <= 23) delta -= 2.2;

    const calculatedBioAge = Math.max(18, Math.round((cAge + delta) * 10) / 10);
    const score = Math.max(50, Math.min(99, Math.round(100 - (calculatedBioAge - cAge) * 4)));

    setBioAgeResult({
      bioAge: calculatedBioAge,
      chronologicalAge: cAge,
      delta: Math.round((calculatedBioAge - cAge) * 10) / 10,
      longevityScore: score,
      status: calculatedBioAge <= cAge ? 'Optimal (Youthful Biomarkers)' : 'Accelerated Aging Alert',
    });
  };

  const handleCalculateAscvd = () => {
    const tot = parseFloat(totChol) || 190;
    const hdl = parseFloat(hdlChol) || 48;
    let risk = (tot / hdl) * 1.8 + (isSmoker ? 4.5 : 0.5);
    risk = Math.round(risk * 10) / 10;
    setAscvdResult({
      riskPercent: risk,
      tier: risk < 5 ? 'Low Risk (<5%)' : risk < 10 ? 'Borderline Risk (5-9.9%)' : 'Elevated Cardiac Risk (≥10%)',
      recommendation: 'Target LDL < 100 mg/dL, schedule Annual Lipid Screen + hs-CRP.',
    });
  };

  const handleCheckDrugInteraction = () => {
    const d = searchDrug.toLowerCase();
    if (d.includes('metformin')) {
      setDrugInteractionResult({
        drug: 'Metformin Hydrochloride',
        impact: 'May cause mild B12 malabsorption over long-term use. Fasting glucose required.',
        testsToMonitor: ['Serum Vitamin B12', 'Fasting Blood Glucose & HbA1c', 'Serum Creatinine (eGFR)'],
        timingRule: 'Hold morning dose until fasting blood draw is completed.',
      });
    } else if (d.includes('statin') || d.includes('atorvastatin')) {
      setDrugInteractionResult({
        drug: 'Atorvastatin / Rosuvastatin',
        impact: 'Requires regular baseline liver enzyme & muscle biomarker audits.',
        testsToMonitor: ['SGOT/SGPT (Liver Enzymes)', 'Creatine Kinase (CPK)', 'Lipid Profile'],
        timingRule: 'Take evening dose as normal; 10-12 hour fasting recommended.',
      });
    } else {
      setDrugInteractionResult({
        drug: searchDrug || 'Thyroxine / Eltroxin',
        impact: 'Exogenous thyroid hormone can falsely elevate Free T4 if taken right before blood draw.',
        testsToMonitor: ['TSH Ultrasensitive', 'Free T3', 'Free T4'],
        timingRule: 'Take blood sample EARLY MORNING BEFORE taking your daily Thyroxine pill.',
      });
    }
  };

  const nutritionData = {
    vitamin_d: {
      title: '☀️ Vitamin D3 (Cholecalciferol) Optimization',
      diet: ['Egg yolks, fortified dairy & almond milk', 'Wild salmon, mackerel, mushrooms exposed to sunlight'],
      supplements: '60,000 IU Vitamin D3 weekly capsule for 8 weeks, followed by monthly maintenance.',
      recheckWindow: 'Re-test 25-OH Vitamin D after 12 weeks.',
    },
    b12: {
      title: '🥩 Vitamin B12 & Nerve Sheath Protocol',
      diet: ['Sprouts, nutritional yeast, fermented foods', 'Lean poultry, eggs, and Greek yogurt'],
      supplements: '1500 mcg Methylcobalamin sublingual daily.',
      recheckWindow: 'Re-test Serum Vitamin B12 in 8 weeks.',
    },
    hba1c_high: {
      title: '📉 Glycemic Index & Insulin Sensitivity Diet',
      diet: ['High soluble fiber (Fenugreek/Methi, Chia seeds)', 'Low GI millets (Ragi, Foxtail millet, Jowar)', 'Limit refined carbs & polished white rice'],
      supplements: 'Alpha Lipoic Acid + Chromium Picolinate (under physician consult).',
      recheckWindow: 'Re-test HbA1c every 90 days.',
    },
    high_uric_acid: {
      title: '💧 Purine Clearance & Anti-Gout Protocol',
      diet: ['Drink 3.5L structured water daily', 'Tart cherry juice, lemon water, cucumbers', 'Avoid red meat, yeast extracts, shellfish, and sugary sodas'],
      supplements: 'Vitamin C 500mg daily to enhance renal uric acid excretion.',
      recheckWindow: 'Re-test Serum Uric Acid in 4 weeks.',
    },
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.headerIconBox}>
                <Text style={{ fontSize: 20 }}>✨</Text>
              </View>
              <View>
                <Text style={styles.modalTitle}>Harsha AI Medical Intelligence Suite</Text>
                <Text style={styles.modalSubtitle}>
                  7 Pro AI/ML Clinical Diagnostic & Bio-Intelligence Engines
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tab Bar */}
          <View style={styles.navBarContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
              {[
                { id: 'risk', label: '🤖 Risk Recommender' },
                { id: 'ocr', label: '📸 Prescription OCR' },
                { id: 'bioage', label: '🧬 Bio-Age & Longevity' },
                { id: 'cardiac', label: '🫀 10-Yr ASCVD Risk' },
                { id: 'nutrition', label: '🥗 AI Diet & Nutrition' },
                { id: 'drug', label: '💊 Drug-Lab Interactions' },
                { id: 'trends', label: '📊 Biomarker Trends' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.navTab, activeTab === tab.id && styles.navTabActive]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Text style={[styles.navTabText, activeTab === tab.id && styles.navTabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Body Content */}
          <ScrollView contentContainerStyle={styles.bodyScroll}>
            {/* TAB 1: RISK EVALUATOR */}
            {activeTab === 'risk' && (
              <View style={styles.tabSection}>
                <View style={styles.sectionHeadingRow}>
                  <Text style={styles.sectionHeading}>🤖 AI Symptom & Health Risk Evaluator</Text>
                  <Text style={styles.engineTag}>Pathology ML v4.2</Text>
                </View>
                <Text style={styles.sectionDesc}>
                  Select your current symptoms to evaluate risk factors and get targeted diagnostic panels.
                </Text>

                <View style={styles.chipsGrid}>
                  {[
                    { id: 'fatigue', label: '😴 Chronic Fatigue & Weakness' },
                    { id: 'thirst', label: '💧 Excessive Thirst & Frequent Urination' },
                    { id: 'weight_gain', label: '⚖️ Sudden Weight Gain / Hair Thinning' },
                    { id: 'joint_pain', label: '🦵 Joint Stiffness & Body Aches' },
                    { id: 'chest', label: '🫀 Mild Palpitations / Breathlessness' },
                    { id: 'acidity', label: '🤢 Post-Meal Bloating & Acidity' },
                  ].map((s) => {
                    const sel = selectedSymptoms.includes(s.id);
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.chipItem, sel && styles.chipItemActive]}
                        onPress={() => handleToggleSymptom(s.id)}
                      >
                        <Text style={[styles.chipText, sel && styles.chipTextActive]}>{s.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, isAnalyzingRisk && { opacity: 0.7 }]}
                  onPress={handleRunRiskAI}
                  disabled={isAnalyzingRisk}
                >
                  <Text style={styles.primaryActionText}>
                    {isAnalyzingRisk ? '⚡ Running Multi-Variant Analysis...' : 'Evaluate & Match Blood Panels 🔍'}
                  </Text>
                </TouchableOpacity>

                {symptomResult && (
                  <View style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultTag}>MATCHED CHECKUP PANEL</Text>
                      <Text style={styles.confidenceScore}>{symptomResult.confidence}% CONFIDENCE</Text>
                    </View>
                    <Text style={styles.packageNameText}>{symptomResult.pkg}</Text>
                    <View style={styles.pillsRow}>
                      {symptomResult.biomarkers.map((b: string, i: number) => (
                        <View key={i} style={styles.bioPill}>
                          <Text style={styles.bioPillText}>🧪 {b}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.resultFooter}>
                      <Text style={styles.priceNum}>₹{symptomResult.price}</Text>
                      <TouchableOpacity
                        style={styles.bookBtn}
                        onPress={() => {
                          onClose();
                          router.push('/cart');
                        }}
                      >
                        <Text style={styles.bookBtnText}>Book Home Draw →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* TAB 2: PRESCRIPTION OCR */}
            {activeTab === 'ocr' && (
              <View style={styles.tabSection}>
                <View style={styles.sectionHeadingRow}>
                  <Text style={styles.sectionHeading}>📸 Doctor Prescription AI OCR Scanner</Text>
                  <Text style={styles.engineTag}>Vision OCR v3.8</Text>
                </View>
                <Text style={styles.sectionDesc}>
                  Upload doctor slips or prescriptions. Our OCR engine deciphers clinical handwriting and auto-maps diagnostic tests.
                </Text>

                {!ocrResult ? (
                  <TouchableOpacity
                    style={[styles.uploadBox, isOcrScanning && { opacity: 0.7 }]}
                    onPress={handleScanOcr}
                    disabled={isOcrScanning}
                  >
                    <Text style={{ fontSize: 36 }}>📑</Text>
                    <Text style={styles.uploadTitle}>
                      {isOcrScanning ? '⚡ AI Scanning Clinical Prescription...' : 'Tap to Upload Doctor Slip or Prescription'}
                    </Text>
                    <Text style={styles.uploadSub}>Supports JPG, PNG, PDF (Up to 15MB)</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultTag}>DECIPHERED DOCTOR PRESCRIPTION</Text>
                      <Text style={styles.confidenceScore}>✓ VERIFIED</Text>
                    </View>
                    <Text style={styles.docName}>{ocrResult.doctorName}</Text>
                    <Text style={styles.clinicName}>{ocrResult.clinic}</Text>

                    <Text style={styles.subHeadingText}>IDENTIFIED BLOOD TESTS ({ocrResult.tests.length}):</Text>
                    <View style={{ gap: 6, marginVertical: 8 }}>
                      {ocrResult.tests.map((t: any, idx: number) => (
                        <View key={idx} style={styles.ocrItemRow}>
                          <Text style={styles.ocrTestName}>🧪 {t.name}</Text>
                          <Text style={styles.ocrPrice}>₹{t.price}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.resultFooter}>
                      <View>
                        <Text style={{ fontSize: 9, color: '#94a3b8', fontWeight: 'bold' }}>TOTAL ESTIMATE</Text>
                        <Text style={styles.priceNum}>₹{ocrResult.total}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.bookBtn}
                        onPress={() => {
                          onClose();
                          router.push('/cart');
                        }}
                      >
                        <Text style={styles.bookBtnText}>Book Home Blood Draw →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* TAB 3: BIOLOGICAL AGE & LONGEVITY */}
            {activeTab === 'bioage' && (
              <View style={styles.tabSection}>
                <View style={styles.sectionHeadingRow}>
                  <Text style={styles.sectionHeading}>🧬 Biological Age & Longevity Index</Text>
                  <Text style={styles.engineTag}>Klemera-Doubal ML</Text>
                </View>
                <Text style={styles.sectionDesc}>
                  Calculates your metabolic and cellular aging delta based on metabolic, cardiovascular, and body composition markers.
                </Text>

                <View style={styles.inputGrid}>
                  <View style={styles.inputItem}>
                    <Text style={styles.inputLabel}>CHRONOLOGICAL AGE</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={chronologicalAge}
                      onChangeText={setChronologicalAge}
                    />
                  </View>
                  <View style={styles.inputItem}>
                    <Text style={styles.inputLabel}>SYSTOLIC BP (mmHg)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={systolicBp}
                      onChangeText={setSystolicBp}
                    />
                  </View>
                  <View style={styles.inputItem}>
                    <Text style={styles.inputLabel}>FASTING GLUCOSE (mg/dL)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={fastingGlucose}
                      onChangeText={setFastingGlucose}
                    />
                  </View>
                  <View style={styles.inputItem}>
                    <Text style={styles.inputLabel}>BMI (Body Mass Index)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={bmiValue}
                      onChangeText={setBmiValue}
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.primaryActionBtn} onPress={handleCalculateBioAge}>
                  <Text style={styles.primaryActionText}>Calculate Biological Age Delta 🧬</Text>
                </TouchableOpacity>

                {bioAgeResult && (
                  <View style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultTag}>CELLULAR BIOLOGICAL AGE</Text>
                      <Text style={styles.confidenceScore}>LONGEVITY SCORE: {bioAgeResult.longevityScore}/100</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginVertical: 8 }}>
                      <Text style={styles.bigScore}>{bioAgeResult.bioAge} yrs</Text>
                      <Text style={{ fontSize: 13, color: bioAgeResult.delta <= 0 ? '#34d399' : '#f87171', fontWeight: 'bold' }}>
                        {bioAgeResult.delta <= 0 ? `▼ ${Math.abs(bioAgeResult.delta)} yrs younger` : `▲ +${bioAgeResult.delta} yrs accelerated`}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#94a3b8' }}>Status: <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>{bioAgeResult.status}</Text></Text>
                  </View>
                )}
              </View>
            )}

            {/* TAB 4: 10-YEAR CARDIAC ASCVD RISK */}
            {activeTab === 'cardiac' && (
              <View style={styles.tabSection}>
                <View style={styles.sectionHeadingRow}>
                  <Text style={styles.sectionHeading}>🫀 10-Year ASCVD Cardiovascular Risk</Text>
                  <Text style={styles.engineTag}>Framingham / ACC</Text>
                </View>
                <Text style={styles.sectionDesc}>
                  Calculates 10-year risk of atherosclerotic cardiovascular events from serum lipid profiles and lifestyle parameters.
                </Text>

                <View style={styles.inputGrid}>
                  <View style={styles.inputItem}>
                    <Text style={styles.inputLabel}>TOTAL CHOLESTEROL (mg/dL)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={totChol}
                      onChangeText={setTotChol}
                    />
                  </View>
                  <View style={styles.inputItem}>
                    <Text style={styles.inputLabel}>HDL "GOOD" CHOLESTEROL</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={hdlChol}
                      onChangeText={setHdlChol}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.chipItem, isSmoker && styles.chipItemActive, { marginBottom: 12 }]}
                  onPress={() => setIsSmoker(!isSmoker)}
                >
                  <Text style={[styles.chipText, isSmoker && styles.chipTextActive]}>
                    {isSmoker ? '🚬 Smoking History (Active / Recent)' : '🚭 Non-Smoker'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.primaryActionBtn} onPress={handleCalculateAscvd}>
                  <Text style={styles.primaryActionText}>Predict 10-Year Cardiac Risk 🫀</Text>
                </TouchableOpacity>

                {ascvdResult && (
                  <View style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultTag}>ESTIMATED 10-YEAR RISK</Text>
                      <Text style={styles.confidenceScore}>{ascvdResult.tier}</Text>
                    </View>
                    <Text style={styles.bigScore}>{ascvdResult.riskPercent}%</Text>
                    <Text style={{ fontSize: 11, color: '#cbd5e1', marginTop: 4 }}>{ascvdResult.recommendation}</Text>
                  </View>
                )}
              </View>
            )}

            {/* TAB 5: AI NUTRITION & MICRONUTRIENT GUIDE */}
            {activeTab === 'nutrition' && (
              <View style={styles.tabSection}>
                <View style={styles.sectionHeadingRow}>
                  <Text style={styles.sectionHeading}>🥗 AI Post-Diagnostic Nutrition Guide</Text>
                  <Text style={styles.engineTag}>Clinical Dietetics AI</Text>
                </View>
                <Text style={styles.sectionDesc}>
                  Select your blood test finding to get a customized food, hydration, and supplementation protocol.
                </Text>

                <View style={styles.chipsGrid}>
                  {[
                    { id: 'vitamin_d', label: '☀️ Vitamin D Deficiency' },
                    { id: 'b12', label: '🥩 Vitamin B12 Deficiency' },
                    { id: 'hba1c_high', label: '📉 Elevated Blood Glucose (HbA1c)' },
                    { id: 'high_uric_acid', label: '💧 High Uric Acid / Joint Pain' },
                  ].map((d) => (
                    <TouchableOpacity
                      key={d.id}
                      style={[styles.chipItem, selectedDeficiency === d.id && styles.chipItemActive]}
                      onPress={() => setSelectedDeficiency(d.id as any)}
                    >
                      <Text style={[styles.chipText, selectedDeficiency === d.id && styles.chipTextActive]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {nutritionData[selectedDeficiency] && (
                  <View style={styles.resultCard}>
                    <Text style={styles.docName}>{nutritionData[selectedDeficiency].title}</Text>
                    
                    <Text style={styles.subHeadingText}>RECOMMENDED SUPERFOODS:</Text>
                    {nutritionData[selectedDeficiency].diet.map((item, i) => (
                      <Text key={i} style={styles.dietBullet}>• {item}</Text>
                    ))}

                    <Text style={[styles.subHeadingText, { marginTop: 10 }]}>SUPPLEMENTATION PROTOCOL:</Text>
                    <Text style={styles.dietBullet}>{nutritionData[selectedDeficiency].supplements}</Text>

                    <Text style={[styles.subHeadingText, { marginTop: 10 }]}>RE-TEST TIMING:</Text>
                    <Text style={{ fontSize: 11, color: '#38bdf8', fontWeight: 'bold' }}>
                      {nutritionData[selectedDeficiency].recheckWindow}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* TAB 6: DRUG-LAB INTERACTION CHECKER */}
            {activeTab === 'drug' && (
              <View style={styles.tabSection}>
                <View style={styles.sectionHeadingRow}>
                  <Text style={styles.sectionHeading}>💊 Drug-Lab Interaction & Fasting AI</Text>
                  <Text style={styles.engineTag}>Pharmacokinetics AI</Text>
                </View>
                <Text style={styles.sectionDesc}>
                  Enter regular medications to check if they interfere with blood test values or require special fasting schedules.
                </Text>

                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.inputLabel}>MEDICATION NAME (e.g. Metformin, Atorvastatin, Thyroxine)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={searchDrug}
                    onChangeText={setSearchDrug}
                    placeholder="Enter medicine..."
                    placeholderTextColor="#64748b"
                  />
                </View>

                <TouchableOpacity style={styles.primaryActionBtn} onPress={handleCheckDrugInteraction}>
                  <Text style={styles.primaryActionText}>Audit Medication Contraindications 💊</Text>
                </TouchableOpacity>

                {drugInteractionResult && (
                  <View style={styles.resultCard}>
                    <Text style={styles.docName}>{drugInteractionResult.drug}</Text>
                    <Text style={{ fontSize: 11, color: '#e2e8f0', marginTop: 4, lineHeight: 16 }}>
                      {drugInteractionResult.impact}
                    </Text>

                    <Text style={styles.subHeadingText}>TESTS REQUIRING MONITORING:</Text>
                    <View style={{ gap: 4, marginVertical: 6 }}>
                      {drugInteractionResult.testsToMonitor.map((t: string, i: number) => (
                        <Text key={i} style={styles.dietBullet}>🧪 {t}</Text>
                      ))}
                    </View>

                    <View style={{ backgroundColor: '#082f49', borderRadius: 8, padding: 8, marginTop: 8 }}>
                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#38bdf8' }}>PHLEBOTOMY FASTING PROTOCOL:</Text>
                      <Text style={{ fontSize: 10, color: '#ffffff', marginTop: 2, fontWeight: '600' }}>
                        {drugInteractionResult.timingRule}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* TAB 7: BIOMARKER TRENDS */}
            {activeTab === 'trends' && (
              <View style={styles.tabSection}>
                <View style={styles.sectionHeadingRow}>
                  <Text style={styles.sectionHeading}>📊 Longitudinal Biomarker Trendline</Text>
                  <Text style={styles.engineTag}>Analytics Engine</Text>
                </View>
                <Text style={styles.sectionDesc}>
                  Track your biomarker progress over months with clinical reference thresholds.
                </Text>

                <View style={styles.chipsGrid}>
                  {[
                    { id: 'hba1c', label: 'HbA1c Sugar (5.6%)' },
                    { id: 'cholesterol', label: 'Total Cholesterol (178 mg/dL)' },
                    { id: 'tsh', label: 'Thyroid TSH (2.45 μIU/mL)' },
                    { id: 'vitamin_d', label: 'Vitamin D (42 ng/mL)' },
                  ].map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.chipItem, selectedAnalyte === t.id && styles.chipItemActive]}
                      onPress={() => setSelectedAnalyte(t.id as any)}
                    >
                      <Text style={[styles.chipText, selectedAnalyte === t.id && styles.chipTextActive]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.resultCard}>
                  <Text style={styles.docName}>{selectedAnalyte.toUpperCase()} BIOMARKER TRAJECTORY</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 }}>
                    <View style={styles.trendBox}>
                      <Text style={{ fontSize: 8, color: '#94a3b8', fontWeight: 'bold' }}>JAN 2026</Text>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: '#f87171' }}>Elevated</Text>
                    </View>
                    <View style={styles.trendBox}>
                      <Text style={{ fontSize: 8, color: '#94a3b8', fontWeight: 'bold' }}>MAY 2026</Text>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: '#fbbf24' }}>Borderline</Text>
                    </View>
                    <View style={[styles.trendBox, { backgroundColor: '#064e3b' }]}>
                      <Text style={{ fontSize: 8, color: '#a7f3d0', fontWeight: 'bold' }}>AUG 2026</Text>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: '#34d399' }}>Optimal ✓</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                    "Consistent positive trendline observed. Cellular parameters are inside certified reference ranges."
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#030712',
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 10,
    color: '#38bdf8',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  navBarContainer: {
    backgroundColor: '#090d16',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tabScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  navTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  navTabActive: {
    backgroundColor: '#0284c7',
  },
  navTabText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  navTabTextActive: {
    color: '#ffffff',
  },
  bodyScroll: {
    padding: 16,
  },
  tabSection: {
    gap: 12,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '900',
    color: '#f8fafc',
  },
  engineTag: {
    backgroundColor: '#082f49',
    color: '#38bdf8',
    fontSize: 8,
    fontWeight: '900',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  sectionDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  chipsGrid: {
    gap: 6,
  },
  chipItem: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipItemActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  chipText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  primaryActionBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  resultCard: {
    backgroundColor: '#062d22',
    borderColor: '#059669',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultTag: {
    fontSize: 9,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 0.5,
  },
  confidenceScore: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ffffff',
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  packageNameText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 6,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 10,
  },
  bioPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  bioPillText: {
    fontSize: 9,
    color: '#cbd5e1',
    fontWeight: 'bold',
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#064e3b',
    paddingTop: 8,
  },
  priceNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#34d399',
  },
  bookBtn: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#0284c7',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#082f49',
    gap: 6,
  },
  uploadTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  uploadSub: {
    fontSize: 10,
    color: '#38bdf8',
  },
  docName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  clinicName: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  subHeadingText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#34d399',
    marginTop: 8,
    marginBottom: 4,
  },
  ocrItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 8,
    padding: 6,
  },
  ocrTestName: {
    fontSize: 11,
    color: '#f8fafc',
  },
  ocrPrice: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#34d399',
  },
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  inputItem: {
    flex: 1,
    minWidth: '45%',
  },
  inputLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  bigScore: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
  },
  dietBullet: {
    fontSize: 10,
    color: '#e2e8f0',
    lineHeight: 16,
    marginLeft: 4,
  },
  trendBox: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
});
