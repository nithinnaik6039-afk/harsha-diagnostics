import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { ThemeMode, themes } from '../constants/theme';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useAppStore();
  const currentTheme = themes[theme] || themes.midnight;

  const themeOptions: Array<{ id: ThemeMode; label: string; icon: string }> = [
    { id: 'midnight', label: 'Midnight', icon: '🌌' },
    { id: 'ocean', label: 'Ocean', icon: '🌊' },
    { id: 'emerald', label: 'Emerald', icon: '🌿' },
    { id: 'day', label: 'Day', icon: '☀️' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.surface, borderColor: currentTheme.cardBorder }]}>
      <Text style={[styles.title, { color: currentTheme.textMuted }]}>🎨 THEME:</Text>
      <View style={styles.buttonsRow}>
        {themeOptions.map((opt) => {
          const isActive = theme === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.themeBtn,
                isActive && {
                  backgroundColor: currentTheme.primary,
                  borderColor: currentTheme.primaryGlow,
                },
              ]}
              onPress={() => setTheme(opt.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.btnText,
                  { color: isActive ? '#ffffff' : currentTheme.textSecondary },
                  isActive && { fontWeight: '900' },
                ]}
              >
                {opt.icon} {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginVertical: 6,
  },
  title: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    justifyContent: 'space-between',
  },
  themeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  btnText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
