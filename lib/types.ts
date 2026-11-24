/** RecycleRight shared types. */

export type Stream = 'recycle' | 'compost' | 'trash' | 'hazard' | 'donate';

export const STREAMS: { stream: Stream; name: string; glyph: string; color: string; soft: string; blurb: string }[] = [
  { stream: 'recycle', name: 'Recycle', glyph: '♻️', color: '#2563EB', soft: '#DBEAFE', blurb: 'Clean paper, glass, metal and hard plastic go in the blue bin.' },
  { stream: 'compost', name: 'Compost', glyph: '🌱', color: '#16A34A', soft: '#DCF2E3', blurb: 'Food scraps and yard waste rot down into soil, not landfill gas.' },
  { stream: 'trash', name: 'Trash', glyph: '🗑️', color: '#64748B', soft: '#E2E8F0', blurb: 'When nothing else fits, landfill is the honest answer.' },
  { stream: 'hazard', name: 'Hazardous', glyph: '⚠️', color: '#DC2626', soft: '#FEE2E2', blurb: 'Batteries, chemicals and electronics never go in a curbside bin.' },
  { stream: 'donate', name: 'Donate', glyph: '💜', color: '#7C3AED', soft: '#EDE9FE', blurb: 'Still usable? Someone nearby can use it more than a landfill can.' },
];

export function streamMeta(stream: Stream) {
  return STREAMS.find((s) => s.stream === stream) ?? STREAMS[2];
}

export function streamName(stream: Stream): string {
  return streamMeta(stream).name;
}

export function streamGlyph(stream: Stream): string {
  return streamMeta(stream).glyph;
}

export function streamColor(stream: Stream): string {
  return streamMeta(stream).color;
}

export function streamSoft(stream: Stream): string {
  return streamMeta(stream).soft;
}

/** One entry in the "what goes where" guide. */
export interface GuideItem {
  id: string;
  name: string;
  stream: Stream;
  /** One or two sentences on why it goes in this stream. */
  why: string;
  /** Numbered prep steps, e.g. "Rinse it out", "Take the lid off". */
  prep: string[];
  /** Where to take it, e.g. "Curbside blue bin" or "Household hazardous waste day". */
  dropoff: string;
  /** Lowercase search keywords, e.g. ["bottle", "plastic", "soda"]. */
  keywords: string[];
  /** Seeded demo content — clearable from Settings. */
  isDemo?: boolean;
}

export type AiSource = 'live' | 'demo';

/** The verdict for one item, from live AI or the on-device demo sorter. */
export interface SortResult {
  item: string;
  stream: Stream;
  /** 0–100. Demo answers are honest keyword matches, not guesses. */
  confidence: number;
  why: string;
  prep: string[];
  dropoff: string;
  source: AiSource;
  /** Id of the matching guide entry, when one exists. */
  guideId?: string;
}

/** One logged scan — the personal "diverted from landfill" tally. */
export interface ScanRecord {
  id: string;
  item: string;
  stream: Stream;
  /** Epoch milliseconds. */
  at: number;
  source: AiSource;
  /** Seeded demo content — clearable from Settings. */
  isDemo?: boolean;
}

export interface HistoryEntry {
  id: string;
  item: string;
  stream: Stream;
  /** 'scan' | 'guide' */
  kind: string;
  /** Epoch milliseconds. */
  at: number;
}

export interface ImpactTotals {
  itemsSorted: number;
  /** Estimated kilograms kept out of landfill. */
  kgDiverted: number;
  /** Current daily streak in days. */
  streakDays: number;
  byStream: Record<Stream, number>;
  /** Last 7 days, oldest first: { label, count }. */
  weekly: { label: string; count: number }[];
}

export interface SortRequestInput {
  item: string;
  /** Optional base64 photo (data URL or raw base64). */
  photo?: string;
}

export interface SortResponse {
  stream?: Stream;
  confidence?: number;
  why?: string;
  prep?: string[];
  dropoff?: string;
  source?: AiSource;
  error?: { message?: string };
}
