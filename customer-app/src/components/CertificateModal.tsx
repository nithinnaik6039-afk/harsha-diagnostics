import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  mltName?: string;
  mltPhone?: string;
  rating?: number;
}

export const CertificateModal: React.FC<Props> = ({
  visible,
  onClose,
  mltName = 'Rajesh Kumar',
  mltPhone = '+91 9876543210',
  rating = 4.9
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerIcon}>🛡️</Text>
              <View>
                <Text style={styles.title}>NABL / CMA Accredited</Text>
                <Text style={styles.subtitle}>Verified Clinical Lab Professional</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Certificate Badge Frame */}
            <View style={styles.certFrame}>
              <View style={styles.certTop}>
                <Text style={styles.certOrg}>GOVERNMENT OF ANDHRA PRADESH</Text>
                <Text style={styles.certSubOrg}>BOARD OF CLINICAL MEDICAL LABORATORY TECHNOLOGY</Text>
                <View style={styles.goldLine} />
              </View>

              <Text style={styles.certHeading}>CERTIFICATE OF REGISTRATION & PHLEBOTOMY COMPETENCE</Text>

              <Text style={styles.certBody}>
                This is to officially certify that
              </Text>
              <Text style={styles.certifiedName}>{mltName.toUpperCase()}</Text>
              <Text style={styles.certReg}>Reg. No: AP-MLT-2024-88492 • ISO 15189 Certified</Text>

              <Text style={styles.certDetails}>
                has satisfied all regulatory board requirements in Venipuncture, Sterile Specimen Handling, Cold-Chain Maintenance, and Biosafety Compliance.
              </Text>

              <View style={styles.certFooter}>
                <View style={styles.certSeal}>
                  <Text style={styles.sealIcon}>🎖️</Text>
                  <Text style={styles.sealText}>SEAL OF QUALITY</Text>
                </View>
                <View style={styles.signBox}>
                  <Text style={styles.signText}>Dr. M. S. Harsha, MD (Pathology)</Text>
                  <Text style={styles.signRole}>Chief Laboratory Director</Text>
                </View>
              </View>
            </View>

            {/* Trust Highlights */}
            <View style={styles.trustBadges}>
              <View style={styles.trustItem}>
                <Text style={styles.trustIcon}>✅</Text>
                <Text style={styles.trustText}>100% Sterile Single-use Vacutainers</Text>
              </View>
              <View style={styles.trustItem}>
                <Text style={styles.trustIcon}>❄️</Text>
                <Text style={styles.trustText}>Cold-Chain Specimen Transport Box</Text>
              </View>
              <View style={styles.trustItem}>
                <Text style={styles.trustIcon}>⭐</Text>
                <Text style={styles.trustText}>{rating} Star Patient Satisfaction Record</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.actionBtn} onPress={onClose}>
              <Text style={styles.actionBtnText}>Verified & Confirmed ✓</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    fontSize: 26,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
  },
  certFrame: {
    borderWidth: 2,
    borderColor: '#0284c7',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  certTop: {
    alignItems: 'center',
    marginBottom: 12,
  },
  certOrg: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0284c7',
    letterSpacing: 1,
  },
  certSubOrg: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  goldLine: {
    width: 80,
    height: 2,
    backgroundColor: '#0284c7',
    marginTop: 6,
  },
  certHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginVertical: 10,
    letterSpacing: 0.5,
  },
  certBody: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  certifiedName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0369a1',
    marginVertical: 6,
    textAlign: 'center',
  },
  certReg: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 10,
  },
  certDetails: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  certFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  certSeal: {
    alignItems: 'center',
  },
  sealIcon: {
    fontSize: 24,
  },
  sealText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#0284c7',
  },
  signBox: {
    alignItems: 'flex-end',
  },
  signText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  signRole: {
    fontSize: 8,
    color: '#64748b',
  },
  trustBadges: {
    gap: 8,
    marginBottom: 20,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  trustIcon: {
    fontSize: 16,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  actionBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CertificateModal;
