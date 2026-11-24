import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { RecycleRefresh, RefreshButton } from '../components/RecycleRefresh';
import { EmptyState, GlassCard, SectionHeader, Skeleton, SpringPress } from '../components/ui';
import { useApp } from '../lib/store';
import { palette, radii, spacing, type, useResponsive } from '../lib/theme';
import { STREAMS, streamName, type Stream } from '../lib/types';

/**
 * Impact — the big tally. Huge Bitter numbers for items sorted, kg
 * diverted (an estimate, labelled as one) and the day streak; a
 * 7-day bar chart from impact.weekly with today in pine; a by-stream
 * split with colored bars, counts and shares; a demo-data note with a
 * link to Settings while the seeded baseline is in the totals; and an
 * empty state when demo data is off and nothing has been sorted yet.
 * Pull down to replay the recycling-loop refresh.
 */
export default function ImpactScreen() {
  const router = useRouter();
  const { impact, showDemo, scans } = useApp();
  const r = useResponsive();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // The tally is local; refresh re-reads state and replays the loop.
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const streamTotal = useMemo(
    () => (Object.values(impact.byStream) as number[]).reduce((sum, n) => sum + n, 0),
    [impact.byStream],
  );
  const maxWeek = useMemo(
    () => Math.max(1, ...impact.weekly.map((d) => d.count)),
    [impact.weekly],
  );
  const isEmpty = !showDemo && impact.itemsSorted === 0;

  const tally = (
    <View>
      <Animated.View entering={FadeInDown.springify()}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <SectionHeader kicker="Impact" title="Your tally so far" />
          </View>
          {Platform.OS === 'web' ? (
            <RefreshButton refreshing={refreshing} onPress={onRefresh} />
          ) : null}
        </View>
      </Animated.View>

      {refreshing ? (
        <View style={styles.skeletonBlock}>
          <Skeleton width="100%" height={120} radius={radii.card} />
          <Skeleton width="100%" height={180} radius={radii.card} />
        </View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(70).springify()}>
        <GlassCard style={styles.tallyCard}>
          <View style={styles.bigRow}>
            <Text style={styles.bigNumber}>{impact.itemsSorted}</Text>
            <Text style={styles.bigLabel}>items sorted</Text>
          </View>
          <View style={styles.tallyDivider} />
          <View style={styles.bigRow}>
            <Text style={styles.bigNumber}>{impact.kgDiverted.toFixed(1)} kg</Text>
            <Text style={styles.bigLabel}>diverted from landfill · estimated</Text>
          </View>
          <View style={styles.tallyDivider} />
          <View style={styles.bigRow}>
            <Text style={styles.bigNumber}>
              {impact.streakDays}
              <Text style={styles.bigUnit}> days</Text>
            </Text>
            <Text style={styles.bigLabel}>sorting streak</Text>
          </View>
          <Text style={styles.estimateNote}>
            Weights are estimates — a rough average per item by stream, not a
            weigh-in. The count of items is exact; the kilograms are a guide.
          </Text>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).springify()}>
        <SectionHeader kicker="This week" title="Last 7 days" />
        <GlassCard style={styles.chartCard}>
          {impact.weekly.length === 0 || streamTotal === 0 ? (
            <Text style={styles.chartEmpty}>No scans in the last 7 days yet.</Text>
          ) : (
            <View style={styles.bars}>
              {impact.weekly.map((day, i) => {
                const isToday = i === impact.weekly.length - 1;
                const height = Math.max(8, Math.round((day.count / maxWeek) * 120));
                return (
                  <View key={`${day.label}-${i}`} style={styles.barCol}>
                    <Text style={[styles.barCount, isToday && styles.barCountToday]}>
                      {day.count}
                    </Text>
                    <View
                      style={[
                        styles.bar,
                        {
                          height,
                          backgroundColor: isToday ? palette.primary : palette.leafSoft,
                        },
                      ]}
                    />
                    <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                      {isToday ? 'Today' : day.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(170).springify()}>
        <SectionHeader kicker="By stream" title="Where it all went" />
        <GlassCard style={styles.splitCard}>
          {STREAMS.map((s) => {
            const count = impact.byStream[s.stream as Stream] ?? 0;
            const share = streamTotal === 0 ? 0 : Math.round((count / streamTotal) * 100);
            return (
              <View key={s.stream} style={styles.splitRow}>
                <Text style={styles.splitGlyph}>{s.glyph}</Text>
                <View style={styles.splitMain}>
                  <View style={styles.splitHead}>
                    <Text style={styles.splitName}>{streamName(s.stream)}</Text>
                    <Text style={styles.splitCount}>
                      {count} · {share}%
                    </Text>
                  </View>
                  <View style={styles.splitTrack}>
                    <View
                      style={[
                        styles.splitFill,
                        { width: `${share}%`, backgroundColor: s.color },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
          {streamTotal === 0 ? (
            <Text style={styles.chartEmpty}>Nothing sorted into any stream yet.</Text>
          ) : null}
        </GlassCard>
      </Animated.View>

      {showDemo ? (
        <Animated.View entering={FadeInDown.delay(220).springify()}>
          <GlassCard style={styles.demoCard}>
            <Text style={styles.demoTitle}>Demo data is on</Text>
            <Text style={styles.demoBody}>
              These totals include the seeded demo baseline of 128 items, 14.2 kg
              and a 12-day streak, plus your own {scans.filter((s) => !s.isDemo).length} sorted
              item{scans.filter((s) => !s.isDemo).length === 1 ? '' : 's'}. Turn demo data off
              or clear it in Settings to see only what you have sorted yourself.
            </Text>
            <SpringPress onPress={() => router.push('/settings')} haptic>
              <View style={styles.demoLink}>
                <Text style={styles.demoLinkText}>Open Settings to clear demo data →</Text>
              </View>
            </SpringPress>
          </GlassCard>
        </Animated.View>
      ) : null}
    </View>
  );

  if (isEmpty) {
    return (
      <View style={[styles.root, { backgroundColor: palette.ground }]}>
        <RecycleRefresh refreshing={refreshing} onRefresh={onRefresh}>
          <View
            style={[
              styles.scroll,
              { paddingHorizontal: r.pad, maxWidth: r.contentMaxWidth, alignSelf: 'center' },
            ]}
          >
            <SectionHeader kicker="Impact" title="Your tally so far" />
            <EmptyState
              glyph="♻️"
              title="Nothing sorted yet"
              body="Sort your first item — snap a photo or type its name on the Scan tab — and your tally starts here."
              actionLabel="Go to Scan"
              onAction={() => router.replace('/')}
            />
          </View>
        </RecycleRefresh>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: palette.ground }]}>
      <RecycleRefresh refreshing={refreshing} onRefresh={onRefresh}>
        <View
          style={[
            styles.scroll,
            { paddingHorizontal: r.pad, maxWidth: r.contentMaxWidth, alignSelf: 'center' },
          ]}
        >
          {tally}
        </View>
      </RecycleRefresh>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 48, paddingTop: 20, width: '100%' },
  headerRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  headerText: { flex: 1 },
  refreshWrap: { alignItems: 'center', justifyContent: 'center', padding: 8 },
  skeletonBlock: { gap: 12, marginBottom: spacing.lg },
  tallyCard: { gap: 0, marginBottom: spacing.xl, padding: spacing.lg },
  bigRow: { alignItems: 'baseline', flexDirection: 'row', gap: 12 },
  bigNumber: { ...type.display, color: palette.primary, fontSize: 52, lineHeight: 56 },
  bigUnit: { fontSize: 28, lineHeight: 32 },
  bigLabel: { ...type.body, color: palette.body, flex: 1, fontSize: 16 },
  tallyDivider: { backgroundColor: palette.line, height: 1, marginVertical: spacing.md },
  estimateNote: { ...type.body, color: palette.muted, fontSize: 13, lineHeight: 19, marginTop: spacing.md },
  chartCard: { marginBottom: spacing.xl, padding: spacing.lg },
  chartEmpty: { ...type.body, color: palette.body, textAlign: 'center' },
  bars: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
    minHeight: 168,
  },
  barCol: { alignItems: 'center', flex: 1, gap: 6, justifyContent: 'flex-end' },
  barCount: { color: palette.muted, fontSize: 13, fontWeight: '800' },
  barCountToday: { color: palette.primary },
  bar: { borderRadius: 8, width: '70%' },
  barLabel: { color: palette.muted, fontSize: 11, fontWeight: '700' },
  barLabelToday: { color: palette.primary },
  splitCard: { gap: 16, marginBottom: spacing.xl, padding: spacing.lg },
  splitRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  splitGlyph: { fontSize: 20, width: 28 },
  splitMain: { flex: 1 },
  splitHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  splitName: { ...type.bodyStrong, color: palette.ink },
  splitCount: { ...type.body, color: palette.body, fontWeight: '700' },
  splitTrack: {
    backgroundColor: palette.primaryPale,
    borderRadius: radii.pill,
    height: 10,
    overflow: 'hidden',
  },
  splitFill: { borderRadius: radii.pill, height: 10 },
  demoCard: { gap: 8, marginBottom: spacing.xl, padding: spacing.lg },
  demoTitle: { ...type.subtitle, color: palette.ink },
  demoBody: { ...type.body, color: palette.body, fontSize: 15, lineHeight: 23 },
  demoLink: { marginTop: 4 },
  demoLinkText: { ...type.bodyStrong, color: palette.primary },
});
