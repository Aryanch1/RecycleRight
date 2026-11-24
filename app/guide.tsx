import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { EmptyState, GlassCard, SectionHeader, SpringPress } from '../components/ui';
import { useApp } from '../lib/store';
import { palette, radii, spacing, streamColors, type, useResponsive } from '../lib/theme';
import { STREAMS, streamGlyph, streamName, type GuideItem, type Stream } from '../lib/types';

type StreamFilter = 'all' | Stream;

function isStream(value: string | undefined): value is Stream {
  return STREAMS.some((s) => s.stream === value);
}

/** One stream filter chip — glyph + name, filled with the stream color when on. */
function StreamChip({
  label,
  glyph,
  color,
  selected,
  onPress,
}: {
  label: string;
  glyph: string;
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <SpringPress onPress={onPress} haptic>
      <View
        style={[
          styles.chip,
          { backgroundColor: selected ? color : palette.surface, borderColor: selected ? color : palette.line },
        ]}
      >
        <Text style={styles.chipGlyph}>{glyph}</Text>
        <Text style={[styles.chipLabel, { color: selected ? '#FFFFFF' : palette.ink }]}>{label}</Text>
      </View>
    </SpringPress>
  );
}

/** The verdict detail for one guide item — same layout as the result screen. */
function ItemDetail({ item, onClose }: { item: GuideItem; onClose: () => void }) {
  const colors = streamColors[item.stream];
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailScroll}>
      <Animated.View entering={FadeInDown.springify()}>
        <View style={[styles.banner, { backgroundColor: colors.color }]}>
          <Text style={styles.bannerGlyph}>{streamGlyph(item.stream)}</Text>
          <Text style={styles.bannerStream}>{streamName(item.stream).toUpperCase()}</Text>
          <Text style={styles.bannerName}>{item.name}</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(70).springify()}>
        <SectionHeader kicker="Why this bin" title="Why it goes here" />
        <Text style={styles.why}>{item.why}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).springify()}>
        <SectionHeader kicker="Before you bin it" title="Prep steps" />
        {item.prep.length === 0 ? (
          <Text style={styles.why}>No prep needed — it is ready to go as it is.</Text>
        ) : (
          item.prep.map((step, i) => (
            <View key={`${item.id}-prep-${i}`} style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: colors.soft }]}>
                <Text style={[styles.stepNumberText, { color: colors.color }]}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(170).springify()}>
        <SectionHeader kicker="Where it goes" title="Drop-off" />
        <GlassCard style={styles.dropoffCard}>
          <Text style={styles.dropoffGlyph}>📍</Text>
          <Text style={styles.dropoffText}>{item.dropoff}</Text>
        </GlassCard>
      </Animated.View>

      <View style={styles.detailClose}>
        <SpringPress onPress={onClose} haptic>
          <View style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Back to the guide</Text>
          </View>
        </SpringPress>
      </View>
    </ScrollView>
  );
}

/**
 * Guide — searchable "what goes where". Search filters by name +
 * keywords, stream chips filter by bin, rows open the full verdict
 * detail. Home quick-chips land here with ?stream=recycle (and the
 * other four streams). Tapping a row records it in history for
 * one-tap re-use. On >=840dp the list sits left and the detail
 * sits right.
 */
