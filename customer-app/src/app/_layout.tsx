import { DarkTheme, DefaultTheme, ThemeProvider, Slot, useRouter, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, Platform, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

SplashScreen.preventAutoHideAsync();

function WebHeader({ pathname, language }: { pathname: string; language: string }) {
  const router = useRouter();
  const { cart } = useAppStore();
  const isHome = pathname === '/';
  const isExplore = pathname === '/explore';
  const isCart = pathname === '/cart';
  const isProfile = pathname === '/profile';

  return (
    <View style={styles.tabListContainer}>
      <View style={styles.innerContainer}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandIcon}>🩸</Text>
          <Text style={styles.brandText} numberOfLines={1}>
            {language === 'te' ? 'హర్ష డయాగ్నోస్టిక్స్' : 'Harsha Diagnostics'}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollNav}
          style={{ flexGrow: 0 }}
        >
          <TouchableOpacity
            onPress={() => router.navigate('/')}
            style={[styles.tabButton, isHome && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, isHome && styles.tabButtonTextActive]}>
              🏠 {language === 'te' ? 'హోమ్' : 'Home'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.navigate('/explore')}
            style={[styles.tabButton, isExplore && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, isExplore && styles.tabButtonTextActive]}>
              🧪 {language === 'te' ? 'పరీక్షలు' : 'Tests'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.navigate('/cart')}
            style={[styles.tabButton, isCart && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, isCart && styles.tabButtonTextActive]}>
              🛒 {language === 'te' ? 'కార్ట్' : 'Cart'} {cart.length > 0 ? `(${cart.length})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.navigate('/profile')}
            style={[styles.tabButton, isProfile && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, isProfile && styles.tabButtonTextActive]}>
              👤 {language === 'te' ? 'ప్రొఫైల్' : 'Profile'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const { token, language, loadAuth } = useAppStore();
  const router = useRouter();

  // Initialize persisted auth on mount
  useEffect(() => {
    loadAuth();
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) {
      router.replace('/(auth)/login');
    }
  }, [token]);

  return (
    <ThemeProvider value={DarkTheme}>
      <AnimatedSplashOverlay />
      {token ? (
        Platform.OS === 'web' ? (
          <View style={{ flex: 1, backgroundColor: '#030712' }}>
            <WebHeader pathname={pathname} language={language} />
            <View style={{ flex: 1, paddingTop: 56 }}>
              <Slot />
            </View>
          </View>
        ) : (
          <AppTabs />
        )
      ) : (
        <Slot />
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    paddingHorizontal: 12,
    backgroundColor: '#030712',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1200,
    gap: 8,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  brandIcon: {
    fontSize: 16,
  },
  brandText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },
  scrollNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabButtonActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
});
