import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { translations, TranslationKeys } from '../constants/translations';

interface ThemeTextProps extends TextProps {
  tid?: TranslationKeys;
  children?: React.ReactNode;
}

export const ThemeText: React.FC<ThemeTextProps> = ({ tid, children, style, ...props }) => {
  const language = useAppStore((state) => state.language);

  let content = children;
  if (tid) {
    content = translations[language][tid] || translations['en'][tid] || tid;
  }

  return (
    <Text style={[styles.text, style]} {...props}>
      {content}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'System',
    color: '#0f172a', // Slate 900 default
  },
});
