import { GUIDE_ITEMS } from './guide';
import type { SortResponse, SortResult, Stream } from './types';

const STREAMS: Stream[] = ['recycle', 'compost', 'trash', 'hazard', 'donate'];

function isStream(value: unknown): value is Stream {
  return typeof value === 'string' && (STREAMS as string[]).includes(value);
}

export function demoSort(item: string): SortResult {
  const trimmed = item.trim();
  const normalized = trimmed.toLowerCase();

  interface BestMatch {
    score: number;
    keywordLength: number;
    exact: boolean;
  }

  let best: BestMatch | null = null;
  let bestIndex = -1;

  for (let index = 0; index < GUIDE_ITEMS.length; index += 1) {
    const guideItem = GUIDE_ITEMS[index];
    const nameLower = guideItem.name.toLowerCase();
    if (normalized === nameLower) {
      const score = 1000 + nameLower.length;
      if (best === null || score > best.score) {
        best = { score, keywordLength: nameLower.length, exact: true };
        bestIndex = index;
      }
      continue;
    }
    for (const keyword of guideItem.keywords) {
      const keywordLower = keyword.toLowerCase();
      let score = 0;
      let exact = false;
      if (normalized === keywordLower) {
        score = 500 + keywordLower.length * 10;
        exact = true;
      } else if (normalized.length >= 3 && normalized.includes(keywordLower)) {
        score = 100 + keywordLower.length * 10;
      } else if (keywordLower.length >= 3 && keywordLower.includes(normalized) && normalized.length >= 3) {
        score = 50 + normalized.length;
      }
      if (score > 0 && (best === null || score > best.score)) {
        best = { score, keywordLength: keywordLower.length, exact };
        bestIndex = index;
      }
    }
  }

  if (best !== null && bestIndex >= 0) {
    const guideItem = GUIDE_ITEMS[bestIndex];
    const confidence = best.exact ? 97 : 88 + Math.min(9, Math.floor(best.keywordLength / 3));
    return {
      item: trimmed,
      stream: guideItem.stream,
      confidence,
      why: guideItem.why,
      prep: guideItem.prep,
      dropoff: guideItem.dropoff,
      source: 'demo',
      guideId: guideItem.id,
    };
  }

  const generic: { test: (text: string) => boolean; stream: Stream; confidence: number; why: string; prep: string[]; dropoff: string }[] = [
    {
      test: (text) => text.includes('batter'),
      stream: 'hazard',
      confidence: 78,
      why: 'Best-guess rule: batteries are hazardous waste and never go in a curbside bin.',
      prep: ['Tape the ends', 'Take it to a drop-off'],
      dropoff: 'Household hazardous waste day',
    },
    {
      test: (text) => text.includes('plastic bag') || text.includes('film') || text.includes('wrapper'),
      stream: 'trash',
      confidence: 75,
      why: 'Best-guess rule: thin plastic film and wrappers do not go in curbside recycling.',
      prep: ['Do not put it in the blue bin'],
      dropoff: 'Curbside trash',
    },
    {
      test: (text) => text.includes('food') || text.includes('peel') || text.includes('scrap'),
      stream: 'compost',
      confidence: 75,
      why: 'Best-guess rule: food scraps belong in compost.',
      prep: ['Put it in the compost bin'],
      dropoff: 'Backyard compost',
    },
    {
      test: (text) => text.includes('bottle') || text.includes('can') || text.includes('jar'),
      stream: 'recycle',
      confidence: 75,
      why: 'Best-guess rule: clean bottles, cans, and jars usually belong in recycling. Check your town rules.',
      prep: ['Empty it', 'Rinse it out'],
      dropoff: 'Curbside blue bin',
    },
    {
      test: (text) => text.includes('clothes') || text.includes('clothing') || text.includes('shoes'),
      stream: 'donate',
      confidence: 75,
      why: 'Best-guess rule: usable clothes and shoes can be donated instead of sent to landfill.',
      prep: ['Wash them', 'Check they are still wearable'],
      dropoff: 'Donation bin / charity shop',
    },
  ];

  for (const rule of generic) {
    if (rule.test(normalized)) {
      return {
        item: trimmed,
        stream: rule.stream,
        confidence: rule.confidence,
        why: rule.why,
        prep: rule.prep,
        dropoff: rule.dropoff,
        source: 'demo',
      };
    }
  }

  return {
    item: trimmed,
    stream: 'trash',
    confidence: 40,
    why: 'No confident match in the on-device guide, so trash is the safe fallback. Check your town rules or try the live AI sort.',
    prep: ['When in doubt, keep it out of recycling'],
    dropoff: 'Curbside trash',
    source: 'demo',
  };
}

export async function sortViaApi(base: string, item: string, photo?: string): Promise<SortResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const body: { item: string; photo?: string } = { item };
    if (photo) {
      body.photo = photo;
    }
    const response = await fetch(`${base || ''}/api/sort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      return null;
    }
    let data: SortResponse;
    try {
      data = (await response.json()) as SortResponse;
    } catch {
      return null;
    }
    if (!data || typeof data !== 'object') {
      return null;
    }
    if (!isStream(data.stream) || typeof data.why !== 'string' || data.why.trim() === '') {
      return null;
    }
    if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 100) {
      return null;
    }
    return {
      item: item.trim(),
      stream: data.stream,
      confidence: Math.round(data.confidence),
      why: data.why.trim(),
      prep: Array.isArray(data.prep) ? data.prep.filter((step): step is string => typeof step === 'string') : [],
      dropoff: typeof data.dropoff === 'string' && data.dropoff.trim() !== '' ? data.dropoff : 'Curbside trash',
      source: 'live',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
