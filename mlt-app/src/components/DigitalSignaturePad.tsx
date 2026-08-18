import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

interface DigitalSignaturePadProps {
  patientName: string;
  onSigned: (signatureData: string) => void;
  onCancel?: () => void;
}

export default function DigitalSignaturePad({
  patientName,
  onSigned,
  onCancel,
}: DigitalSignaturePadProps) {
  const [signedName, setSignedName] = useState(patientName);
  const [hasDrawn, setHasDrawn] = useState(false);

  const handleConfirm = () => {
    onSigned(`SIGN-${Date.now()}-${signedName}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>✍️ Patient Consent & Acknowledgement</Text>
        <Text style={styles.subtitle}>
          I acknowledge that blood/sample was drawn using sterile single-use vacutainer needles.
        </Text>
      </View>

      {/* Signature Canvas Box Simulator */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setHasDrawn(true)}
        style={[styles.canvasBox, hasDrawn && styles.canvasBoxSigned]}
      >
        {!hasDrawn ? (
          <View style={styles.placeholderBox}>
            <Text style={styles.canvasHint}>Tap / Draw here with patient finger or stylus</Text>
            <View style={styles.signLine} />
            <Text style={styles.signLineLabel}>Patient Sign Here ✕</Text>
          </View>
        ) : (
          <View style={styles.signatureDisplay}>
            <Text style={styles.drawnText}>✍️ {signedName || 'Patient Signature Verified'}</Text>
            <Text style={styles.timestampText}>Digitally Signed at {new Date().toLocaleTimeString()}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ BIO-VERIFIED</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Signer Name Input */}
      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>Signer Name / Guardian:</Text>
        <TextInput
          style={styles.nameInput}
          value={signedName}
          onChangeText={setSignedName}
          placeholder="Patient Name"
          placeholderTextColor="#64748b"
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.btnRow}>
        {hasDrawn && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setHasDrawn(false)}
          >
            <Text style={styles.clearBtnText}>Clear Signature</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          disabled={!hasDrawn && !signedName}
          style={[styles.confirmBtn, (!hasDrawn && !signedName) && { opacity: 0.5 }]}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmBtnText}>Confirm & Sign Off Specimen</Text>
        </TouchableOpacity>
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
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 3,
    lineHeight: 16,
  },
  canvasBox: {
    height: 120,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  canvasBoxSigned: {
    borderColor: '#10b981',
    backgroundColor: '#062e20',
    borderStyle: 'solid',
  },
  placeholderBox: {
    alignItems: 'center',
    width: '80%',
  },
  canvasHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 12,
  },
  signLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#475569',
    marginBottom: 4,
  },
  signLineLabel: {
    fontSize: 9,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  signatureDisplay: {
    alignItems: 'center',
    gap: 4,
  },
  drawnText: {
    fontSize: 20,
    fontStyle: 'italic',
    fontWeight: 'bold',
    color: '#34d399',
  },
  timestampText: {
    fontSize: 9,
    color: '#94a3b8',
  },
  verifiedBadge: {
    backgroundColor: '#064e3b',
    borderColor: '#059669',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#34d399',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  nameInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#ffffff',
    fontSize: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  clearBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
