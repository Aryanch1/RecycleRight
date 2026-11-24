import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { palette, radii, shadows, spacing, streamColors, type } from '../lib/theme';
import { streamMeta, type AiSource, type Stream } from '../lib/types';

/** Light haptic tap on primary actions (mobile only, silent on web). */
export function tap() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }
}

/* ------------------------------------------------------------------ */
/* Pressable wrapper: spring scale to ~0.95 with overshoot on press.  */
/* ------------------------------------------------------------------ */

export function SpringPress({
  children,
  onPress,
  disabled,
  style,
  haptic = false,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: object;
  haptic?: boolean;
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        if (haptic) tap();
        onPress?.();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 14, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 300 });
      }}
      style={[{ opacity: disabled ? 0.45 : 1 }, style]}
    >
      <Animated.View style={animated}>{children}</Animated.View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  sub,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  sub?: string;
}) {
  return (
    <SpringPress onPress={onPress} disabled={disabled || loading} haptic>
      <LinearGradient
        colors={[palette.primaryLight, palette.primaryDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.primary, shadows.glow, (disabled || loading) && styles.primaryDisabled]}
      >
        {loading ? (
          <BouncingDots color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryLabel}>
            {label}
            {sub ? `  ·  ${sub}` : ''}
          </Text>
        )}
      </LinearGradient>
    </SpringPress>
  );
}

/** Soft pine secondary — pale pine fill, deep pine text. */
export function SecondaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <SpringPress onPress={onPress} disabled={disabled || loading} haptic>
      <View style={[styles.primary, styles.secondary, (disabled || loading) && styles.primaryDisabled]}>
        {loading ? (
          <BouncingDots color={palette.primary} />
        ) : (
          <Text style={styles.secondaryLabel}>{label}</Text>
        )}
      </View>
    </SpringPress>
  );
}

export function GhostButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <SpringPress onPress={onPress} disabled={disabled}>
      <View style={styles.ghost}>
        <Text style={styles.ghostLabel}>{label}</Text>
      </View>
    </SpringPress>
  );
}

/** Leaf CTA — the warm action on detail screens. Leaf gradient, white text. */
export function AccentButton({
  label,
  onPress,
  loading,
  disabled,
  sub,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  sub?: string;
}) {
  return (
    <SpringPress onPress={onPress} disabled={disabled || loading} haptic>
      <LinearGradient
        colors={[palette.leaf, palette.leafDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.primary, shadows.leafGlow, (disabled || loading) && styles.primaryDisabled]}
      >
        {loading ? (
          <BouncingDots color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryLabel}>
            {label}
            {sub ? `  ·  ${sub}` : ''}
          </Text>
        )}
      </LinearGradient>
    </SpringPress>
  );
}

/** Circular icon button in a soft circle — used in headers and sheets. */
export function IconButton({
  label,
  onPress,
  active,
  disabled,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <SpringPress onPress={onPress} disabled={disabled} haptic>
      <View style={[styles.iconButton, active && styles.iconButtonActive]}>
        <Text style={[styles.iconButtonLabel, active && styles.iconButtonLabelActive]}>{label}</Text>
      </View>
    </SpringPress>
  );
}

/** Circular avatar — initial letter on a cycled stream color. */
const AVATAR_COLORS = [
  streamColors.recycle.color,
  streamColors.compost.color,
  streamColors.donate.color,
  palette.primary,
  palette.leaf,
];

