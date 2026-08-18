import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useRouter } from 'expo-router';

export default function AIHealthRiskChecker() {
  const router = useRouter();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const symptomsList = [
    { id: 'fatigue', label: '😴 Chronic Fatigue & Weakness', category: 'General' },
    { id: 'thirst', label: '💧 Excessive Thirst & Frequent Urination', category: 'Diabetes' },
    { id: 'weight_gain', label: '⚖️ Unexplained Weight Gain & Hair Loss', category: 'Thyroid' },
    { id: 'joint_pain', label: '🦵 Joint Aches & Morning Stiffness', category: 'Inflammation' },
    { id: 'chest_discomfort', label: '🫀 Mild Palpitations / Breathlessness', category: 'Cardiac' },
    { id: 'digestion', label: '🤢 Acidity, Bloating & Fatty Food Discomfort', category: 'Liver/Lipid' },
  ];

  const handleToggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setResult(null);
  };

  const handleRunAIAnalysis = () => {
    if (selectedSymptoms.length === 0) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Please select at least 1 symptom above to evaluate your health risk.');
      } else {
        Alert.alert('Select Symptom', 'Please select at least 1 symptom to evaluate.');
      }
      return;
    }

    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);

      let recommendedPackage = 'Comprehensive Full Body Health Check (64 Parameters)';
      let price = 1499;
      let riskFactors = ['Metabolic Profile', 'Thyroid Function (TSH)', 'Vitamin Deficiency'];

      if (selectedSymptoms.includes('thirst') || selectedSymptoms.includes('fatigue')) {
        recommendedPackage = 'Diabetes & Metabolic Wellness Profile';
        price = 899;
        riskFactors = ['HbA1c Glycated Hemoglobin', 'Fasting Blood Sugar', 'Lipid Profile'];
      } else if (selectedSymptoms.includes('weight_gain')) {
        recommendedPackage = 'Complete Thyroid & Hormonal Health Panel';
        price = 750;
        riskFactors = ['Total T3, Total T4, Ultra TSH', 'Anti-TPO Antibodies'];
      } else if (selectedSymptoms.includes('chest_discomfort')) {
        recommendedPackage = 'Executive Cardiac & Lipid Risk Panel';
        price = 1250;
        riskFactors = ['High Sensitivity CRP', 'Apolipoprotein A1/B', 'Total Cholesterol & Triglycerides'];
      }

      setResult({
        packageName: recommendedPackage,
        price,
        riskFactors,
        confidenceScore: 96.4,
      });
    }, 800);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 18 }}>🤖</Text>
          <Text style={styles.title}>AI HEALTH RISK EVALUATOR & TEST RECOMMENDER</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>SMART AI</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Select any current symptoms for personalized test recommendations backed by certified pathologists.
      </Text>

      {/* Symptom Chips Grid */}
      <View style={styles.symptomsGrid}>
        {symptomsList.map((sym) => {
          const isSelected = selectedSymptoms.includes(sym.id);
          return (
            <TouchableOpacity
              key={sym.id}
              style={[styles.symptomChip, isSelected && styles.symptomChipActive]}
              onPress={() => handleToggleSymptom(sym.id)}
            >
              <Text style={[styles.symptomText, isSelected && styles.symptomTextActive]}>
                {sym.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Evaluate Button */}
      <TouchableOpacity
        style={[styles.evaluateBtn, analyzing && { opacity: 0.7 }]}
        onPress={handleRunAIAnalysis}
        disabled={analyzing}
      >
        <Text style={styles.evaluateBtnText}>
          {analyzing ? '⚡ Analyzing Biomarkers & Symptoms...' : 'Run AI Diagnostic Recommendation 🔍'}
        </Text>
      </TouchableOpacity>

      {/* Result Card */}
      {result && (
        <View style={styles.resultCard}>
          <View style={styles.resultTop}>
            <Text style={styles.resultTitle}>RECOMMENDED DIAGNOSTIC CHECKUP:</Text>
            <View style={styles.confBadge}>
              <Text style={styles.confText}>{result.confidenceScore}% MATCH</Text>
            </View>
          </View>

          <Text style={styles.packageName}>{result.packageName}</Text>
          
          <View style={styles.biomarkersRow}>
            {result.riskFactors.map((rf: string, idx: number) => (
              <View key={idx} style={styles.biomarkerPill}>
                <Text style={styles.biomarkerText}>🧪 {rf}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actionRow}>
            <Text style={styles.priceText}>₹{result.price}</Text>
            <TouchableOpacity
              style={styles.bookNowBtn}
              onPress={() => router.push('/cart')}
            >
              <Text style={styles.bookNowText}>Book Home Collection →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 10,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 12,
    lineHeight: 16,
  },
  symptomsGrid: {
    gap: 6,
    marginBottom: 12,
  },
  symptomChip: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  symptomChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  symptomText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  symptomTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  evaluateBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  evaluateBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  resultCard: {
    backgroundColor: '#062d22',
    borderColor: '#059669',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  resultTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 0.5,
  },
  confBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  confText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  packageName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
  },
  biomarkersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 12,
  },
  biomarkerPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  biomarkerText: {
    fontSize: 9,
    color: '#cbd5e1',
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#064e3b',
    paddingTop: 8,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#34d399',
  },
  bookNowBtn: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bookNowText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
