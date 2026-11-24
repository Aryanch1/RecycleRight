import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from './firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from './firebase';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { API_BASE, firebaseConfigured } from './config';
import { signInWithGoogle } from './google';
import { GUIDE_ITEMS, guideItemById } from './guide';
import { demoSort, sortViaApi } from './sort';
import {
  type GuideItem,
  type HistoryEntry,
  type ImpactTotals,
  type ScanRecord,
  type SortResult,
  type Stream,
} from './types';

const SCANS_KEY = 'recycleright:scans:v1';
const HISTORY_KEY = 'recycleright:history:v1';
const SEEDED_KEY = 'recycleright:seeded:v1';
const SHOW_DEMO_KEY = 'recycleright:showDemo:v1';
const HISTORY_LIMIT = 30;

/** Demo baseline shown on the Impact screen while demo data is on. */
const DEMO_BASE_ITEMS = 128;
const DEMO_BASE_KG = 14.2;
const DEMO_BASE_STREAK = 12;

export interface AuthUser {
  uid: string;
  name: string | null;
  email: string | null;
  photo: string | null;
  /** 'google.com' or 'password' — how this account signs in. */
  provider: string | null;
}

export interface AppState {
  scans: ScanRecord[];
  /** Scans newest first, honoring the show-demo toggle. */
  visibleScans: ScanRecord[];
  history: HistoryEntry[];
  guideItems: GuideItem[];
  impact: ImpactTotals;
  showDemo: boolean;
  setShowDemo: (on: boolean) => void;
  user: AuthUser | null;
  authReady: boolean;
  guest: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  setAvatarData: (dataUrl: string) => Promise<void>;
  sendPasswordReset: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  /** Sort one item: live AI when the endpoint answers, honest demo sorter otherwise. */
  sortItem: (item: string, photo?: string) => Promise<SortResult>;
  /** Log a verdict to the tally + history and return the record. */
  logScan: (result: SortResult) => ScanRecord;
  recordHistory: (entry: Omit<HistoryEntry, 'id' | 'at'>) => void;
  clearHistory: () => void;
  clearDemoData: () => void;
  scanById: (id: string) => ScanRecord | undefined;
  guideById: (id: string) => GuideItem | undefined;
}

const AppContext = createContext<AppState | null>(null);

function loadJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Seeded demo scans — the five scans named in the brief, spread over recent days. */
function seedScans(): ScanRecord[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const rows: { item: string; stream: Stream; daysAgo: number }[] = [
    { item: 'Plastic bottle', stream: 'recycle', daysAgo: 0 },
    { item: 'Banana peel', stream: 'compost', daysAgo: 1 },
    { item: 'AA batteries', stream: 'hazard', daysAgo: 2 },
    { item: 'Old jeans', stream: 'donate', daysAgo: 4 },
    { item: 'Greasy pizza box', stream: 'trash', daysAgo: 5 },
  ];
  return rows.map((r, i) => ({
    id: `demo-scan-${i}`,
    item: r.item,
    stream: r.stream,
    at: now - r.daysAgo * day - 1000 * 60 * (20 + i * 7),
    source: 'demo' as const,
    isDemo: true,
  }));
}

