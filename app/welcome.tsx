import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppInput, GhostButton, GlassCard, PrimaryButton } from '../components/ui';
import { firebaseConfigured } from '../lib/config';
import { useApp } from '../lib/store';
import { palette, radii, spacing, type } from '../lib/theme';
import { STREAMS } from '../lib/types';

type Mode = 'main' | 'signup' | 'login' | 'forgot';

/**
 * Welcome gate — shown on every open to a signed-out, non-guest user.
 * Exactly four options: Continue with Google; Create account; Log in
 * (with Forgot password); Continue without an account (guest, per-visit
 * only).
 *
 * No photo hero here: RecycleRight is a sorting desk, so the welcome
 * visual is typographic — the pine headline "Where does this go?" over
 * a strip of the five stream colors.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const {
    signIn,
    signInWithEmail,
    signUpWithEmail,
    resetPasswordForEmail,
    continueAsGuest,
  } = useApp();
  const [mode, setMode] = useState<Mode>('main');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const friendly = (e: unknown): string => {
    if (!firebaseConfigured) {
      return 'Sign-in needs the Firebase project, which is still being set up. Continue without an account to explore.';
    }
    const message = e instanceof Error ? e.message : 'Something went wrong. Try again.';
    if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) {
      return 'That email and password do not match. Try again or reset your password.';
    }
    if (message.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists — try logging in instead.';
    }
    if (message.includes('auth/invalid-email')) return 'That email address does not look right.';
    if (message.includes('auth/weak-password')) {
      return 'Choose a password of at least 6 characters.';
    }
    return message;
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setError(friendly(e));
    } finally {
      setBusy(false);
    }
  };

  const submitSignup = () => {
    if (!name.trim()) return setError('Please add your name.');
    if (!email.trim()) return setError('Please add your email.');
    if (password !== confirm) return setError('The two passwords do not match.');
    if (password.length < 6) return setError('Choose a password of at least 6 characters.');
    void run(() => signUpWithEmail(name, email, password));
  };

  const submitLogin = () => {
    if (!email.trim()) return setError('Please add your email.');
    void run(() => signInWithEmail(email, password));
  };

  const submitForgot = () => {
    if (!email.trim()) return setError('Type your email above first, then tap Send reset email.');
    void run(async () => {
      await resetPasswordForEmail(email);
      setNotice('Password reset email sent — check your inbox.');
    });
  };

  const back = () => {
    setMode('main');
    setError(null);
    setNotice(null);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify()}>
          <Text style={styles.kicker}>RECYCLERIGHT</Text>
          <Text style={styles.title}>Where does{'\n'}this go?</Text>
          <Text style={styles.body}>
            Point RecycleRight at anything in your hand — a bottle, a peel, a battery — and it
            tells you which bin it belongs in, why, and how to prep it.
          </Text>
          <View style={styles.strip} accessibilityRole="none">
            {STREAMS.map((s) => (
              <View key={s.stream} style={[styles.stripSegment, { backgroundColor: s.color }]} />
            ))}
          </View>
          <Text style={styles.stripCaption}>Recycle · Compost · Trash · Hazardous · Donate</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <GlassCard style={styles.card}>
            {mode === 'main' ? (
              <View style={styles.actions}>
                <PrimaryButton label="Continue with Google" onPress={() => void run(signIn)} loading={busy} />
                <GhostButton label="Create account" onPress={() => setMode('signup')} />
                <GhostButton label="Log in" onPress={() => setMode('login')} />
                <GhostButton
                  label="Continue without an account"
                  onPress={() => {
                    continueAsGuest();
                    router.replace('/');
                  }}
                />
              </View>
            ) : (
              <View style={styles.actions}>
                {mode === 'signup' ? (
                  <AppInput
                    label="Your name"
                    value={name}
                    onChangeText={setName}
                    placeholder="Your name"
                    autoCapitalize="words"
                  />
                ) : null}
                <AppInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                {mode === 'forgot' ? null : (
                  <AppInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    secureTextEntry
                  />
                )}
                {mode === 'signup' ? (
                  <AppInput
                    label="Confirm password"
                    value={confirm}
                    onChangeText={setConfirm}
                    placeholder="Confirm password"
                    secureTextEntry
                  />
                ) : null}
                {mode === 'signup' ? (
                  <PrimaryButton label="Create my account" onPress={submitSignup} loading={busy} />
                ) : mode === 'login' ? (
                  <PrimaryButton label="Log in" onPress={submitLogin} loading={busy} />
                ) : (
                  <PrimaryButton label="Send reset email" onPress={submitForgot} loading={busy} />
                )}
                {mode === 'login' ? (
                  <GhostButton label="Forgot password?" onPress={() => setMode('forgot')} />
                ) : null}
                <GhostButton label="← Back" onPress={back} />
              </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            {!firebaseConfigured ? (
              <Text style={styles.hint}>
                Sign-in needs the Firebase project, which is still being set up. Continue without
                an account to explore.
              </Text>
            ) : null}
          </GlassCard>
        </Animated.View>

        <Text style={styles.disclaimer}>
          Your scans stay yours — they live on your device, or in your account when signed in.
          Guest mode lasts for this visit only.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: palette.ground, flex: 1 },
  scroll: { padding: 20, paddingBottom: 48 },
  kicker: { ...type.label, color: palette.leaf, marginBottom: 8, marginTop: 12 },
  title: { ...type.displayWide, color: palette.ink, marginBottom: 12 },
  body: { ...type.body, color: palette.body, fontSize: 16, lineHeight: 25, marginBottom: spacing.lg },
  strip: { borderRadius: radii.pill, flexDirection: 'row', height: 12, overflow: 'hidden' },
  stripSegment: { flex: 1 },
  stripCaption: { ...type.caption, color: palette.muted, marginBottom: spacing.lg, marginTop: 8 },
  card: { padding: spacing.lg },
  actions: { gap: 12 },
  error: { ...type.bodyStrong, color: palette.error, marginTop: spacing.md, textAlign: 'center' },
  notice: { ...type.bodyStrong, color: palette.success, marginTop: spacing.md, textAlign: 'center' },
  hint: { ...type.caption, color: palette.muted, marginTop: spacing.md, textAlign: 'center' },
  disclaimer: { ...type.caption, color: palette.muted, marginTop: spacing.lg, textAlign: 'center' },
});
