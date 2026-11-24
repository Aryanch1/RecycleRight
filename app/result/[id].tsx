import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  AccentButton,
  AiBadge,
  Card,
  EmptyState,
  GhostButton,
  IconButton,
  PrimaryButton,
} from '../../components/ui';
import { useApp } from '../../lib/store';
import { palette, radii, spacing, type, useResponsive } from '../../lib/theme';
import { streamMeta, type AiSource, type GuideItem, type SortResult, type Stream } from '../../lib/types';

/** Honest fallback prep + drop-off per stream when no guide entry matches. */
const STREAM_DEFAULTS: Record<Stream, { prep: string[]; dropoff: string }> = {
  recycle: {
    prep: ['Rinse it out', 'Take the lid off if it is a different material', 'Flatten it if you can'],
    dropoff: 'Curbside blue bin',
  },
  compost: {
    prep: ['Scrape food into the compost bin', 'No plastic, foil, or packaging'],
    dropoff: 'Curbside green bin or compost heap',
  },
  trash: {
    prep: ['Bag it so it does not spill', 'Check nothing hazardous is mixed in'],
    dropoff: 'Curbside trash bin',
  },
  hazard: {
    prep: ['Keep it in its original container', 'Do not pour it down a drain', 'Keep it away from children and pets'],
    dropoff: 'Household hazardous waste drop-off',
  },
  donate: {
    prep: ['Clean it up', 'Check it still works', 'Bag or box it for handover'],
    dropoff: 'Local donation point or charity shop',
  },
};

interface Verdict {
  item: string;
  stream: Stream;
  confidence: number;
  why: string;
  prep: string[];
  dropoff: string;
  source: AiSource;
  guideId?: string;
}

function parsePrep(raw: string | undefined): string[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((p) => typeof p === 'string')) return parsed;
  } catch {
    return null;
  }
  return null;
}

function verdictFromGuide(item: string, stream: Stream, guide: GuideItem, source: AiSource): Verdict {
  return {
    item,
    stream,
    confidence: 90,
    why: guide.why,
    prep: guide.prep,
    dropoff: guide.dropoff,
    source,
    guideId: guide.id,
  };
}

function verdictFromStream(item: string, stream: Stream, source: AiSource): Verdict {
  const defaults = STREAM_DEFAULTS[stream];
  return {
    item,
    stream,
    confidence: 70,
    why: streamMeta(stream).blurb,
    prep: defaults.prep,
    dropoff: defaults.dropoff,
    source,
  };
}

/**
 * Full-screen takeover for one scan: a big colored verdict banner in the
 * stream color, the why, numbered prep steps, drop-off info, and the
 * "Sorted — log it" action. Works for demo seed scans (demo-scan-0..4),
 * freshly sorted scans (verdict arrives as route params), and logged
 * scans re-opened from the recent-scans feed.
 */
