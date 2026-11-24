import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GhostButton, GlassCard, IconButton, SectionHeader, SpringPress } from '../components/ui';
import { palette, spacing, type, useResponsive } from '../lib/theme';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Why did it say Trash?',
    a: 'When nothing else fits, trash is the honest answer. A greasy pizza box, a broken mug or a tangled hose cannot be recycled or composted, and putting them in the wrong bin contaminates a whole load — one wrong item can send an entire truck of recycling to landfill. Trash is not a failure; it is the bin that keeps the other bins clean.',
  },
  {
    q: 'Batteries and electronics',
    a: 'Never put batteries or electronics in a curbside bin. Lithium batteries start fires in trucks and sorting plants. Take batteries to a store drop-off (most hardware and electronics stores take them) and electronics to your town’s hazardous waste day or an e-waste collection point.',
  },
  {
    q: 'Is the AI always right?',
    a: 'No. In DEMO mode the app is a keyword guide, not a guesser — it only answers what it knows. LIVE AI can be wrong too, especially on new packaging and mixed materials. When in doubt, check your town’s rules; they are the final word.',
  },
  {
    q: 'What about my town’s rules?',
    a: 'Rules vary by town — what one town recycles, the next landfills. The app uses common US curbside rules and says so on every answer. For the final word, check your town’s recycling guide, especially for plastics, pizza boxes and hazardous waste days.',
  },
  {
    q: 'My photo did not sort',
    a: 'Photo sorting needs the live AI, which needs the backend to be deployed. Until then, type the item name instead — the demo sorter knows the guide by heart and will answer from it. If the photo is blurry or the item is half out of frame, a typed name works better anyway.',
  },
  {
    q: 'Privacy',
    a: 'Your scans stay on your device unless you sign in, and then they live under your account only — nobody else sees them. Guest mode lasts for this visit only. Nothing you sort is shared, sold or shown to anyone else.',
  },
];

/**
 * Help — expandable FAQ, the sorting-guidance disclaimer, and where to
 * go for account help (Settings). No photo hero, no ledger, no poster
 * type — plain kraft-paper cards in the app voice.
 */
export default function HelpScreen() {
  const router = useRouter();
  const r = useResponsive();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <View style={[styles.root, { backgroundColor: palette.ground }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingHorizontal: r.pad, maxWidth: r.contentMaxWidth, alignSelf: 'center' }]}
      >
        <View style={styles.header}>
          <IconButton label="←" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Help & about</Text>
          <View style={styles.headerSpacer} />
        </View>

        <SectionHeader kicker="Help" title="How RecycleRight works" />
        <GlassCard style={styles.card}>
          <Text style={styles.body}>
            1. On the Scan tab, point the camera at something in your hand —
            or just type its name. The app tells you which bin it belongs
            in, why, and what to do first.
          </Text>
          <Text style={styles.body}>
            2. Tap any answer to see the full verdict: the stream banner,
            the reason, numbered prep steps and where to drop it off.
          </Text>
          <Text style={styles.body}>
            3. The Guide tab holds every item A to Z, searchable by name or
            keyword, with the same verdict detail for each one. Tap a row
            and it is saved to your history for one-tap re-use.
          </Text>
          <Text style={styles.body}>
            4. The Impact tab keeps your tally: items sorted, kilograms
            diverted (an estimate) and your day streak, with a 7-day chart
            and a by-stream split.
          </Text>
        </GlassCard>

        <SectionHeader kicker="Questions" title="Frequently asked" />
        {FAQS.map((faq, i) => {
          const open = openIndex === i;
          return (
            <Animated.View key={faq.q} entering={FadeInDown.delay(i * 50).springify()}>
              <GlassCard style={styles.faqCard}>
                <SpringPress
                  onPress={() => setOpenIndex(open ? null : i)}
                  haptic
                >
                  <View style={styles.faqHead}>
                    <Text style={styles.faqQuestion}>{faq.q}</Text>
                    <Text style={styles.faqChevron}>{open ? '▾' : '▸'}</Text>
                  </View>
                </SpringPress>
                {open ? <Text style={styles.body}>{faq.a}</Text> : null}
              </GlassCard>
            </Animated.View>
          );
        })}

        <SectionHeader kicker="Please note" title="Sorting guidance, not a guarantee" />
        <GlassCard style={styles.card}>
          <Text style={styles.body}>
            RecycleRight gives sorting guidance from common US curbside
            rules and, when live, an AI reading of your item or photo. It
            is not a legal guarantee and it does not replace your town’s
            rules. Hazardous items — batteries, chemicals, electronics,
            paint, medical waste — always follow your local law and your
            town’s hazardous waste program.
          </Text>
        </GlassCard>

        <SectionHeader kicker="Support" title="Need a hand?" />
        <GlassCard style={styles.card}>
          <Text style={styles.body}>
            For account trouble — sign-in, your display name or your
            profile picture — go to Settings. For a wrong answer, check
            the Guide tab first: it lists the same verdict with the reason
            behind it.
          </Text>
          <GhostButton label="Open Settings" onPress={() => router.push('/settings')} />
        </GlassCard>

        <SectionHeader kicker="About" title="RecycleRight" />
        <GlassCard style={styles.card}>
          <Text style={styles.body}>
            A point-and-sort companion by Aryanmouli Cherupalli — point it
            at anything in your hand and it tells you which bin it belongs
            in. Built with React Native + Expo + TypeScript, a Python
            serverless sorter, Gemini AI and Firebase.
          </Text>
        </GlassCard>

        <GhostButton label="Back to Scan" onPress={() => router.replace('/')} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 48, paddingTop: 20, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  headerTitle: { ...type.title, color: palette.ink, flex: 1 },
  headerSpacer: { width: 44 },
  card: { gap: 12, marginBottom: spacing.xl, padding: spacing.lg },
  faqCard: { gap: 10, marginBottom: spacing.md, padding: spacing.md },
  faqHead: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  faqQuestion: { ...type.subtitle, color: palette.ink, flex: 1 },
  faqChevron: { color: palette.muted, fontSize: 18, fontWeight: '800' },
  body: { ...type.body, color: palette.body, fontSize: 16, lineHeight: 25 },
});
