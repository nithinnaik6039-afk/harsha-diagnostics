import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface RequiredTube {
  id: string;
  colorName: string;
  hexColor: string;
  additive: string;
  testsIncluded: string[];
  drawOrder: number;
  inversionsCount: string;
  collected: boolean;
}

interface TubeCollectionGuideProps {
  tests: Array<{ name: string; sampleType?: string }>;
  onAllCollected?: (status: boolean) => void;
}

export default function TubeCollectionGuide({ tests, onAllCollected }: TubeCollectionGuideProps) {
  // Map tests to clinical Vacutainer tube standards
  const computeTubes = (): RequiredTube[] => {
    const list: RequiredTube[] = [];
    const testNames = tests.map((t) => (t.name || '').toLowerCase());

    // 1. Light Blue (Sodium Citrate) - Coagulation/PT-INR
    if (testNames.some((t) => t.includes('pt') || t.includes('inr') || t.includes('coagulation'))) {
      list.push({
        id: 'blue',
        colorName: 'Light Blue',
        hexColor: '#38bdf8',
        additive: 'Sodium Citrate (3.2%)',
        testsIncluded: ['PT/INR', 'Coagulation'],
        drawOrder: 1,
        inversionsCount: '3–4 times',
        collected: false,
      });
    }

    // 2. Yellow / Gold (SST - Gel Separator) - Biochemistry, Lipid, Liver, Kidney, Thyroid, Sugar
    list.push({
      id: 'yellow',
      colorName: 'Yellow / Gold (SST)',
      hexColor: '#eab308',
      additive: 'Clot Activator + Gel',
      testsIncluded: ['RBS/Fasting Sugar', 'Lipid Profile', 'Thyroid (T3/T4/TSH)', 'LFT/KFT'],
      drawOrder: 2,
      inversionsCount: '5 times',
      collected: false,
    });

    // 3. Red (Plain Clot Activator) - Serology, Immunology
    if (testNames.some((t) => t.includes('vitamin') || t.includes('hiv') || t.includes('hepatitis') || t.includes('crp'))) {
      list.push({
        id: 'red',
        colorName: 'Red (Plain)',
        hexColor: '#ef4444',
        additive: 'Clot Activator (No Gel)',
        testsIncluded: ['Vitamin D/B12', 'Serology'],
        drawOrder: 3,
        inversionsCount: '5 times',
        collected: false,
      });
    }

    // 4. Lavender / Purple (K2 EDTA) - Hematology (CBC, ESR, HbA1c)
    list.push({
      id: 'lavender',
      colorName: 'Lavender (EDTA)',
      hexColor: '#a855f7',
      additive: 'K2 EDTA (Anticoagulant)',
      testsIncluded: ['Complete Blood Count (CBC)', 'HbA1c', 'ESR'],
      drawOrder: 4,
      inversionsCount: '8–10 gentle inversions',
      collected: false,
    });

    // 5. Grey (Sodium Fluoride / Potassium Oxalate) - Fasting Glucose
    if (testNames.some((t) => t.includes('fasting') || t.includes('ogtt') || t.includes('glucose tolerance'))) {
      list.push({
        id: 'grey',
        colorName: 'Grey (Fluoride)',
        hexColor: '#94a3b8',
        additive: 'Sodium Fluoride / K-Oxalate',
        testsIncluded: ['Fasting Blood Sugar', 'OGTT'],
        drawOrder: 5,
        inversionsCount: '8–10 times',
        collected: false,
      });
    }

    return list.sort((a, b) => a.drawOrder - b.drawOrder);
  };

  const [tubes, setTubes] = useState<RequiredTube[]>(computeTubes());

  const toggleCollected = (id: string) => {
    const updated = tubes.map((tube) =>
      tube.id === id ? { ...tube, collected: !tube.collected } : tube
    );
    setTubes(updated);
    const allDone = updated.every((t) => t.collected);
    if (onAllCollected) onAllCollected(allDone);
  };

  const collectedCount = tubes.filter((t) => t.collected).length;
  const totalCount = tubes.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 20 }}>🧪</Text>
          <View>
            <Text style={styles.title}>Vacutainer Order of Draw</Text>
            <Text style={styles.subtitle}>Clinical Phlebotomy Protocol</Text>
          </View>
        </View>

        <View style={styles.progressPill}>
          <Text style={styles.progressText}>
            {collectedCount} / {totalCount} Tubes Drawn
          </Text>
        </View>
      </View>

      {/* Tube List in exact clinical order of draw */}
      <View style={styles.list}>
        {tubes.map((tube, index) => (
          <TouchableOpacity
            key={tube.id}
            activeOpacity={0.8}
            onPress={() => toggleCollected(tube.id)}
            style={[
              styles.tubeCard,
              tube.collected && styles.tubeCardCollected,
            ]}
          >
            {/* Order index badge */}
            <View style={styles.orderBadge}>
              <Text style={styles.orderNumber}>#{index + 1}</Text>
            </View>

            {/* Tube color swatch */}
            <View style={[styles.colorSwatch, { backgroundColor: tube.hexColor }]} />

            {/* Tube details */}
            <View style={styles.tubeInfo}>
              <View style={styles.tubeTitleRow}>
                <Text style={styles.tubeName}>{tube.colorName}</Text>
                <Text style={styles.inversionTag}>🔄 {tube.inversionsCount}</Text>
              </View>
              <Text style={styles.additiveText}>Additive: {tube.additive}</Text>
              <Text style={styles.forTestsText}>
                Tests: {tube.testsIncluded.join(' • ')}
              </Text>
            </View>

            {/* Checkbox */}
            <View style={[styles.checkbox, tube.collected && styles.checkboxActive]}>
              <Text style={styles.checkIcon}>{tube.collected ? '✓' : ''}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tipBox}>
        <Text style={styles.tipText}>
          💡 <Text style={{ fontWeight: 'bold' }}>Pro Tip:</Text> Invert tubes immediately after collection to prevent micro-clots. Do not shake vigorously.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
  },
  progressPill: {
    backgroundColor: '#064e3b',
    borderColor: '#059669',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '800',
  },
  list: {
    gap: 8,
  },
  tubeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 10,
  },
  tubeCardCollected: {
    backgroundColor: '#0f291e',
    borderColor: '#059669',
  },
  orderBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  colorSwatch: {
    width: 14,
    height: 38,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tubeInfo: {
    flex: 1,
  },
  tubeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  tubeName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
  },
  inversionTag: {
    fontSize: 9,
    color: '#38bdf8',
    fontWeight: '600',
  },
  additiveText: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 2,
  },
  forTestsText: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#64748b',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  checkboxActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkIcon: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  tipBox: {
    marginTop: 12,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  tipText: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
  },
});