export function MemberAvatar({
  member,
  index,
  size = 48,
}: {
  member: { name: string };
  index: number;
  size?: number;
}) {
  const bg = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <View
      style={[
        styles.avatar,
        { backgroundColor: bg, height: size, width: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.42 }]}>
        {(member.name || '?').slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */

export function AppInput({
  label,
  style,
  ...props
}: TextInputProps & { label?: string; style?: object }) {
  return (
    <View style={styles.inputWrap}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={palette.muted}
        {...props}
      />
    </View>
  );
}

/** Alias for the shared text field. */
export const TextField = AppInput;

/* ------------------------------------------------------------------ */
/* Chips — pop (scale bounce) when they become selected.               */
/* ------------------------------------------------------------------ */

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const pop = useSharedValue(1);
  useEffect(() => {
    if (selected) {
      pop.value = withSequence(
        withSpring(1.18, { damping: 10, stiffness: 500 }),
        withSpring(1, { damping: 12, stiffness: 400 }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <Animated.View style={[styles.chip, selected && styles.chipSelected, animated]}>
        <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

/** A waste-stream chip: glyph + name, filled with the stream color when selected. */
export function StreamChip({
  stream,
  selected,
  onPress,
}: {
  stream: Stream;
  selected?: boolean;
  onPress: () => void;
}) {
  const meta = streamMeta(stream);
  return (
    <SpringPress onPress={onPress} haptic>
      <View
        style={[
          styles.streamChip,
          { borderColor: meta.color },
          selected && { backgroundColor: meta.color, ...shadows.card },
        ]}
      >
        <Text style={styles.streamChipGlyph}>{meta.glyph}</Text>
        <Text style={[styles.streamChipLabel, selected && styles.streamChipLabelSelected]}>
          {meta.name}
        </Text>
      </View>
    </SpringPress>
  );
}

/** A colored stream pill: glyph + stream name in the stream's own color. */
export function StreamBadge({ stream }: { stream: Stream }) {
  const meta = streamMeta(stream);
  return (
    <View style={[styles.streamBadge, { backgroundColor: meta.soft }]}>
      <Text style={styles.streamBadgeGlyph}>{meta.glyph}</Text>
      <Text style={[styles.streamBadgeText, { color: meta.color }]}>{meta.name}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

/** Plain white card — 28px radii, soft shadow, kraft-friendly. */
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function GlassCard({
  children,
  style,
  intensity = 18,
  flush = false,
}: {
  children: React.ReactNode;
  style?: object;
  intensity?: number;
  /** Flush removes the inner padding so children can bleed to the
   * card's edges; the child then pads its own content. */
  flush?: boolean;
}) {
  // Two layers on purpose: the outer view carries the background and the
  // shadow (Android elevation needs a real background, and a shadow on a
  // clipped view renders as a hard white plate offset behind the card).
  // The inner view clips the content to the rounded shape. Real backdrop
  // blur is web-only; on native the translucent surface over the kraft
  // ground reads as frost. The clip layer also carries a near-solid
  // frosted background (palette.sheet) so the card reads as one uniform
  // frosted surface everywhere.
  return (
    <View style={[styles.glassShadow, style]}>
      <View style={styles.glassClip}>
        {Platform.OS === 'web' ? (
          <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
        ) : null}
        <View style={[styles.glassInner, flush && styles.glassInnerFlush]}>{children}</View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Loading & empty states                                              */
/* ------------------------------------------------------------------ */

export function BouncingDots({ color = palette.primary }: { color?: string }) {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);
  useEffect(() => {
    const bounce = (sv: SharedValue<number>, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(-6, { duration: 260 }),
            withTiming(0, { duration: 260 }),
          ),
          -1,
          false,
        ),
      );
    };
    bounce(dot1, 0);
    bounce(dot2, 90);
    bounce(dot3, 180);
  }, [dot1, dot2, dot3]);
  const style1 = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
  const style2 = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
  const style3 = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));
  return (
    <View style={styles.dots}>
      <Animated.View style={[styles.dot, { backgroundColor: color }, style1]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, style2]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, style3]} />
    </View>
  );
}

export function Skeleton({ width, height, radius = radii.md }: { width: number | string; height: number; radius?: number }) {
  const opacity = useSharedValue(0.45);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.9, { duration: 900 }), -1, true);
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: 'rgba(31,42,31,0.08)' }, animated]} />;
}

