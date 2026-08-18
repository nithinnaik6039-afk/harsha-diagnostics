import { DarkTheme, DefaultTheme, ThemeProvider, Slot, useRouter, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, Platform, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useMltStore } from '../store/useMltStore';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

SplashScreen.preventAutoHideAsync();

function WebHeader({ pathname }: { pathname: string }) {
  const router = useRouter();
  const { logout, mlt } = useMltStore();
  const isHome = pathname === '/';
  const isExplore = pathname === '/explore';
  const isPartner = pathname?.startsWith('/partner');
  const isProfile = pathname === '/profile';

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.tabListContainer}>
      <View style={styles.innerContainer}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandIcon}>🩸</Text>
          <Text style={styles.brandText} numberOfLines={1}>
            Harsha MLT {mlt?.name ? `(${mlt.name.split(' ')[0]})` : ''}
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
              🏠 Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.navigate('/partner/dashboard')}
            style={[styles.tabButton, isPartner && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, isPartner && styles.tabButtonTextActive]}>
              🚀 Partner Hub
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.navigate('/explore')}
            style={[styles.tabButton, isExplore && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, isExplore && styles.tabButtonTextActive]}>
              💰 Earnings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.navigate('/profile')}
            style={[styles.tabButton, isProfile && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, isProfile && styles.tabButtonTextActive]}>
              👤 Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.tabButton, styles.logoutTabButton]}
          >
            <Text style={styles.logoutButtonText}>
              🚪 Logout
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
  const { token, loadAuth } = useMltStore();

  useEffect(() => {
    loadAuth().finally(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  return (
    <ThemeProvider value={DarkTheme}>
      <AnimatedSplashOverlay />
      {token ? (
        Platform.OS === 'web' ? (
          <View style={{ flex: 1, backgroundColor: '#020617' }}>
            <WebHeader pathname={pathname} />
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
    backgroundColor: '#059669',
    borderColor: '#10b981',
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  logoutTabButton: {
    backgroundColor: '#450a0a',
    borderColor: '#7f1d1d',
  },
  logoutButtonText: {
    color: '#f87171',
    fontWeight: 'bold',
    fontSize: 11,
  },
});
