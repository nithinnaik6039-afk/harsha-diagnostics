import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';

export interface AuthTabsProps {
  activeTab: 'login' | 'signup';
  setActiveTab: (tab: 'login' | 'signup') => void;
  loginLabel?: string;
  signupLabel?: string;
  theme?: 'light' | 'dark';
  children: {
    login: React.ReactNode;
    signup: React.ReactNode;
  };
}

export default function AuthTabs({
  activeTab,
  setActiveTab,
  loginLabel = 'Sign In',
  signupLabel = 'New Account',
  theme = 'light',
  children,
}: AuthTabsProps) {
  const isDark = theme === 'dark';

  return (
    <View style={styles.container}>
      {/* Segmented Switcher */}
      <View
        style={[
          styles.tabsContainer,
          isDark ? styles.tabsContainerDark : styles.tabsContainerLight,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.tab,
            activeTab === 'login' && (isDark ? styles.activeTabDark : styles.activeTabLight),
          ]}
          onPress={() => setActiveTab('login')}
        >
          <Text
            style={[
              styles.tabText,
              isDark ? styles.tabTextDark : styles.tabTextLight,
              activeTab === 'login' &&
                (isDark ? styles.activeTabTextDark : styles.activeTabTextLight),
            ]}
          >
            {loginLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.tab,
            activeTab === 'signup' && (isDark ? styles.activeTabDark : styles.activeTabLight),
          ]}
          onPress={() => setActiveTab('signup')}
        >
          <Text
            style={[
              styles.tabText,
              isDark ? styles.tabTextDark : styles.tabTextLight,
              activeTab === 'signup' &&
                (isDark ? styles.activeTabTextDark : styles.activeTabTextLight),
            ]}
          >
            {signupLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Content */}
      <View style={styles.content}>
        {activeTab === 'login' ? children.login : children.signup}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 5,
    marginBottom: 22,
    borderWidth: 1,
  },
  tabsContainerLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  tabsContainerDark: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    transitionDuration: '200ms',
  },
  activeTabLight: {
    backgroundColor: '#ffffff',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  activeTabDark: {
    backgroundColor: '#1e293b',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#475569',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tabTextLight: {
    color: '#64748b',
  },
  tabTextDark: {
    color: '#94a3b8',
  },
  activeTabTextLight: {
    color: '#0284c7',
    fontWeight: '800',
  },
  activeTabTextDark: {
    color: '#38bdf8',
    fontWeight: '800',
  },
  content: {
    width: '100%',
  },
});
