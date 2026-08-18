// src/components/OrderQRCode.tsx
import React, { useState } from 'react';
import { View, Image, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';

interface Props {
  token: string; // QR token or data generated for the order
  size?: number;
  label?: string;
}

export const OrderQRCode: React.FC<Props> = ({ token, size = 200, label = 'Scan QR for Pickup Verification' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const qrUri = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(token)}&margin=10`;

  return (
    <View style={styles.container}>
      <View style={[styles.qrWrapper, { width: size + 24, height: size + 24 }]}>
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#10b981" />
          </View>
        )}
        <Image
          source={{ uri: qrUri }}
          style={{ width: size, height: size, borderRadius: 8 }}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          resizeMode="contain"
        />
      </View>

      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Text style={styles.tokenText}>Token: {token.slice(0, 16)}...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  qrWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loadingBox: {
    position: 'absolute',
    zIndex: 10,
  },
  label: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  tokenText: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#64748b',
  },
});

export default OrderQRCode;