async function upsertProfile(u: User): Promise<void> {
  if (!firebaseConfigured) return;
  try {
    const ref = doc(db, 'users', u.uid);
    const snap = await getDoc(ref);
    const base = {
      displayName: u.displayName ?? '',
      email: u.email ?? '',
      photoURL: u.photoURL ?? '',
      lastLoginAt: serverTimestamp(),
    };
    if (!snap.exists()) {
      await setDoc(ref, { ...base, createdAt: serverTimestamp() });
    } else {
      await setDoc(ref, base, { merge: true });
    }
  } catch {
    // Sync is best-effort; the app keeps working offline.
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showDemo, setShowDemoState] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [guest, setGuest] = useState(false);
  const scansRef = useRef<ScanRecord[]>([]);
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyLoadedRef = useRef(false);
  const unsubsRef = useRef<(() => void)[]>([]);

  // Local data loads once at startup; first launch seeds demo scans.
  useEffect(() => {
    void (async () => {
      const [sRaw, hRaw, seeded, demoRaw] = await Promise.all([
        AsyncStorage.getItem(SCANS_KEY),
        AsyncStorage.getItem(HISTORY_KEY),
        AsyncStorage.getItem(SEEDED_KEY),
        AsyncStorage.getItem(SHOW_DEMO_KEY),
      ]);
      if (demoRaw === '0') setShowDemoState(false);
      const s = loadJson<ScanRecord[]>(sRaw);
      const h = loadJson<HistoryEntry[]>(hRaw);
      if (s && s.length > 0) {
        setScans(s);
        setHistory(h ?? []);
      } else if (!seeded) {
        setScans(seedScans());
        setHistory([]);
        await AsyncStorage.setItem(SEEDED_KEY, '1');
      }
      historyLoadedRef.current = true;
    })();
  }, []);

  // Local mirrors.
  useEffect(() => {
    scansRef.current = scans;
    AsyncStorage.setItem(SCANS_KEY, JSON.stringify(scans)).catch(() => undefined);
  }, [scans]);
  useEffect(() => {
    historyRef.current = history;
    if (!historyLoadedRef.current) return;
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history)).catch(() => undefined);
  }, [history]);

  // Auth state: profile write, cloud subscriptions.
  // Readiness waits for Firebase to finish restoring any persisted
  // session from storage — the gate must not decide "signed out" (and
  // show Welcome) before the saved session has had its chance to load.
  useEffect(() => {
    let alive = true;
    void auth.authStateReady().then(() => {
      if (alive) setAuthReady(true);
    });
    const unsub = onAuthStateChanged(auth, (u) => {
      for (const fn of unsubsRef.current) fn();
      unsubsRef.current = [];
      if (!u) {
        setUser(null);
        return;
      }
      setUser({
        uid: u.uid,
        name: u.displayName,
        email: u.email,
        photo: u.photoURL,
        provider: u.providerData[0]?.providerId ?? null,
      });
      void upsertProfile(u);
      if (!firebaseConfigured) return;

      const subscribe = <T,>(
        colName: string,
        apply: (items: T[]) => void,
        local: () => T[],
        idOf: (item: T) => string,
      ) => {
        const col = collection(db, 'users', u.uid, colName);
        unsubsRef.current.push(
          onSnapshot(
            col,
            (snap) => {
              apply(snap.docs.map((d) => d.data() as T));
            },
            () => undefined,
          ),
        );
        // One-time merge: anything saved locally before sign-in joins the account.
        void (async () => {
          try {
            const cloud = await getDocs(col);
            const cloudIds = new Set(cloud.docs.map((d) => d.id));
            for (const item of local()) {
              const id = idOf(item);
              if (!cloudIds.has(id)) {
                await setDoc(
                  doc(db, 'users', u.uid, colName, id),
                  item as unknown as Record<string, unknown>,
                );
              }
            }
          } catch {
            // Best-effort merge only.
          }
        })();
      };
      subscribe<ScanRecord>('scans', setScans, () => scansRef.current, (e) => e.id);
      subscribe<HistoryEntry>('history', setHistory, () => historyRef.current, (h) => h.id);

      // Profile doc: a custom avatar / edited name stored there overrides
      // the auth copy.
      void (async () => {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          if (snap.exists()) {
            const data = snap.data();
            setUser((prev) =>
              prev && prev.uid === u.uid
                ? {
                    ...prev,
                    name: (data.displayName as string) || prev.name,
                    photo: (data.photoData as string) || prev.photo,
                  }
                : prev,
            );
          }
        } catch {
          // Keep the auth profile.
        }
      })();
    });
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const visibleScans = useMemo(
    () =>
      [...scans]
        .filter((s) => showDemo || !s.isDemo)
        .sort((a, b) => b.at - a.at),
    [scans, showDemo],
  );

  const impact = useMemo<ImpactTotals>(() => {
    const mine = scans.filter((s) => !s.isDemo);
    const base = showDemo ? { items: DEMO_BASE_ITEMS, kg: DEMO_BASE_KG, streak: DEMO_BASE_STREAK } : { items: 0, kg: 0, streak: 0 };
    const byStream: Record<Stream, number> = { recycle: 0, compost: 0, trash: 0, hazard: 0, donate: 0 };
    for (const s of scans) {
      if (!showDemo && s.isDemo) continue;
      byStream[s.stream] += 1;
    }
    // Rough honest weights per stream, used only for the kg estimate.
    const kgPer: Record<Stream, number> = { recycle: 0.12, compost: 0.08, trash: 0.1, hazard: 0.05, donate: 0.4 };
    let kg = base.kg;
    for (const s of mine) kg += kgPer[s.stream];
    // Demo scans are already inside the 14.2 kg baseline, so they add nothing here.
    const weekly: { label: string; count: number }[] = [];
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * dayMs);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const count = scans.filter(
        (s) => (showDemo || !s.isDemo) && s.at >= start && s.at < start + dayMs,
      ).length;
      weekly.push({ label: labels[d.getDay()], count });
    }
    // Streak: consecutive days (ending today) with at least one scan,
    // seeded from the demo baseline while demo data is on.
    let streak = base.streak;
    if (!showDemo) {
      streak = 0;
      for (let i = 0; i < 30; i++) {
        const d = new Date(now.getTime() - i * dayMs);
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const has = mine.some((s) => s.at >= start && s.at < start + dayMs);
        if (has) streak += 1;
        else if (i > 0) break;
        else break;
      }
    }
    return {
      itemsSorted: base.items + mine.length,
      kgDiverted: Math.round(kg * 10) / 10,
      streakDays: streak,
      byStream,
      weekly,
    };
  }, [scans, showDemo]);

  const setShowDemo = useCallback((on: boolean) => {
    setShowDemoState(on);
    AsyncStorage.setItem(SHOW_DEMO_KEY, on ? '1' : '0').catch(() => undefined);
  }, []);

  const signIn = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const cleanName = name.trim();
      if (cleanName) {
        await updateProfile(cred.user, { displayName: cleanName });
        setUser({
          uid: cred.user.uid,
          name: cleanName,
          email: cred.user.email,
          photo: null,
          provider: 'password',
        });
        void upsertProfile({ ...cred.user, displayName: cleanName } as User);
      }
    },
    [],
  );

  const updateDisplayName = useCallback(async (name: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const clean = name.trim();
    await updateProfile(currentUser, { displayName: clean });
    if (firebaseConfigured) {
      await setDoc(doc(db, 'users', currentUser.uid), { displayName: clean }, { merge: true });
    }
    setUser((prev) => (prev ? { ...prev, name: clean } : prev));
  }, []);

  const setAvatarData = useCallback(async (dataUrl: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    if (firebaseConfigured) {
      await setDoc(doc(db, 'users', currentUser.uid), { photoData: dataUrl }, { merge: true });
    }
    setUser((prev) => (prev ? { ...prev, photo: dataUrl } : prev));
  }, []);

  const sendPasswordReset = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) return;
    await sendPasswordResetEmail(auth, currentUser.email);
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    // Back to the welcome screen — the gate routes there as soon as the
    // user is signed out and not a guest.
    setGuest(false);
  }, []);

  const continueAsGuest = useCallback(() => {
    // Deliberately NOT persisted: guest lasts for this visit only, so the
    // next open asks for sign-in again. A signed-in user, by contrast,
    // stays signed in (Firebase Auth persistence).
    setGuest(true);
  }, []);

  const syncDoc = useCallback(
    (colName: string, id: string, data: unknown) => {
      if (!user || !firebaseConfigured) return;
      void setDoc(doc(db, 'users', user.uid, colName, id), data).catch(() => undefined);
    },
    [user],
  );

  const recordHistory = useCallback(
    (entry: Omit<HistoryEntry, 'id' | 'at'>) => {
      const full: HistoryEntry = { ...entry, id: uid('h'), at: Date.now() };
      setHistory((prev) => [full, ...prev].slice(0, HISTORY_LIMIT));
      syncDoc('history', full.id, full);
    },
    [syncDoc],
  );

  const sortItem = useCallback(async (item: string, photo?: string): Promise<SortResult> => {
    const clean = item.trim();
    // Live AI first (same-origin /api on web, API_BASE on native).
    try {
      const live = await sortViaApi(API_BASE, clean, photo);
      if (live) return live;
    } catch {
      // Fall through to the honest on-device demo sorter.
    }
    return demoSort(clean);
  }, []);

  const logScan = useCallback(
    (result: SortResult): ScanRecord => {
      const record: ScanRecord = {
        id: uid('scan'),
        item: result.item,
        stream: result.stream,
        at: Date.now(),
        source: result.source,
      };
      setScans((prev) => [record, ...prev]);
      syncDoc('scans', record.id, record);
      recordHistory({ item: result.item, stream: result.stream, kind: 'scan' });
      return record;
    },
    [recordHistory, syncDoc],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (user && firebaseConfigured) {
      void (async () => {
        try {
          const snap = await getDocs(collection(db, 'users', user.uid, 'history'));
          await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
        } catch {
          // The subscription will reconcile the visible list.
        }
      })();
    }
  }, [user]);

  const clearDemoData = useCallback(() => {
    setScans((prev) => prev.filter((s) => !s.isDemo));
    setHistory((prev) => prev.filter((h) => h.kind !== 'scan' || !scansRef.current.find((s) => s.item === h.item && s.isDemo)));
    if (user && firebaseConfigured) {
      for (const scan of scansRef.current.filter((s) => s.isDemo)) {
        void deleteDoc(doc(db, 'users', user.uid, 'scans', scan.id)).catch(() => undefined);
      }
    }
  }, [user]);

  const scanById = useCallback((id: string) => scans.find((s) => s.id === id), [scans]);

  const guideById = useCallback((id: string) => guideItemById(id), []);

  const value = useMemo<AppState>(
    () => ({
      scans,
      visibleScans,
      history,
      guideItems: GUIDE_ITEMS,
      impact,
      showDemo,
      setShowDemo,
      user,
      authReady,
      guest,
      signIn,
      signInWithEmail,
      signUpWithEmail,
      updateDisplayName,
      setAvatarData,
      sendPasswordReset,
      resetPasswordForEmail,
      signOut,
      continueAsGuest,
      sortItem,
      logScan,
      recordHistory,
      clearHistory,
      clearDemoData,
      scanById,
      guideById,
    }),
    [
      scans,
      visibleScans,
      history,
      impact,
      showDemo,
      setShowDemo,
      user,
      authReady,
      guest,
      signIn,
      signInWithEmail,
      signUpWithEmail,
      updateDisplayName,
      setAvatarData,
      sendPasswordReset,
      resetPasswordForEmail,
      signOut,
      continueAsGuest,
      sortItem,
      logScan,
      recordHistory,
      clearHistory,
      clearDemoData,
      scanById,
      guideById,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