export default function GuideScreen() {
  const { guideItems, recordHistory } = useApp();
  const r = useResponsive();
  const params = useLocalSearchParams<{ stream?: string | string[] }>();
  const paramStream = Array.isArray(params.stream) ? params.stream[0] : params.stream;

  const [query, setQuery] = useState('');
  const [streamFilter, setStreamFilter] = useState<StreamFilter>(
    isStream(paramStream) ? paramStream : 'all',
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // A fresh ?stream=... landing (e.g. a home quick-chip) re-filters the
  // list. State is adjusted during render when the param changes — the
  // documented pattern for syncing state to a changing prop, not an effect.
  const [prevParam, setPrevParam] = useState(paramStream);
  if (prevParam !== paramStream) {
    setPrevParam(paramStream);
    if (isStream(paramStream)) {
      setStreamFilter(paramStream);
      setSelectedId(null);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guideItems
      .filter((item) => (streamFilter === 'all' ? true : item.stream === streamFilter))
      .filter(
        (item) =>
          q === '' ||
          item.name.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q)),
      )
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [guideItems, query, streamFilter]);

  const selected = guideItems.find((item) => item.id === selectedId) ?? null;
  const isFiltered = query.trim() !== '' || streamFilter !== 'all';
  const countLabel = isFiltered
    ? `${filtered.length} of ${guideItems.length} items`
    : `${guideItems.length} items`;

  const openItem = (item: GuideItem) => {
    setSelectedId(item.id);
    recordHistory({ item: item.name, stream: item.stream, kind: 'guide' });
  };

  const clearSearch = () => {
    setQuery('');
    setStreamFilter('all');
    setSelectedId(null);
  };

  const list = (
    <View>
      <Animated.View entering={FadeInDown.springify()}>
        <SectionHeader kicker="Guide" title="What goes where" />
        <Text style={styles.intro}>
          Every item, A to Z, with the bin it belongs in and the prep it needs first.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(70).springify()}>
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setSelectedId(null);
          }}
          placeholder="Search an item — bottle, peel, battery…"
          placeholderTextColor={palette.muted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).springify()}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <StreamChip
            label="All"
            glyph="🔍"
            color={palette.primary}
            selected={streamFilter === 'all'}
            onPress={() => setStreamFilter('all')}
          />
          {STREAMS.map((s) => (
            <StreamChip
              key={s.stream}
              label={s.name}
              glyph={s.glyph}
              color={s.color}
              selected={streamFilter === s.stream}
              onPress={() => setStreamFilter(s.stream)}
            />
          ))}
        </ScrollView>
        <Text style={styles.count}>{countLabel}</Text>
      </Animated.View>

      {filtered.length === 0 ? (
        <EmptyState
          glyph="🔍"
          title="Nothing matches that"
          body="Try a simpler word — “bottle” instead of “plastic water bottle” — or clear the search and browse the full list."
          actionLabel="Clear search"
          onAction={clearSearch}
        />
      ) : (
        filtered.map((item, i) => {
          const colors = streamColors[item.stream];
          return (
            <Animated.View key={item.id} entering={FadeInDown.delay(160 + Math.min(i, 8) * 40).springify()}>
              <SpringPress
                onPress={() => openItem(item)}
                haptic
              >
                <View style={styles.row}>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.rowWhy} numberOfLines={1}>
                      {item.why}
                    </Text>
                  </View>
                  <View style={[styles.streamPill, { backgroundColor: colors.soft }]}>
                    <Text style={styles.streamPillGlyph}>{streamGlyph(item.stream)}</Text>
                    <Text style={[styles.streamPillText, { color: colors.color }]}>
                      {streamName(item.stream)}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </SpringPress>
            </Animated.View>
          );
        })
      )}
    </View>
  );

  // Narrow screens: the detail is a full-screen takeover over the list.
  if (selected && !r.twoPane) {
    return (
      <View style={[styles.root, { backgroundColor: palette.ground }]}>
        <View style={[styles.takeover, { paddingHorizontal: r.pad }]}>
          <ItemDetail item={selected} onClose={() => setSelectedId(null)} />
        </View>
      </View>
    );
  }

  // Wide screens (>=840dp): list left, detail right.
  if (r.twoPane) {
    return (
      <View style={[styles.root, { backgroundColor: palette.ground }]}>
        <View style={[styles.twoPane, { maxWidth: r.contentMaxWidth, alignSelf: 'center' }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.paneScroll, { paddingHorizontal: r.pad }]}
            style={styles.paneLeft}
          >
            {list}
          </ScrollView>
          <View style={styles.paneRight}>
            {selected ? (
              <GlassCard style={styles.detailCard}>
                <ItemDetail item={selected} onClose={() => setSelectedId(null)} />
              </GlassCard>
            ) : (
              <EmptyState
                glyph="♻️"
                title="Pick an item"
                body="Tap any row in the guide to see which bin it belongs in, why, and what to do first."
              />
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: palette.ground }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingHorizontal: r.pad, maxWidth: r.contentMaxWidth, alignSelf: 'center' }]}
      >
        {list}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 48, paddingTop: 20, width: '100%' },
  intro: { ...type.body, color: palette.body, fontSize: 16, lineHeight: 25, marginBottom: spacing.lg },
  search: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: radii.input,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 16,
    marginBottom: spacing.md,
    minHeight: 56,
    paddingHorizontal: 18,
  },
  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: {
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipGlyph: { fontSize: 15 },
  chipLabel: { fontSize: 15, fontWeight: '700' },
  count: { ...type.caption, color: palette.muted, marginBottom: spacing.md, marginTop: spacing.sm },
  row: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  rowMain: { flex: 1, minWidth: 0 },
  rowName: { ...type.bodyStrong, color: palette.ink, fontSize: 16 },
  rowWhy: { ...type.body, color: palette.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  streamPill: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  streamPillGlyph: { fontSize: 13 },
  streamPillText: { fontSize: 12, fontWeight: '800' },
  chevron: { color: palette.muted, fontSize: 24, fontWeight: '700' },
  takeover: { flex: 1, paddingBottom: 24, paddingTop: 20 },
  twoPane: { flex: 1, flexDirection: 'row', width: '100%' },
  paneLeft: { flex: 1.15, minWidth: 0 },
  paneScroll: { paddingBottom: 48, paddingTop: 20 },
  paneRight: { flex: 1, minWidth: 0, padding: 20 },
  detailCard: { flex: 1, padding: spacing.md },
  detailScroll: { paddingBottom: 24 },
  banner: {
    borderRadius: radii.card,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  bannerGlyph: { fontSize: 44, marginBottom: spacing.sm },
  bannerStream: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  bannerName: { ...type.display, color: '#FFFFFF', fontSize: 32, lineHeight: 36, marginTop: 4 },
  why: { ...type.body, color: palette.body, fontSize: 16, lineHeight: 25, marginBottom: spacing.lg },
  stepRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  stepNumber: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  stepNumberText: { fontSize: 15, fontWeight: '800' },
  stepText: { ...type.body, color: palette.ink, flex: 1, fontSize: 16, lineHeight: 24 },
  dropoffCard: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  dropoffGlyph: { fontSize: 20 },
  dropoffText: { ...type.body, color: palette.ink, flex: 1, fontSize: 16, lineHeight: 24 },
  detailClose: { marginTop: spacing.sm },
  closeButton: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: 56,
  },
  closeButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
