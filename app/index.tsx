import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { RecycleRefresh, RefreshButton } from '../components/RecycleRefresh';
import {
  AiBadge,
  AppInput,
  Card,
  EmptyState,
  GhostButton,
  PrimaryButton,
  Skeleton,
  SpringPress,
  StreamBadge,
  StreamChip,
} from '../components/ui';
import { useApp } from '../lib/store';
import { palette, radii, spacing, type, useResponsive } from '../lib/theme';
import { STREAMS, streamGlyph, streamMeta, type AiSource, type ScanRecord } from '../lib/types';

function timeAgo(at: number): string {
  const mins = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

/**
 * Home — scan first. A typographic display headline ("Where does this
 * go?"), one big pine scan tile, a "type an item" field, stream
 * quick-chips that jump to the Guide filtered by that stream, then the
 * recent-scans feed. On ≥840dp the screen splits: scan column left,
 * recent scans right. No photo hero, no dashboard grid, no ring.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { visibleScans, sortItem, logScan } = useApp();
  const r = useResponsive();
  const [query, setQuery] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [sorting, setSorting] = useState(false);
  const [sortError, setSortError] = useState<string | null>(null);
  const [lastSource, setLastSource] = useState<AiSource>('demo');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Refresh is light: re-read the scans from the store and replay the
    // recycling loop, then let the cards re-enter with a stagger.
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  const pickImage = async (from: 'camera' | 'library') => {
    setSortError(null);
    try {
      if (from === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setSortError('Camera access is off — type the item instead, or allow the camera and try again.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          base64: true,
        });
        if (result.canceled || !result.assets[0]) return;
        const asset = result.assets[0];
        setPhotoUri(asset.uri);
        setPhoto(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null);
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setSortError('Photo library access is off — type the item instead, or allow access and try again.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          base64: true,
        });
        if (result.canceled || !result.assets[0]) return;
        const asset = result.assets[0];
        setPhotoUri(asset.uri);
        setPhoto(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null);
      }
    } catch {
      setSortError('Could not open the picker. Type the item instead.');
    }
  };

  const doSort = async () => {
    const item = query.trim();
    if (!item) {
      setSortError('Tell us what it is first — type the item above.');
      return;
    }
    setSorting(true);
    setSortError(null);
    try {
      const result = await sortItem(item, photo ?? undefined);
      setLastSource(result.source);
      const record = logScan(result);
      setPhoto(null);
      setPhotoUri(null);
      setQuery('');
      router.push({
        pathname: '/result/[id]',
        params: {
          id: record.id,
          item: result.item,
          stream: result.stream,
          why: result.why,
          prep: JSON.stringify(result.prep),
          dropoff: result.dropoff,
          confidence: String(result.confidence),
          source: result.source,
          guideId: result.guideId ?? '',
        },
      });
    } catch {
      setSortError('Could not sort that just now. Check your connection and try again.');
    } finally {
      setSorting(false);
    }
  };

  const openScan = (scan: ScanRecord) => {
    router.push(`/result/${scan.id}`);
  };

  const scanColumn = (
    <View>
      <Animated.View entering={FadeInDown.springify()}>
        <View style={styles.heroRow}>
          <View style={styles.heroText}>
            <Text style={styles.kicker}>RECYCLERIGHT · SORT FIRST</Text>
            <Text style={[styles.heroTitle, r.display]}>Where does{'\n'}this go?</Text>
            <Text style={styles.heroBody}>
              Snap it or type it — RecycleRight tells you which bin it belongs in, why, and how
              to prep it.
            </Text>
          </View>
          {Platform.OS === 'web' ? (
            <View style={styles.refreshWrap}>
              <RefreshButton refreshing={refreshing} onPress={onRefresh} />
            </View>
          ) : null}
        </View>
        <View style={styles.badgeRow}>
          <AiBadge source={lastSource} />
          <Text style={styles.badgeNote}>
            {lastSource === 'live'
              ? 'Last sort used live AI.'
              : 'Last sort used the on-device demo sorter.'}
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(70).springify()}>
        <SpringPress
          onPress={() => void pickImage(Platform.OS === 'web' ? 'library' : 'camera')}
          haptic
        >
          <LinearGradient
            colors={[palette.primaryLight, palette.primaryDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scanTile}
          >
            <Text style={styles.scanGlyph}>📷</Text>
            <Text style={styles.scanTitle}>Scan an item</Text>
            <Text style={styles.scanBody}>
              {Platform.OS === 'web'
                ? 'Pick a photo from your library.'
                : 'Take a photo, or pick one from your library.'}
            </Text>
            <View style={styles.scanActions}>
              {Platform.OS !== 'web' ? (
                <View style={styles.scanAction}>
                  <Text style={styles.scanActionText}>Take a photo</Text>
                </View>
              ) : null}
              <SpringPress
                onPress={() => void pickImage('library')}
                haptic
              >
                <View style={styles.scanAction}>
                  <Text style={styles.scanActionText}>Choose from library</Text>
                </View>
              </SpringPress>
            </View>
          </LinearGradient>
        </SpringPress>
      </Animated.View>

      {photoUri ? (
        <Animated.View entering={FadeInDown.springify()}>
          <Card style={styles.photoCard}>
            <Image source={{ uri: photoUri }} style={styles.photoThumb} />
            <Text style={styles.photoTitle}>What is this?</Text>
            <AppInput
              value={query}
              onChangeText={setQuery}
              placeholder="e.g. plastic bottle"
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={() => void doSort()}
            />
            <View style={styles.photoActions}>
              <PrimaryButton label="Sort it" onPress={() => void doSort()} loading={sorting} />
              <GhostButton
                label="Use a different photo"
                onPress={() => {
                  setPhoto(null);
                  setPhotoUri(null);
                }}
              />
            </View>
          </Card>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(120).springify()}>
        <Card style={styles.typeCard}>
          <Text style={styles.typeLabel}>OR TYPE AN ITEM</Text>
          <AppInput
            value={query}
            onChangeText={setQuery}
            placeholder="e.g. greasy pizza box"
            autoCapitalize="none"
            returnKeyType="go"
            onSubmitEditing={() => void doSort()}
          />
          <PrimaryButton label="Sort it" onPress={() => void doSort()} loading={sorting} />
          {sortError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{sortError}</Text>
              <GhostButton label="Try again" onPress={() => void doSort()} />
            </View>
          ) : null}
        </Card>
      </Animated.View>

      {sorting ? (
        <Card style={styles.sortingCard}>
          <Skeleton width="60%" height={22} />
          <Skeleton width="100%" height={14} />
          <Skeleton width="85%" height={14} />
          <Text style={styles.sortingText}>Sorting your item…</Text>
        </Card>
      ) : null}

      <Animated.View entering={FadeInDown.delay(170).springify()}>
        <Text style={styles.sectionTitle}>Jump to a stream</Text>
        <View style={styles.chipRow}>
          {STREAMS.map((s) => (
            <StreamChip
              key={s.stream}
              stream={s.stream}
              onPress={() => router.push({ pathname: '/guide', params: { stream: s.stream } })}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );

  const feed = (
    <View key={refreshKey}>
      <Text style={styles.sectionTitle}>Recent scans</Text>
      {visibleScans.length === 0 ? (
        <EmptyState
          glyph="♻️"
          title="No scans yet"
          body="Sort your first item above — snap it or type it — and it will show up here."
        />
      ) : (
        visibleScans.map((scan, i) => {
          const meta = streamMeta(scan.stream);
          return (
            <Animated.View key={scan.id} entering={FadeInDown.delay(i * 60).springify()}>
              <SpringPress onPress={() => openScan(scan)} haptic>
                <Card style={styles.scanCard}>
                  <View style={[styles.scanGlyphCircle, { backgroundColor: meta.soft }]}>
                    <Text style={styles.scanCardGlyph}>{streamGlyph(scan.stream)}</Text>
                  </View>
                  <View style={styles.scanCardText}>
                    <Text style={styles.scanCardItem} numberOfLines={1}>
                      {scan.item}
                    </Text>
                    <Text style={styles.scanCardMeta}>
                      Goes in: {meta.name} · {timeAgo(scan.at)}
                    </Text>
                  </View>
                  <StreamBadge stream={scan.stream} />
                </Card>
              </SpringPress>
            </Animated.View>
          );
        })
      )}
    </View>
  );

  if (r.twoPane) {
    return (
      <View style={styles.root}>
        <View style={[styles.twoPane, { maxWidth: r.contentMaxWidth, alignSelf: 'center' }]}>
          <View style={styles.paneLeft}>
            <RecycleRefresh refreshing={refreshing} onRefresh={onRefresh}>
              <View style={[styles.scrollPad, { paddingHorizontal: r.pad }]}>
                {scanColumn}
              </View>
            </RecycleRefresh>
          </View>
          <View style={styles.paneRight}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.scrollPad, { paddingHorizontal: r.pad }]}>{feed}</View>
            </ScrollView>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <RecycleRefresh refreshing={refreshing} onRefresh={onRefresh}>
        <View style={[styles.scrollPad, { paddingHorizontal: r.pad }]}>
          {scanColumn}
          {feed}
        </View>
      </RecycleRefresh>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: palette.ground, flex: 1 },
  scrollPad: { paddingBottom: 24, paddingTop: 20, width: '100%' },
  heroRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  heroText: { flex: 1 },
  kicker: { ...type.label, color: palette.leaf, marginBottom: 8 },
  heroTitle: { color: palette.ink, marginBottom: 10 },
  heroBody: { ...type.body, color: palette.body, fontSize: 16, lineHeight: 25, marginBottom: spacing.md },
  refreshWrap: { alignItems: 'center', justifyContent: 'center', padding: 4 },
  badgeRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  badgeNote: { ...type.caption, color: palette.muted },
  scanTile: {
    borderRadius: radii.card,
    gap: 6,
    minHeight: 220,
    padding: spacing.lg,
  },
  scanGlyph: { fontSize: 44 },
  scanTitle: { ...type.title, color: '#FFFFFF' },
  scanBody: { ...type.body, color: 'rgba(255,255,255,0.85)', fontSize: 16, lineHeight: 24 },
  scanActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.md },
  scanAction: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  scanActionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  photoCard: { gap: 12, marginTop: spacing.md },
  photoThumb: { borderRadius: radii.md, height: 180, width: '100%' },
  photoTitle: { ...type.title, color: palette.ink, fontSize: 20 },
  photoActions: { gap: 10 },
  typeCard: { gap: 12, marginTop: spacing.md },
  typeLabel: { ...type.label, color: palette.body },
  errorBox: { alignItems: 'center', gap: 10 },
  errorText: { ...type.bodyStrong, color: palette.error, textAlign: 'center' },
  sortingCard: { gap: 10, marginTop: spacing.md },
  sortingText: { ...type.bodyStrong, color: palette.primary, textAlign: 'center' },
  sectionTitle: { ...type.title, color: palette.ink, marginBottom: spacing.md, marginTop: spacing.xl },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scanCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.md,
  },
  scanGlyphCircle: {
    alignItems: 'center',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  scanCardGlyph: { fontSize: 26 },
  scanCardText: { flex: 1, minWidth: 0 },
  scanCardItem: { ...type.subtitle, color: palette.ink },
  scanCardMeta: { ...type.caption, color: palette.muted, marginTop: 2 },
  twoPane: { flex: 1, flexDirection: 'row', width: '100%' },
  paneLeft: { flex: 1.1, minWidth: 0 },
  paneRight: { flex: 1, minWidth: 0 },
});
