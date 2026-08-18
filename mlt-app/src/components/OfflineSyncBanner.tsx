import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function OfflineSyncBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [cachedItemsCount, setCachedItemsCount] = useState(0);

  // Toggle simulation for demonstration
  const toggleNetwork = () => {
    if (isOnline) {
      setIsOnline(false);
      setCachedItemsCount(2);
    } else {
      setIsOnline(true);
      setCachedItemsCount(0);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.banner, !isOnline && styles.bannerOffline]}
      onPress={toggleNetwork}
    >
      <View style={styles.left}>
        <View style={[styles.dot, { backgroundColor: isOnline ? '#34d399' : '#f59e0b' }]} />
        <Text style={styles.bannerText}>
          {isOnline
            ? '● Cloud Sync Active (4G/5G Network Live)'
            : `⚠️ Offline Mode — ${cachedItemsCount} Sample logs queued locally`}
        </Text>
      </View>
      <Text style={styles.simText}>{isOnline ? 'Simulate Offline' : 'Simulate Online'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#064e3b',
    borderColor: '#059669',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  bannerOffline: {
    backgroundColor: '#451a03',
    borderColor: '#d97706',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bannerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  simText: {
    fontSize: 9,
    color: '#94a3b8',
    textDecorationLine: 'underline',
  },
});
