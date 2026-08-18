import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export interface AuthTabsProps {
  activeTab: 'phone' | 'email';
  setActiveTab: (tab: 'phone' | 'email') => void;
  phoneLabel?: string;
  emailLabel?: string;
  children: {
    phone: React.ReactNode;
    email: React.ReactNode;
  };
}

export default function AuthTabs({
  activeTab,
  setActiveTab,
  phoneLabel = '📱 Mobile + OTP',
  emailLabel = '✉️ Staff Email',
  children,
}: AuthTabsProps) {
  return (
    <View style={styles.container}>
      {/* Segmented Switcher */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tab, activeTab === 'phone' && styles.activeTab]}
          onPress={() => setActiveTab('phone')}
        >
          <Text style={[styles.tabText, activeTab === 'phone' && styles.activeTabText]}>
            {phoneLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tab, activeTab === 'email' && styles.activeTab]}
          onPress={() => setActiveTab('email')}
        >
          <Text style={[styles.tabText, activeTab === 'email' && styles.activeTabText]}>
            {emailLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'phone' ? children.phone : children.email}
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
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 16,
    padding: 5,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  activeTabText: {
    color: '#34d399',
    fontWeight: '800',
  },
  content: {
    width: '100%',
  },
});
