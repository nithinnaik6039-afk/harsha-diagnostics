import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

interface SOPItem {
  id: string;
  category: string;
  title: string;
  steps: string[];
}

export default function PhlebotomyKnowledgeBase() {
  const [search, setSearch] = useState('');
  const [selectedSOP, setSelectedSOP] = useState<SOPItem | null>(null);

  const sopList: SOPItem[] = [
    {
      id: '1',
      category: 'Difficult Veins',
      title: 'Collapsed or Rolling Vein Protocol',
      steps: [
        'Apply warm compress (38°C) for 3 minutes to promote vasodilation.',
        'Anchor vein firmly 2 inches below puncture site with non-dominant thumb.',
        'Enter skin at shallow 10°-15° angle using 23G winged butterfly needle.',
        'Avoid probing or digging to prevent hematoma and nerve irritation.',
      ],
    },
    {
      id: '2',
      category: 'Pediatric Draw',
      title: 'Pediatric / Neonatal Capillary & Heel Stick',
      steps: [
        'Warm the heel for 3-5 minutes prior to puncture.',
        'Target medial or lateral plantar surfaces only (never posterior curvature).',
        'Lancet puncture depth must not exceed 2.0 mm to prevent osteomyelitis.',
        'Wipe away the first drop of blood with sterile dry gauze before collecting.',
      ],
    },
    {
      id: '3',
      category: 'Aseptic Technique',
      title: 'Blood Culture Aseptic Venipuncture Protocol',
      steps: [
        'Disinfect vial rubber stoppers with 70% isopropyl alcohol and let dry.',
        'Clean patient site with 2% chlorhexidine gluconate in concentric circles for 30s.',
        'Allow site to air dry completely (min 30s) — never blow or fan.',
        'Inoculate Aerobic bottle FIRST, followed by Anaerobic bottle (8-10 mL each).',
      ],
    },
    {
      id: '4',
      category: 'Anticoagulation',
      title: 'Sodium Citrate (Light Blue) 9:1 Strict Ratio',
      steps: [
        'Ensure exact fill to indicator line (9 parts blood to 1 part 3.2% sodium citrate).',
        'Underfilling causes falsely prolonged PT / aPTT coagulation test results.',
        'Invert gently 3 to 4 times immediately after draw.',
      ],
    },
  ];

  const filtered = sopList.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>📚</Text>
          <Text style={styles.title}>NABL CLINICAL SOP & FLASH REFERENCE</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>SOP HANDBOOK</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Instant clinical guidelines for difficult draws, pediatric protocols, and sterile culture procedures.
      </Text>

      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search clinical protocols (e.g. Rolling Vein, Coagulation)..."
        placeholderTextColor="#64748b"
        value={search}
        onChangeText={setSearch}
      />

      {/* SOP Cards Grid */}
      <View style={styles.sopGrid}>
        {filtered.map((sop) => {
          const isOpen = selectedSOP?.id === sop.id;
          return (
            <TouchableOpacity
              key={sop.id}
              style={[styles.sopCard, isOpen && styles.sopCardOpen]}
              onPress={() => setSelectedSOP(isOpen ? null : sop)}
            >
              <View style={styles.sopTopRow}>
                <View>
                  <Text style={styles.sopCat}>{sop.category.toUpperCase()}</Text>
                  <Text style={styles.sopTitle}>{sop.title}</Text>
                </View>
                <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
              </View>

              {isOpen && (
                <View style={styles.stepsContainer}>
                  {sop.steps.map((step, idx) => (
                    <View key={idx} style={styles.stepItem}>
                      <Text style={styles.stepNum}>{idx + 1}.</Text>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
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
    color: '#cbd5e1',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: '#0369a1',
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
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 11,
    marginBottom: 10,
  },
  sopGrid: {
    gap: 8,
  },
  sopCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sopCardOpen: {
    borderColor: '#0284c7',
    backgroundColor: '#082f49',
  },
  sopTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sopCat: {
    fontSize: 8,
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  sopTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 2,
  },
  chevron: {
    color: '#94a3b8',
    fontSize: 10,
  },
  stepsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 6,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 6,
  },
  stepNum: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 10,
  },
  stepText: {
    color: '#cbd5e1',
    fontSize: 10,
    flex: 1,
    lineHeight: 14,
  },
});