export function EmptyState({
  glyph,
  title,
  body,
  actionLabel,
  onAction,
}: {
  glyph: string;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.empty}>
      <View style={styles.emptyGlyph}>
        <Text style={styles.emptyGlyphText}>{glyph}</Text>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {actionLabel && onAction ? (
        <View style={styles.emptyAction}>
          <GhostButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </Animated.View>
  );
}

export function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.kicker}>{kicker.toUpperCase()}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export function LiveBadge() {
  return (
    <View style={styles.liveBadge}>
      <Text style={styles.liveBadgeText}>LIVE AI</Text>
    </View>
  );
}

export function DemoBadge() {
  return (
    <View style={styles.demoBadge}>
      <Text style={styles.demoBadgeText}>DEMO</Text>
    </View>
  );
}

/** One badge for the sort source: "LIVE AI" in pine, "DEMO" in caution. */
export function AiBadge({ source }: { source: AiSource }) {
  return source === 'live' ? <LiveBadge /> : <DemoBadge />;
}

const styles = StyleSheet.create({
  primary: {
    alignItems: 'center',
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.lg,
  },
  primaryDisabled: { opacity: 0.55 },
  primaryLabel: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  secondary: { backgroundColor: palette.primarySoft },
  secondaryLabel: { color: palette.primary, fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  ghost: {
    alignItems: 'center',
    backgroundColor: palette.glassStrong,
    borderColor: palette.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  ghostLabel: { color: palette.primary, fontSize: 16, fontWeight: '800' },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: '800' },
  iconButton: {
    alignItems: 'center',
    backgroundColor: palette.glassStrong,
    borderColor: palette.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconButtonActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  iconButtonLabel: { color: palette.ink, fontSize: 18, fontWeight: '700' },
  iconButtonLabelActive: { color: '#FFFFFF' },
  inputWrap: { gap: 6 },
  inputLabel: { ...type.label, color: palette.body },
  input: {
    backgroundColor: palette.primaryPale,
    borderColor: palette.line,
    borderRadius: radii.input,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 18,
  },
  chip: {
    backgroundColor: palette.glassStrong,
    borderColor: palette.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
    ...shadows.glow,
  },
  chipLabel: { color: palette.ink, fontSize: 15, fontWeight: '700' },
  chipLabelSelected: { color: '#FFFFFF' },
  streamChip: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  streamChipGlyph: { fontSize: 17 },
  streamChipLabel: { color: palette.ink, fontSize: 15, fontWeight: '700' },
  streamChipLabelSelected: { color: '#FFFFFF' },
  streamBadge: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  streamBadgeGlyph: { fontSize: 13 },
  streamBadgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    ...shadows.card,
  },
  glassShadow: {
    backgroundColor: palette.glass,
    borderRadius: radii.card,
    ...shadows.card,
  },
  glassClip: {
    backgroundColor: palette.sheet,
    borderColor: 'rgba(255,255,255,0.75)',
    borderRadius: radii.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  glassInner: { padding: spacing.md },
  glassInnerFlush: { padding: 0 },
  dots: { alignItems: 'center', flexDirection: 'row', gap: 6, height: 24, justifyContent: 'center' },
  dot: { borderRadius: 5, height: 10, width: 10 },
  empty: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  emptyGlyph: {
    alignItems: 'center',
    backgroundColor: palette.primarySoft,
    borderRadius: 48,
    height: 96,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 96,
  },
  emptyGlyphText: { fontSize: 44 },
  emptyTitle: { ...type.title, color: palette.ink, marginBottom: spacing.sm, textAlign: 'center' },
  emptyBody: { ...type.body, color: palette.body, textAlign: 'center' },
  emptyAction: { marginTop: spacing.lg },
  sectionHeader: { marginBottom: spacing.md },
  kicker: { ...type.label, color: palette.primary, marginBottom: 4 },
  sectionTitle: { ...type.title, color: palette.ink },
  liveBadge: {
    backgroundColor: palette.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveBadgeText: { color: palette.primary, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  demoBadge: {
    backgroundColor: palette.cautionSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  demoBadgeText: { color: palette.warning, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
});
