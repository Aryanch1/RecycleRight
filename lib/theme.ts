import { useWindowDimensions } from 'react-native';

/**
 * RecycleRight design tokens — one consistent system for the whole app.
 *
 * Identity: "the kraft-paper sorting desk". Kraft paper ground
 * (#F6F1E7) with deep pine (#14532D) as the one disciplined theme
 * color and leaf green (#16A34A) as the accent. The five waste
 * streams each own a color: Recycle blue (#2563EB), Compost green
 * (#16A34A), Trash slate (#64748B), Hazard red (#DC2626), Donate
 * purple (#7C3AED), with caution amber (#F59E0B). Bitter (700/800)
 * is the display face — deliberately different from Outfit
 * (SkillSwapLocal), Lora (MoodJournal), Bebas Neue (BloodBond),
 * DM Serif Display (ElderEase), Space Grotesk (BudgetBuddy),
 * Archivo (CivicHelper), Bricolage Grotesque (PlantDoctor),
 * Fraunces (SplitEase) and Sora (FridgeToMeal/MediGuide).
 *
 * Navigation is a flat white bottom tab bar with labeled icons
 * (Scan / Guide / Impact / Settings). No floating glass pill tab
 * bar, no raised center button, no photo hero, no ledger, no
 * dashboard grid, no ring, no poster type, no top segmented tabs.
 * Home is scan-first: a typographic display headline ("Where does
 * this go?"), one big pine scan tile, a "type an item" field, four
 * stream quick-chips, then a recent-scans feed. Detail screens are
 * full-screen takeovers with a big colored verdict banner in the
 * stream color.
 */

export const palette = {
  // Brand — one disciplined deep pine.
  primary: '#14532D',
  primaryDeep: '#0B3D1E',
  primaryLight: '#1E6B3C',
  primarySoft: '#DCEADF',
  primaryPale: '#EDF4EE',
  // Leaf accent — the action accent and the compost stream.
  leaf: '#16A34A',
  leafDeep: '#15803D',
  leafSoft: '#DCF2E3',
  // Waste streams — each owns one color.
  recycle: '#2563EB',
  recycleSoft: '#DBEAFE',
  compost: '#16A34A',
  compostSoft: '#DCF2E3',
  trash: '#64748B',
  trashSoft: '#E2E8F0',
  hazard: '#DC2626',
  hazardSoft: '#FEE2E2',
  donate: '#7C3AED',
  donateSoft: '#EDE9FE',
  caution: '#F59E0B',
  cautionSoft: '#FEF3C7',
  // Ground — kraft paper.
  ground: '#F6F1E7',
  // Neutrals (warm tinted so the whole UI feels one family).
  ink: '#1F2A1F',
  body: '#4B574B',
  muted: '#8A938A',
  line: 'rgba(31, 42, 31, 0.10)',
  surface: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.62)',
  glassStrong: 'rgba(255, 255, 255, 0.85)',
  sheet: 'rgba(255, 255, 255, 0.92)',
  // Status.
  warning: '#92400E',
  warningSoft: '#FEF3C7',
  error: '#B3261E',
  errorSoft: '#FCE8E6',
  success: '#15803D',
  successSoft: '#DCF2E3',
} as const;

/** Stream color lookup — every screen reads stream colors from here. */
export const streamColors = {
  recycle: { color: '#2563EB', soft: '#DBEAFE' },
  compost: { color: '#16A34A', soft: '#DCF2E3' },
  trash: { color: '#64748B', soft: '#E2E8F0' },
  hazard: { color: '#DC2626', soft: '#FEE2E2' },
  donate: { color: '#7C3AED', soft: '#EDE9FE' },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  card: 28,
  sheet: 36,
  pill: 999,
  input: 24,
} as const;

/**
 * Display typeface — Bitter (bundled via @expo-google-fonts/bitter,
 * loaded in app/_layout.tsx). Used for headlines, screen titles and
 * big numbers; body text stays on the system font.
 */
export const font = {
  display: 'Bitter_800ExtraBold',
  bold: 'Bitter_700Bold',
} as const;

export const type = {
  display: { fontFamily: font.display, fontSize: 40, lineHeight: 44, letterSpacing: -0.3 },
  displayWide: { fontFamily: font.display, fontSize: 52, lineHeight: 54, letterSpacing: -0.3 },
  title: { fontFamily: font.display, fontSize: 26, lineHeight: 32, letterSpacing: -0.2 },
  subtitle: { fontSize: 17, lineHeight: 24, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '700' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.6 },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '700' as const, letterSpacing: 1.1 },
} as const;

export const shadows = {
  card: {
    shadowColor: '#1F2A1F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  glow: {
    shadowColor: '#14532D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  leafGlow: {
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  float: {
    shadowColor: '#1F2A1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

export type Breakpoint = 'compact' | 'medium' | 'wide' | 'desktop';

export interface Responsive {
  breakpoint: Breakpoint;
  width: number;
  /** Max width for the centered content column. */
  contentMaxWidth: number;
  /** Horizontal page padding. */
  pad: number;
  /** Columns for card grids. */
  columns: number;
  /** Two-pane list + detail layout (foldable unfolded / tablet / desktop). */
  twoPane: boolean;
  display: typeof type.display | typeof type.displayWide;
}

export function useResponsive(): Responsive {
  const { width } = useWindowDimensions();
  if (width < 600) {
    return {
      breakpoint: 'compact',
      width,
      contentMaxWidth: width,
      pad: 20,
      columns: 1,
      twoPane: false,
      display: type.display,
    };
  }
  if (width < 840) {
    return {
      breakpoint: 'medium',
      width,
      contentMaxWidth: 640,
      pad: 28,
      columns: 1,
      twoPane: false,
      display: type.displayWide,
    };
  }
  if (width < 1280) {
    return {
      breakpoint: 'wide',
      width,
      contentMaxWidth: 1024,
      pad: 32,
      columns: 2,
      twoPane: true,
      display: type.displayWide,
    };
  }
  return {
    breakpoint: 'desktop',
    width,
    contentMaxWidth: 1120,
    pad: 40,
    columns: 3,
    twoPane: true,
    display: type.displayWide,
  };
}
