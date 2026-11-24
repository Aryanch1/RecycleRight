import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SpringPress } from './ui';
import { palette } from '../lib/theme';

/**
 * Flat white bottom tab bar: Scan / Guide / Impact / Settings, each a
 * labeled icon. The active tab is deep pine with a filled pale-pine
 * pill behind it; inactive tabs are muted. Deliberately flat — no
 * floating glass pill, no raised center button, no glow.
 */
export type TabKey = 'scan' | 'guide' | 'impact' | 'settings';

const TABS: { key: TabKey; label: string; glyph: string; route: '/' | '/guide' | '/impact' | '/settings' }[] = [
  { key: 'scan', label: 'Scan', glyph: '📷', route: '/' },
  { key: 'guide', label: 'Guide', glyph: '📖', route: '/guide' },
  { key: 'impact', label: 'Impact', glyph: '🌱', route: '/impact' },
  { key: 'settings', label: 'Settings', glyph: '⚙️', route: '/settings' },
];

export function BottomTabs({ current }: { current: TabKey }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((tab) => {
        const active = current === tab.key;
        return (
          <SpringPress
            key={tab.key}
            onPress={() => {
              if (!active) router.replace(tab.route);
            }}
            style={styles.tab}
            haptic
          >
            <View style={[styles.tabInner, active && styles.tabInnerActive]}>
              <Text style={[styles.tabGlyph, active && styles.tabGlyphActive]}>{tab.glyph}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </View>
          </SpringPress>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: palette.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  tab: { alignItems: 'center', flex: 1, minHeight: 48 },
  tabInner: {
    alignItems: 'center',
    borderRadius: 16,
    gap: 2,
    minWidth: 64,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabInnerActive: { backgroundColor: palette.primarySoft },
  tabGlyph: { fontSize: 20, opacity: 0.55 },
  tabGlyphActive: { opacity: 1 },
  tabLabel: { color: palette.muted, fontSize: 11, fontWeight: '700' },
  tabLabelActive: { color: palette.primary },
});