export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    item?: string;
    stream?: string;
    why?: string;
    prep?: string;
    dropoff?: string;
    confidence?: string;
    source?: string;
    guideId?: string;
  }>();
  const { scanById, guideById, guideItems, logScan, scans } = useApp();
  const r = useResponsive();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [justLogged, setJustLogged] = useState(false);
  const [tallyY, setTallyY] = useState(0);

  const id = typeof params.id === 'string' ? params.id : '';
  const scan = scanById(id);

  // Resolve the verdict: route params first (fresh sort), then the
  // matching guide entry for the scanned item, then honest stream
  // defaults so a seed or logged scan always has something to show.
  let verdict: Verdict | null = null;
  if (scan) {
    const paramPrep = parsePrep(params.prep);
    if (params.why && params.dropoff) {
      verdict = {
        item: scan.item,
        stream: scan.stream,
        confidence: Number(params.confidence) || 80,
        why: params.why,
        prep: paramPrep ?? STREAM_DEFAULTS[scan.stream].prep,
        dropoff: params.dropoff,
        source: params.source === 'live' ? 'live' : 'demo',
        guideId: params.guideId || undefined,
      };
    } else {
      const lowered = scan.item.trim().toLowerCase();
      const guide = guideItems.find(
        (g) => g.name.toLowerCase() === lowered || g.keywords.includes(lowered),
      );
      verdict = guide
        ? verdictFromGuide(scan.item, scan.stream, guide, scan.source)
        : verdictFromStream(scan.item, scan.stream, scan.source);
    }
  } else if (params.item && params.why && params.dropoff) {
    // A fresh sort whose record is not in the store yet (e.g. a deep
    // link carrying the verdict): show it unlogged so "Sorted — log it"
    // can still file it.
    const paramStream = (['recycle', 'compost', 'trash', 'hazard', 'donate'] as const).find(
      (s) => s === params.stream,
    );
    if (paramStream) {
      verdict = {
        item: params.item,
        stream: paramStream,
        confidence: Number(params.confidence) || 80,
        why: params.why,
        prep: parsePrep(params.prep) ?? STREAM_DEFAULTS[paramStream].prep,
        dropoff: params.dropoff,
        source: params.source === 'live' ? 'live' : 'demo',
        guideId: params.guideId || undefined,
      };
    }
  }

  const guide = verdict?.guideId ? guideById(verdict.guideId) : undefined;
  const logged = !!scan || justLogged;
  const tallyCount = scans.length;

  const handleLog = () => {
    if (!verdict || logged) return;
    const result: SortResult = {
      item: verdict.item,
      stream: verdict.stream,
      confidence: verdict.confidence,
      why: verdict.why,
      prep: verdict.prep,
      dropoff: verdict.dropoff,
      source: verdict.source,
      guideId: verdict.guideId,
    };
    logScan(result);
    setJustLogged(true);
    // Confirm where the user is looking: scroll the tally note into view.
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, tallyY - 16), animated: true });
    }, 120);
  };

  if (!verdict) {
    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingHorizontal: r.pad }]}>
          <EmptyState
            glyph="🔍"
            title="We could not find that scan"
            body="It may have been cleared. Sort something new and the verdict will show up here."
            actionLabel="Back to Scan"
            onAction={() => router.replace('/')}
          />
        </ScrollView>
      </View>
    );
  }

  const meta = streamMeta(verdict.stream);

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scroll, { paddingHorizontal: r.pad }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <View style={styles.headerRow}>
            <IconButton label="←" onPress={() => router.back()} />
            <Text style={styles.headerTitle}>Your verdict</Text>
            <View style={styles.headerSpacer} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(70).springify()}>
          <View style={[styles.banner, { backgroundColor: meta.color }]}>
            <Text style={styles.bannerGlyph}>{meta.glyph}</Text>
            <Text style={styles.bannerKicker}>GOES IN</Text>
            <Text style={styles.bannerStream}>{meta.name}</Text>
            <Text style={styles.bannerItem}>{verdict.item}</Text>
            <View style={styles.bannerBadge}>
              <AiBadge source={verdict.source} />
              <Text style={styles.bannerConfidence}>{verdict.confidence}% sure</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <Card style={styles.section}>
            <Text style={styles.sectionLabel}>WHY IT GOES HERE</Text>
            <Text style={styles.why}>{verdict.why}</Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(170).springify()}>
          <Card style={styles.section}>
            <Text style={styles.sectionLabel}>PREP IT FIRST</Text>
            {verdict.prep.map((step, i) => (
              <View key={`${i}-${step}`} style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: meta.soft }]}>
                  <Text style={[styles.stepNumberText, { color: meta.color }]}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).springify()}>
          <Card style={styles.section}>
            <Text style={styles.sectionLabel}>WHERE TO TAKE IT</Text>
            <Text style={styles.dropoff}>📍 {verdict.dropoff}</Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).springify()}>
          <View style={styles.actions}>
            {logged ? (
              <PrimaryButton label="Logged ✓" onPress={() => undefined} disabled />
            ) : (
              <AccentButton label="Sorted — log it" onPress={handleLog} />
            )}
            <GhostButton label="Sort something else" onPress={() => router.replace('/')} />
            {guide ? (
              <GhostButton
                label={`See it in the Guide: ${guide.name}`}
                onPress={() =>
                  router.push({
                    pathname: '/guide',
                    params: { stream: verdict.stream, guideId: guide.id },
                  })
                }
              />
            ) : null}
          </View>
        </Animated.View>

        <View
          onLayout={(e) => setTallyY(e.nativeEvent.layout.y)}
          style={[styles.tally, justLogged && styles.tallyHighlighted]}
        >
          <Text style={styles.tallyText}>
            {logged
              ? `✓ In your tally — ${tallyCount} item${tallyCount === 1 ? '' : 's'} sorted.`
              : 'Not logged yet — tap “Sorted — log it” to add it to your tally.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: palette.ground, flex: 1 },
  scroll: { paddingBottom: 24, paddingTop: 20, width: '100%' },
  headerRow: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  headerTitle: { ...type.title, color: palette.ink, fontSize: 22 },
  headerSpacer: { width: 44 },
  banner: {
    borderRadius: radii.card,
    gap: 4,
    padding: spacing.lg,
  },
  bannerGlyph: { fontSize: 48 },
  bannerKicker: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  bannerStream: { color: '#FFFFFF', fontFamily: 'Bitter_800ExtraBold', fontSize: 40, lineHeight: 44 },
  bannerItem: { color: 'rgba(255,255,255,0.9)', fontSize: 17, fontWeight: '600' },
  bannerBadge: { alignItems: 'center', flexDirection: 'row', gap: 10, marginTop: 8 },
  bannerConfidence: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  section: { gap: 10, marginTop: spacing.md },
  sectionLabel: { ...type.label, color: palette.body },
  why: { ...type.body, color: palette.ink, fontSize: 16, lineHeight: 25 },
  stepRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  stepNumber: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  stepNumberText: { fontSize: 15, fontWeight: '800' },
  stepText: { ...type.body, color: palette.ink, flex: 1, fontSize: 16, lineHeight: 24 },
  dropoff: { ...type.bodyStrong, color: palette.ink, fontSize: 16 },
  actions: { gap: 12, marginTop: spacing.lg },
  tally: {
    alignItems: 'center',
    borderRadius: radii.md,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  tallyHighlighted: { backgroundColor: palette.leafSoft },
  tallyText: { ...type.bodyStrong, color: palette.primary, textAlign: 'center' },
});
