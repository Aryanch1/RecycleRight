import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import appJson from '../app.json';
import { GhostButton, GlassCard, PrimaryButton, SectionHeader } from '../components/ui';
import { firebaseConfigured } from '../lib/config';
import { useApp } from '../lib/store';
import { palette, radii, spacing, type, useResponsive } from '../lib/theme';

/**
 * Settings — profile, town rules, demo-data toggle, danger zone, about.
 * Every destructive tap confirms in place (tap once to arm, tap again
 * to confirm) and the result shows right where the user is looking.
 * The version label reads the single version source (app.json) — never
 * a hand-typed string.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const {
    user,
    guest,
    showDemo,
    setShowDemo,
    history,
    updateDisplayName,
    setAvatarData,
    sendPasswordReset,
    signOut,
    clearHistory,
    clearDemoData,
  } = useApp();
  const r = useResponsive();

  const [name, setName] = useState(user?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [armHistory, setArmHistory] = useState(false);
  const [armDemo, setArmDemo] = useState(false);
  const [armSignOut, setArmSignOut] = useState(false);

  const version = appJson.expo.version;

  const pickPhoto = async () => {
    setError(null);
    setNotice(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (result.canceled || !result.assets[0]) return;
      // Client-side resize before storing — no Firebase Storage needed.
      const resized = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 256 } }],
        { base64: true, format: ImageManipulator.SaveFormat.JPEG },
      );
      if (resized.base64) {
        await setAvatarData(`data:image/jpeg;base64,${resized.base64}`);
        setNotice('Profile picture updated.');
      }
    } catch {
      setError('Could not update the picture. Try again.');
    }
  };

  const saveName = async () => {
    if (!name.trim()) {
      setError('Please type a name first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateDisplayName(name);
      setNotice('Name updated.');
    } catch {
      setError('Could not save the name. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setBusy(true);
    setError(null);
    try {
      await sendPasswordReset();
      setNotice('Password reset email sent — check your inbox.');
    } catch {
      setError('Could not send the reset email. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const confirmClearHistory = () => {
    if (!armHistory) {
      setArmHistory(true);
      setNotice('Tap “Clear history” again to confirm — this cannot be undone.');
      return;
    }
    clearHistory();
    setArmHistory(false);
    setNotice('History cleared.');
  };

  const confirmClearDemo = () => {
    if (!armDemo) {
      setArmDemo(true);
      setNotice('Tap “Clear demo data” again to confirm — the seeded scans go away.');
      return;
    }
    clearDemoData();
    setArmDemo(false);
    setNotice('Demo data cleared.');
  };

  const confirmSignOut = () => {
    if (!armSignOut) {
      setArmSignOut(true);
      setNotice('Tap “Sign out” again to confirm.');
      return;
    }
    void signOut().then(() => router.replace('/welcome'));
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.ground }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingHorizontal: r.pad, maxWidth: r.contentMaxWidth, alignSelf: 'center' }]}
      >
        <SectionHeader kicker="Settings" title="Profile & account" />

        {user ? (
          <GlassCard style={styles.card}>
            <View style={styles.profileRow}>
              {user.photo ? (
                <Image source={{ uri: user.photo }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {(user.name ?? user.email ?? '?').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.profileText}>
                <Text style={styles.profileName}>{user.name ?? 'Your profile'}</Text>
                <Text style={styles.profileEmail}>{user.email ?? ''}</Text>
                <Text style={styles.profileProvider}>
                  Signed in with {user.provider === 'google.com' ? 'Google' : 'email & password'}
                </Text>
              </View>
            </View>
            <GhostButton label="Change picture" onPress={() => void pickPhoto()} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Display name"
              placeholderTextColor={palette.muted}
              autoCapitalize="words"
            />
            <PrimaryButton label="Save name" onPress={() => void saveName()} loading={busy} />
            {user.provider === 'password' ? (
              <GhostButton label="Send password-reset email" onPress={() => void resetPassword()} />
            ) : null}
            <GhostButton
              label={armSignOut ? 'Tap again to sign out' : 'Sign out'}
              onPress={confirmSignOut}
            />
          </GlassCard>
        ) : (
          <GlassCard style={styles.card}>
            <Text style={styles.guestTitle}>
              {guest ? 'You are browsing as a guest' : 'You are signed out'}
            </Text>
            <Text style={styles.guestBody}>
              Sign in to keep your scans and history in sync across devices.
              Guest mode lasts for this visit only.
            </Text>
            <PrimaryButton label="Go to sign-in" onPress={() => router.push('/welcome')} />
          </GlassCard>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <SectionHeader kicker="Town rules" title="Rules vary by town" />
        <GlassCard style={styles.card}>
          <Text style={styles.dataBody}>
            Rules vary by town. RecycleRight uses common US curbside rules;
            check your town&apos;s guide for the final word — especially for
            plastics, pizza boxes and hazardous waste days.
          </Text>
        </GlassCard>

        <SectionHeader kicker="Demo data" title="Seeded samples" />
        <GlassCard style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleTitle}>Show demo data</Text>
              <Text style={styles.toggleBody}>
                The seeded scans and the 128-item baseline on the Impact tab.
              </Text>
            </View>
            <Switch
              value={showDemo}
              onValueChange={(on) => {
                setShowDemo(on);
                setNotice(on ? 'Demo data is on.' : 'Demo data is off.');
              }}
              trackColor={{ false: palette.line, true: palette.leaf }}
              thumbColor="#FFFFFF"
            />
          </View>
        </GlassCard>

        <SectionHeader kicker="Danger zone" title="Clear your data" />
        <GlassCard style={styles.card}>
          <Text style={styles.dataBody}>
            History holds the items you have looked up and sorted, for
            one-tap re-use. Demo data is the seeded sample scans.
          </Text>
          {history.length === 0 ? (
            <Text style={styles.dataBody}>No history saved yet.</Text>
          ) : null}
          <GhostButton
            label={armHistory ? 'Tap again to clear history' : 'Clear history'}
            onPress={confirmClearHistory}
          />
          <GhostButton
            label={armDemo ? 'Tap again to clear demo data' : 'Clear demo data'}
            onPress={confirmClearDemo}
          />
        </GlassCard>

        <SectionHeader kicker="About" title="RecycleRight" />
        <GlassCard style={styles.card}>
          <Text style={styles.statusRow}>RecycleRight version {version}</Text>
          <Text style={styles.statusRow}>
            Sorting AI: live service when the Python backend is deployed — on-device demo sorter until then.
          </Text>
          <Text style={styles.statusRow}>
            Accounts & sync: {firebaseConfigured ? 'Firebase connected' : 'Not set up yet — guest mode'}
          </Text>
          <Text style={styles.statusRow}>MIT License</Text>
          <Text style={styles.statusRow}>© 2026 Aryanmouli Cherupalli</Text>
        </GlassCard>

        <GhostButton label="Help & about" onPress={() => router.push('/help')} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 48, paddingTop: 20, width: '100%' },
  card: { gap: 12, marginBottom: spacing.xl, padding: spacing.md },
  profileRow: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  avatar: { borderRadius: 40, height: 80, width: 80 },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: palette.primarySoft,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  avatarFallbackText: { color: palette.primary, fontSize: 32, fontWeight: '800' },
  profileText: { flex: 1 },
  profileName: { ...type.subtitle, color: palette.ink },
  profileEmail: { ...type.body, color: palette.body },
  profileProvider: { ...type.caption, color: palette.muted, marginTop: 2 },
  input: {
    backgroundColor: palette.primaryPale,
    borderRadius: radii.input,
    color: palette.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 18,
  },
  guestTitle: { ...type.subtitle, color: palette.ink },
  guestBody: { ...type.body, color: palette.body },
  error: { ...type.bodyStrong, color: palette.error, marginBottom: spacing.md, textAlign: 'center' },
  notice: { ...type.bodyStrong, color: palette.success, marginBottom: spacing.md, textAlign: 'center' },
  toggleRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  toggleText: { flex: 1 },
  toggleTitle: { ...type.subtitle, color: palette.ink },
  toggleBody: { ...type.body, color: palette.body, marginTop: 2 },
  statusRow: { ...type.body, color: palette.body },
  dataBody: { ...type.body, color: palette.body },
});
