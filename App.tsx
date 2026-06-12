import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  MPLUSRounded1c_500Medium,
  MPLUSRounded1c_700Bold,
  MPLUSRounded1c_800ExtraBold,
  MPLUSRounded1c_900Black,
} from '@expo-google-fonts/m-plus-rounded-1c';
import { QUESTIONS, DIFFICULTY_LABELS, Question } from './src/questions';
import { isCorrect } from './src/matching';
import { getHighScore, setHighScore, getMuted, setMuted } from './src/storage';
import { COLORS, DIFFICULTY_COLORS, DIFFICULTY_EDGES, DS, LOGO_COLORS, FONTS, GAME_CONFIG as G } from './src/theme';
import FlickKeyboard from './src/FlickKeyboard';
import { cycleKana } from './src/kana';
import { sfx, setSfxEnabled } from './src/sfx';
import Decor from './src/Decor';
import LottieFX from './src/Lottie';
import AnimatedMascot, { AnimalKey, MascotMood } from './src/AnimatedMascot';
import { MOTION, useReducedMotion } from './src/motion';
import { CandyButton, StickerCard, CardTab, NzIcon, NzStar, PromoRays } from './src/ui';
import { SITE } from './src/links';

const CONFETTI = require('./assets/lottie/confetti.json');

// レベル（難易度1-4）ごとのマスコット動物 ＝「動物園コンプ」方式。
// 進むほど新しい動物に会える。マスコットはSVG＋コードアニメ（AnimatedMascot）で自作。
// 動物を増やす/絵を作り込むときは AnimatedMascot.tsx の ART に追加するだけ。
const LEVEL_MASCOTS: Record<number, { animal: AnimalKey; name: string; species: string }> = {
  1: { animal: 'chick', name: 'ぴよ', species: 'ヒヨコ' },
  2: { animal: 'rabbit', name: 'みみ', species: 'ウサギ' },
  3: { animal: 'panda', name: 'らんらん', species: 'パンダ' },
  4: { animal: 'owl', name: 'はかせ', species: 'フクロウ' },
};
const WIN = Dimensions.get('window');

type Screen = 'home' | 'playing' | 'result' | 'credits';
type WrongItem = { text: string; answer: string };

const MAX_INPUT = 16;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const POOLS: Record<number, Question[]> = { 1: [], 2: [], 3: [], 4: [] };
QUESTIONS.forEach((q) => POOLS[q.difficulty].push(q));

const lastResult: { current: { score: number; wrongs: WrongItem[]; isNewRecord: boolean } } = {
  current: { score: 0, wrongs: [], isNewRecord: false },
};

function MountMotion({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: any;
}) {
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    Animated.timing(progress, {
      toValue: 1,
      duration: MOTION.slow,
      delay,
      easing: MOTION.easeOut,
      useNativeDriver: false,
    }).start();
  }, [delay, progress, reducedMotion]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  return <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

// ホームロゴ「Nazoo」を1文字ずつ時差で弾ませる（デザインの logo-bounce 相当・2.8sループ）
const LOGO_CYCLE = 2800;
function BounceLetter({ ch, color, index, reduced }: { ch: string; color: string; index: number; reduced: boolean }) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    const loop = () => {
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 180, easing: MOTION.easeOut, useNativeDriver: false }),
        Animated.timing(v, { toValue: 0, duration: 360, easing: Easing.bounce, useNativeDriver: false }),
        Animated.delay(LOGO_CYCLE - 540),
      ]).start(({ finished }) => {
        if (finished && !cancelled) loop();
      });
    };
    const t = setTimeout(loop, index * 120); // 文字ごとの時差で波打たせる
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [v, index, reduced]);

  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const rotate = v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-4deg'] });
  return (
    <Animated.Text style={[hs.logoLetter, { color, transform: [{ translateY }, { rotate }] }]}>{ch}</Animated.Text>
  );
}

function BouncyLogo() {
  const reduced = useReducedMotion();
  return (
    <View style={hs.logoRow}>
      {'Nazoo'.split('').map((ch, i) => (
        <BounceLetter key={i} ch={ch} color={LOGO_COLORS[i]} index={i} reduced={reduced} />
      ))}
    </View>
  );
}

function MuteButton({ muted, onPress, reducedMotion }: { muted: boolean; onPress: () => void; reducedMotion: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const spin = useRef(new Animated.Value(0)).current;

  const runPressIn = () => {
    if (reducedMotion) return;
    Animated.spring(scale, { toValue: 0.88, friction: 6, tension: 180, useNativeDriver: false }).start();
  };
  const runPressOut = () => {
    if (reducedMotion) return;
    spin.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 160, useNativeDriver: false }),
      Animated.timing(spin, { toValue: 1, duration: MOTION.calm, easing: MOTION.easeOut, useNativeDriver: false }),
    ]).start();
  };

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', muted ? '-12deg' : '12deg'] });
  return (
    <Pressable onPress={onPress} onPressIn={runPressIn} onPressOut={runPressOut} style={styles.muteBtn} hitSlop={10}>
      <Animated.View style={{ transform: [{ scale }, { rotate }] }}>
        <NzIcon name={muted ? 'soundOff' : 'soundOn'} size={22} color={COLORS.ink} />
      </Animated.View>
    </Pressable>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [highScore, setHigh] = useState(0);
  const [muted, setMutedState] = useState(false);
  const reducedMotion = useReducedMotion();

  const [fontsLoaded] = useFonts({
    MPLUSRounded1c_500Medium,
    MPLUSRounded1c_700Bold,
    MPLUSRounded1c_800ExtraBold,
    MPLUSRounded1c_900Black,
  });

  useEffect(() => {
    getHighScore().then(setHigh);
    getMuted().then((m) => {
      setMutedState(m);
      setSfxEnabled(!m);
    });
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setSfxEnabled(!next);
    setMuted(next);
    if (!next) sfx.tap();
  };

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <Decor />
      <MuteButton muted={muted} onPress={toggleMute} reducedMotion={reducedMotion} />

      {screen === 'home' && (
        <HomeScreen highScore={highScore} onStart={() => setScreen('playing')} onCredits={() => setScreen('credits')} />
      )}
      {screen === 'credits' && <CreditsScreen onBack={() => setScreen('home')} />}
      {screen === 'playing' && (
        <GameScreen
          onEnd={(score, wrongs) => {
            const isNewRecord = score > highScore;
            if (isNewRecord) {
              setHigh(score);
              setHighScore(score);
            }
            lastResult.current = { score, wrongs, isNewRecord };
            setScreen('result');
          }}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          result={lastResult.current}
          highScore={highScore}
          onRetry={() => setScreen('playing')}
          onHome={() => setScreen('home')}
        />
      )}
    </View>
  );
}

// 一度だけ再生して、ms経過後に消えるLottie（Web/ネイティブ両対応で確実に消す）
function OneShot({
  source,
  width,
  height,
  style,
  ms = 2500,
  disabled = false,
}: {
  source: any;
  width: number;
  height: number;
  style?: any;
  ms?: number;
  disabled?: boolean;
}) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  if (done || disabled) return null;
  return (
    <View style={[style, styles.noPointerEvents]}>
      <LottieFX source={source} loop={false} width={width} height={height} onDone={() => setDone(true)} />
    </View>
  );
}

// ───────────────────────── ホーム ─────────────────────────
const hs = StyleSheet.create({
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40, gap: 16 },
  logoRow: { flexDirection: 'row', alignItems: 'flex-end' },
  logoLetter: { fontSize: 64, fontWeight: '900', fontFamily: FONTS.black, lineHeight: 66, letterSpacing: -2, textShadowColor: 'rgba(255,255,255,0.9)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 2 },
  ribbon: { transform: [{ rotate: '-2deg' }], backgroundColor: COLORS.ink, paddingHorizontal: 20, paddingVertical: 6, borderRadius: 999 },
  ribbonText: { color: '#fff', fontSize: 13, fontWeight: '900', fontFamily: FONTS.black, letterSpacing: 3 },
  parade: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  paradeSlot: { alignItems: 'center', gap: 1 },
  paradeName: { fontSize: 10, fontWeight: '800', fontFamily: FONTS.exbold, color: COLORS.inkSoft },
  rulesCard: { paddingHorizontal: 18, paddingTop: 26, paddingBottom: 16, gap: 11 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ruleIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#3D3A50', shadowOpacity: 0.14, shadowRadius: 0, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  ruleTitle: { fontSize: 14.5, fontWeight: '900', fontFamily: FONTS.black, color: COLORS.ink, lineHeight: 19 },
  ruleSub: { fontSize: 11, fontWeight: '700', fontFamily: FONTS.bold, color: COLORS.inkSoft, marginTop: 1 },
  highPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 999, paddingHorizontal: 22, paddingVertical: 9, shadowColor: '#3D3A50', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  highLabel: { fontSize: 13, color: COLORS.inkSoft, fontWeight: '800', fontFamily: FONTS.exbold },
  highValue: { fontSize: 22, fontWeight: '900', fontFamily: FONTS.black, color: COLORS.primary },
  highUnit: { fontSize: 13, fontWeight: '900', fontFamily: FONTS.black, color: COLORS.primary },
  startText: { color: '#fff', fontSize: 21, fontWeight: '900', fontFamily: FONTS.black, letterSpacing: 1 },
  footerLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, marginTop: 2 },
  footerLinkText: { fontSize: 13, fontWeight: '800', fontFamily: FONTS.exbold, color: COLORS.inkSoft, textDecorationLine: 'underline' },
});

function HomeScreen({ highScore, onStart, onCredits }: { highScore: number; onStart: () => void; onCredits: () => void }) {
  const rules: { icon: string; color: string; title: React.ReactNode; sub: string }[] = [
    { icon: 'clock', color: COLORS.teal, title: 'じかんないに こたえよう！', sub: '0びょうになったら ゲームオーバー' },
    { icon: 'pencil', color: COLORS.primary, title: 'ひらがなで こたえてね！', sub: 'フリックでも タップでも OK' },
    { icon: 'plus', color: COLORS.yellow, title: <>せいかいで <Text style={{ color: COLORS.primary }}>+{G.correctBonus}びょう</Text> ゲット！</>, sub: 'どんどん きろくを のばそう' },
    { icon: 'bolt', color: COLORS.purple, title: `${G.levelUpEvery}もんごとに なかまが ふえる！`, sub: 'なぞなぞも むずかしくなるよ' },
  ];

  return (
    <ScrollView contentContainerStyle={hs.scroll}>
      <MountMotion style={{ alignItems: 'center', gap: 10 }}>
        <BouncyLogo />
        <View style={hs.ribbon}>
          <Text style={hs.ribbonText}>エンドレスなぞなぞ</Text>
        </View>
      </MountMotion>

      <MountMotion delay={90} style={hs.parade}>
        {[1, 2, 3, 4].map((lv) => (
          <View key={lv} style={hs.paradeSlot}>
            <AnimatedMascot animal={LEVEL_MASCOTS[lv].animal} size={lv === 1 ? 86 : 74} mood="idle" />
            <Text style={hs.paradeName}>{LEVEL_MASCOTS[lv].name}</Text>
          </View>
        ))}
      </MountMotion>

      <MountMotion delay={160} style={{ width: '100%', alignItems: 'center' }}>
        <StickerCard style={hs.rulesCard}>
          <CardTab label="あそびかた" color={COLORS.teal} />
          {rules.map((r, i) => (
            <View key={i} style={hs.ruleRow}>
              <View style={[hs.ruleIcon, { backgroundColor: r.color }]}>
                <NzIcon name={r.icon} size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={hs.ruleTitle}>{r.title}</Text>
                <Text style={hs.ruleSub}>{r.sub}</Text>
              </View>
            </View>
          ))}
        </StickerCard>
      </MountMotion>

      <MountMotion delay={230}>
        <View style={hs.highPill}>
          <NzIcon name="crown" size={22} color={COLORS.yellow} />
          <Text style={hs.highLabel}>ハイスコア</Text>
          <Text style={hs.highValue}>{highScore}</Text>
          <Text style={hs.highUnit}>もん</Text>
        </View>
      </MountMotion>

      <MountMotion delay={290} style={{ width: '100%', alignItems: 'center' }}>
        <CandyButton onPress={onStart} style={{ width: '100%' }}>
          <NzIcon name="play" size={22} color="#fff" />
          <Text style={hs.startText}>スタート！</Text>
        </CandyButton>
      </MountMotion>

      <MountMotion delay={350} style={{ width: '100%', alignItems: 'center' }}>
        <Pressable onPress={onCredits} style={hs.footerLink} hitSlop={8}>
          <NzIcon name="sparkle" size={14} color={COLORS.inkSoft} />
          <Text style={hs.footerLinkText}>クレジット・利用規約</Text>
        </Pressable>
      </MountMotion>
    </ScrollView>
  );
}

// ───────────────────────── ゲーム ─────────────────────────
const gs = StyleSheet.create({
  hudRow: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  chip: { flex: 1, backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingVertical: 7, shadowColor: COLORS.surfaceEdge, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  chipLabel: { fontSize: 10, fontWeight: '900', fontFamily: FONTS.black, color: COLORS.inkSoft, letterSpacing: 1 },
  chipValue: { fontSize: 19, fontWeight: '900', fontFamily: FONTS.black, color: COLORS.ink, lineHeight: 23 },
  chipUnit: { fontSize: 9.5, fontWeight: '900', fontFamily: FONTS.black },
  level: { flex: 1.25, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  levelLv: { fontSize: 10, fontWeight: '900', fontFamily: FONTS.black, color: '#fff', opacity: 0.9, letterSpacing: 1 },
  levelName: { fontSize: 13.5, fontWeight: '900', fontFamily: FONTS.black, color: '#fff', lineHeight: 16 },
  stars: { flexDirection: 'row', gap: 2, marginTop: 2 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barTrack: { flex: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  qCard: { paddingHorizontal: 20, paddingTop: 26, paddingBottom: 22, minHeight: 148, justifyContent: 'center', gap: 10 },
  qBadge: { position: 'absolute', top: -13, left: 16, zIndex: 2, backgroundColor: COLORS.purple, paddingHorizontal: 13, paddingVertical: 4, borderRadius: 999, transform: [{ rotate: '-2deg' }], shadowColor: COLORS.purpleDark, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  qBadgeText: { color: '#fff', fontSize: 12, fontWeight: '900', fontFamily: FONTS.black, letterSpacing: 1 },
  qText: { fontSize: 19, lineHeight: 29, fontWeight: '800', fontFamily: FONTS.exbold, color: COLORS.ink, textAlign: 'center' },
  peek: { position: 'absolute', right: -2, bottom: -16 },
  hintBubble: { marginHorizontal: 4, backgroundColor: '#FFF6D8', borderWidth: 2, borderColor: '#F2CF6B', borderStyle: 'dashed', borderRadius: 14, paddingHorizontal: 13, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  hintText: { color: '#8A6200', fontSize: 13.5, fontWeight: '800', fontFamily: FONTS.exbold, flex: 1 },
  answerBlock: { alignItems: 'center', gap: 3 },
  answerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, minHeight: 48, flexWrap: 'wrap' },
  tile: { width: 38, height: 46, backgroundColor: COLORS.surface, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.surfaceEdge, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  tileGhost: { backgroundColor: 'rgba(255,255,255,0.45)', shadowOpacity: 0 },
  tileText: { fontSize: 23, fontWeight: '900', fontFamily: FONTS.black, color: COLORS.ink },
  caret: { width: 3, height: 30, borderRadius: 2, backgroundColor: COLORS.primary },
  answerCaption: { fontSize: 11, fontWeight: '800', fontFamily: FONTS.exbold, color: COLORS.inkSoft, letterSpacing: 1.5 },
  subRow: { flexDirection: 'row', gap: 9 },
  subText: { fontSize: 13, fontWeight: '900', fontFamily: FONTS.black },
  hintBadge: { backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 999, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  hintBadgeText: { color: '#fff', fontSize: 12, fontWeight: '900', fontFamily: FONTS.black },
  skipPenalty: { fontSize: 10, fontWeight: '900', fontFamily: FONTS.black, color: '#fff', opacity: 0.85 },
});

function GameScreen({ onEnd }: { onEnd: (score: number, wrongs: WrongItem[]) => void }) {
  const reducedMotion = useReducedMotion();
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const timeRef = useRef(G.startTime);
  const solvedRef = useRef(0);
  const hintsRef = useRef(G.hintsPerGame);
  const wrongsRef = useRef<WrongItem[]>([]);
  const queuesRef = useRef<Record<number, Question[]>>({ 1: [], 2: [], 3: [], 4: [] });
  const currentRef = useRef<Question | null>(null);
  const endedRef = useRef(false);
  // 出題切替の遷移中フラグ。正解/スキップ後 drawNext までの間の二重発火（連打）で
  // 同じ問題が重複記録/重複加点されるのを防ぐ。
  const lockRef = useRef(false);
  // 昇格演出中はタイマーを止める（演出ぶんの時間ロスをなくす）
  const pausedRef = useRef(false);

  const [input, setInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'correct' | 'wrong'; delta: number } | null>(null);
  const [burst, setBurst] = useState(0);
  const [levelKey, setLevelKey] = useState(0);
  const [questionKey, setQuestionKey] = useState(0);
  const [mascotMood, setMascotMood] = useState<MascotMood>('thinking');
  const [mascotReaction, setMascotReaction] = useState(0);
  // 昇格演出（新しい動物が仲間入り）を出す難易度。null＝非表示
  const [promoD, setPromoD] = useState<number | null>(null);

  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const fbAnim = useRef(new Animated.Value(0)).current;
  const questionIntro = useRef(new Animated.Value(0)).current;
  const hintIntro = useRef(new Animated.Value(0)).current;

  const currentDifficulty = () => Math.min(4, Math.floor(solvedRef.current / G.levelUpEvery) + 1) as number;

  const drawNext = useCallback(() => {
    const d = currentDifficulty();
    if (queuesRef.current[d].length === 0) queuesRef.current[d] = shuffle(POOLS[d]);
    currentRef.current = queuesRef.current[d].shift() || null;
    lockRef.current = false; // 次の問題が出たので入力受付を再開
    setShowHint(false);
    setInput('');
    setQuestionKey((k) => k + 1);
  }, []);

  useEffect(() => {
    setMascotMood('thinking');
    setMascotReaction((k) => k + 1);
    const t = setTimeout(() => setMascotMood('idle'), reducedMotion ? 80 : 760);
    return () => clearTimeout(t);
  }, [questionKey, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      questionIntro.setValue(1);
      return;
    }
    questionIntro.setValue(0);
    Animated.timing(questionIntro, {
      toValue: 1,
      duration: MOTION.calm,
      easing: MOTION.easeOut,
      useNativeDriver: false,
    }).start();
  }, [questionIntro, questionKey, reducedMotion]);

  useEffect(() => {
    if (!showHint) {
      hintIntro.setValue(0);
      return;
    }
    if (reducedMotion) {
      hintIntro.setValue(1);
      return;
    }
    hintIntro.setValue(0);
    Animated.timing(hintIntro, {
      toValue: 1,
      duration: MOTION.base,
      easing: MOTION.easeOut,
      useNativeDriver: false,
    }).start();
  }, [hintIntro, reducedMotion, showHint]);

  useEffect(() => {
    drawNext();
    rerender();
    const id = setInterval(() => {
      if (pausedRef.current) return; // 昇格演出中は時間を止める
      timeRef.current = Math.max(0, timeRef.current - 0.1);
      if (timeRef.current <= 0 && !endedRef.current) {
        endedRef.current = true;
        clearInterval(id);
        sfx.gameover();
        onEnd(solvedRef.current, wrongsRef.current);
        return;
      }
      rerender();
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flashFeedback = (kind: 'correct' | 'wrong', delta: number) => {
    setFeedback({ kind, delta });
    fbAnim.setValue(0);
    if (reducedMotion) {
      Animated.sequence([
        Animated.timing(fbAnim, { toValue: 1, duration: 80, useNativeDriver: false }),
        Animated.delay(460),
        Animated.timing(fbAnim, { toValue: 0, duration: 120, useNativeDriver: false }),
      ]).start(() => setFeedback(null));
      return;
    }
    Animated.sequence([
      Animated.timing(fbAnim, { toValue: 1, duration: 140, useNativeDriver: false }),
      Animated.delay(420),
      Animated.timing(fbAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start(() => setFeedback(null));
  };

  const doCorrect = () => {
    lockRef.current = true; // 切替アニメ中の二重発火を止める
    const prevD = currentDifficulty();
    timeRef.current += G.correctBonus;
    solvedRef.current += 1;
    sfx.correct();
    setBurst((b) => b + 1);
    const newD = currentDifficulty();
    const leveledUp = newD > prevD; // 実際に難易度が上がった時だけ（Lv4到達後の頭打ちは除く）
    setMascotMood(leveledUp ? 'celebrate' : 'happy');
    setMascotReaction((k) => k + 1);
    if (leveledUp) {
      setLevelKey((k) => k + 1);
      setPromoD(newD); // 新しい動物の登場演出
      pausedRef.current = true; // 演出中はタイマー停止
      setTimeout(() => sfx.levelup(), 260);
    }
    flashFeedback('correct', G.correctBonus);
    Animated.sequence([
      Animated.timing(pop, { toValue: 1.05, duration: 120, useNativeDriver: false }),
      Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: false }),
    ]).start();
    rerender();
    setTimeout(() => {
      drawNext();
      rerender();
    }, reducedMotion ? 40 : 340);
  };

  const doWrong = () => {
    timeRef.current = Math.max(0, timeRef.current - G.wrongPenalty);
    sfx.wrong();
    setMascotMood('wrong');
    setMascotReaction((k) => k + 1);
    flashFeedback('wrong', -G.wrongPenalty);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 50, useNativeDriver: false }),
      Animated.timing(shake, { toValue: -1, duration: 50, useNativeDriver: false }),
      Animated.timing(shake, { toValue: 1, duration: 50, useNativeDriver: false }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: false }),
    ]).start();
    setInput('');
    rerender();
  };

  const submit = () => {
    const q = currentRef.current;
    if (!q || endedRef.current || lockRef.current) return;
    if (input.trim().length === 0) return;
    if (isCorrect(input, q.accept, q.answer)) doCorrect();
    else doWrong();
  };

  const skip = () => {
    const q = currentRef.current;
    if (!q || endedRef.current || lockRef.current) return;
    lockRef.current = true; // 切替アニメ中の二重スキップを止める
    wrongsRef.current.push({ text: q.text, answer: q.answer });
    timeRef.current = Math.max(0, timeRef.current - G.skipPenalty);
    sfx.wrong();
    setMascotMood('wrong');
    setMascotReaction((k) => k + 1);
    flashFeedback('wrong', -G.skipPenalty);
    rerender();
    setTimeout(() => {
      drawNext();
      rerender();
    }, reducedMotion ? 40 : 260);
  };

  const useHint = () => {
    if (hintsRef.current <= 0 || showHint) return;
    hintsRef.current -= 1;
    setShowHint(true);
    setMascotMood('thinking');
    setMascotReaction((k) => k + 1);
    rerender();
  };

  const pressKey = (ch: string) => {
    sfx.tap();
    setInput((p) => (p.length >= MAX_INPUT ? p : p + ch));
  };
  const onCycle = () => {
    sfx.tap();
    setInput((p) => (p ? p.slice(0, -1) + cycleKana(p.slice(-1)) : p));
  };
  const onDel = () => {
    sfx.tap();
    setInput((p) => p.slice(0, -1));
  };

  const q = currentRef.current;
  const d = currentDifficulty();
  const barPct = Math.max(0, Math.min(1, timeRef.current / G.maxBarSeconds));
  const lowTime = timeRef.current <= 5;
  const dColor = DIFFICULTY_COLORS[d];
  const mascot = LEVEL_MASCOTS[d];
  // こたえタイルのゴースト数（読みの文字数ヒント・最大8）
  const answerLen = Math.min(8, ((q?.accept && q.accept[0]) || q?.answer || '').length);
  const ghosts = Math.max(0, answerLen - input.length);
  const qTranslateY = questionIntro.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const qScale = questionIntro.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] });
  const hintTranslateY = hintIntro.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] });
  const fbTranslateY = fbAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  return (
    <View style={styles.gameRoot}>
      <View style={styles.gameTop}>
        {/* HUD */}
        <View style={gs.hudRow}>
          <View style={gs.chip}>
            <Text style={gs.chipLabel}>せいかい</Text>
            <Text style={gs.chipValue} numberOfLines={1}>
              {solvedRef.current}
              <Text style={gs.chipUnit}> もん</Text>
            </Text>
          </View>
          <View style={[gs.level, { backgroundColor: dColor, shadowColor: DIFFICULTY_EDGES[d] }]}>
            <Text style={gs.levelLv}>LV.{d}</Text>
            <Text style={gs.levelName}>{DIFFICULTY_LABELS[d]}</Text>
            <View style={gs.stars}>
              {[1, 2, 3, 4].map((i) => (
                <NzStar key={i} size={10} filled={i <= d} />
              ))}
            </View>
          </View>
          <View style={gs.chip}>
            <Text style={gs.chipLabel}>のこり</Text>
            <Text style={[gs.chipValue, lowTime && { color: COLORS.danger }]} numberOfLines={1}>
              {Math.ceil(timeRef.current)}
              <Text style={gs.chipUnit}> びょう</Text>
            </Text>
          </View>
        </View>

        {/* 時間バー */}
        <View style={gs.barRow}>
          <NzIcon name="clock" size={22} color={COLORS.ink} />
          <View style={gs.barTrack}>
            <View style={[gs.barFill, { width: `${barPct * 100}%`, backgroundColor: lowTime ? COLORS.danger : COLORS.teal }]} />
          </View>
        </View>

        {/* 問題カード */}
        <Animated.View
          style={{
            opacity: questionIntro,
            transform: [
              { scale: pop },
              { scale: qScale },
              { translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) },
              { translateY: qTranslateY },
            ],
          }}
        >
          <StickerCard style={gs.qCard}>
            <View style={gs.qBadge}>
              <Text style={gs.qBadgeText}>Q{solvedRef.current + 1}</Text>
            </View>
            <Text style={gs.qText}>{q?.text}</Text>
            {showHint && q && (
              <Animated.View style={[gs.hintBubble, { opacity: hintIntro, transform: [{ translateY: hintTranslateY }] }]}>
                <NzIcon name="bulb" size={20} color={COLORS.yellow} />
                <Text style={gs.hintText}>{q.hint}</Text>
              </Animated.View>
            )}
            <View style={[gs.peek, styles.noPointerEvents]}>
              <AnimatedMascot animal={mascot.animal} size={72} mood={mascotMood} reactionKey={mascotReaction} />
            </View>
          </StickerCard>
        </Animated.View>

        {/* こたえタイル */}
        <View style={gs.answerBlock}>
          <View style={gs.answerRow}>
            {input.split('').map((ch, i) => (
              <View key={i + ch} style={gs.tile}>
                <Text style={gs.tileText}>{ch}</Text>
              </View>
            ))}
            <View style={gs.caret} />
            {Array.from({ length: ghosts }).map((_, i) => (
              <View key={'g' + i} style={[gs.tile, gs.tileGhost]} />
            ))}
          </View>
          {input.length === 0 && <Text style={gs.answerCaption}>ひらがなで こたえてね</Text>}
        </View>

        {/* 補助ボタン */}
        <View style={gs.subRow}>
          <CandyButton color={COLORS.yellow} edge={COLORS.yellowDark} height={48} radius={14} gap={7} onPress={useHint} disabled={hintsRef.current <= 0 || showHint} style={{ flex: 1 }}>
            <NzIcon name="bulb" size={20} color={COLORS.sunInk} />
            <Text style={[gs.subText, { color: COLORS.sunInk }]} numberOfLines={1}>ヒント</Text>
            <View style={gs.hintBadge}>
              <Text style={gs.hintBadgeText}>{hintsRef.current}</Text>
            </View>
          </CandyButton>
          <CandyButton color={COLORS.purple} edge={COLORS.purpleDark} height={48} radius={14} gap={6} onPress={skip} style={{ flex: 1 }}>
            <NzIcon name="skip" size={18} color="#fff" />
            <Text style={gs.subText} numberOfLines={1}>スキップ</Text>
            <Text style={gs.skipPenalty} numberOfLines={1}>−{G.skipPenalty}びょう</Text>
          </CandyButton>
        </View>
      </View>

      {/* キーボード */}
      <FlickKeyboard onChar={pressKey} onCycle={onCycle} onDelete={onDel} onSubmit={submit} canSubmit={input.trim().length > 0} />

      {/* フィードバック（吹き出し風） */}
      {feedback && (
        <Animated.View
          style={[
            styles.fbOverlay,
            styles.noPointerEvents,
            {
              opacity: fbAnim,
              transform: [
                { translateY: fbTranslateY },
                { scale: fbAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
              ],
            },
          ]}
        >
          <Text style={[styles.fbWord, { color: feedback.kind === 'correct' ? COLORS.teal : COLORS.danger }]}>
            {feedback.kind === 'correct' ? 'せいかい！' : 'ざんねん…'}
          </Text>
          <View
            style={[
              styles.fbPill,
              { backgroundColor: feedback.kind === 'correct' ? COLORS.teal : COLORS.danger, shadowColor: feedback.kind === 'correct' ? COLORS.tealDark : COLORS.dangerDark },
            ]}
          >
            <Text style={styles.fbPillText}>{feedback.delta > 0 ? `+${feedback.delta}` : feedback.delta} びょう</Text>
          </View>
        </Animated.View>
      )}

      {/* 紙吹雪（正解のたびに再生・終わったら消える） */}
      {burst > 0 && (
        <OneShot key={'c' + burst} source={CONFETTI} width={WIN.width} height={WIN.height} style={styles.confettiLayer} ms={5200} disabled={reducedMotion} />
      )}

      {/* 昇格演出：新しい動物が仲間入り */}
      {promoD !== null && (
        <LevelUpPromo
          d={promoD}
          reducedMotion={reducedMotion}
          onDone={() => {
            setPromoD(null);
            pausedRef.current = false;
          }}
        />
      )}
    </View>
  );
}

// 昇格演出オーバーレイ（新しい動物の登場をでかく見せる）
function LevelUpPromo({ d, onDone, reducedMotion }: { d: number; onDone: () => void; reducedMotion: boolean }) {
  const a = useRef(new Animated.Value(0)).current;
  const m = LEVEL_MASCOTS[d];

  useEffect(() => {
    if (reducedMotion) {
      a.setValue(1);
      const t = setTimeout(onDone, 900);
      return () => clearTimeout(t);
    }
    const anim = Animated.sequence([
      Animated.spring(a, { toValue: 1, friction: 6, tension: 120, useNativeDriver: false }),
      Animated.delay(1100),
      Animated.timing(a, { toValue: 0, duration: 280, easing: MOTION.easeOut, useNativeDriver: false }),
    ]);
    anim.start(({ finished }) => {
      if (finished) onDone();
    });
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <Animated.View pointerEvents="none" style={[styles.promoOverlay, { opacity: a }]}>
      <Animated.View style={[styles.promoCard, { transform: [{ scale }] }]}>
        <PromoRays reduced={reducedMotion} />
        <Text style={styles.promoEyebrow}>LEVEL UP!</Text>
        <Text style={styles.promoTitle}>あたらしい なかま！</Text>
        <AnimatedMascot animal={m.animal} size={130} mood="celebrate" reactionKey={d} />
        <View style={[styles.promoBadge, { backgroundColor: DIFFICULTY_COLORS[d], shadowColor: DIFFICULTY_EDGES[d] }]}>
          <Text style={styles.promoBadgeText}>LV.{d} {DIFFICULTY_LABELS[d]}</Text>
        </View>
        <Text style={styles.promoName}>
          <Text style={{ color: COLORS.primary }}>{m.name}</Text>（{m.species}）が おうえんに きたよ！
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

// ───────────────────────── 結果 ─────────────────────────
function ResultScreen({
  result,
  highScore,
  onRetry,
  onHome,
}: {
  result: { score: number; wrongs: WrongItem[]; isNewRecord: boolean };
  highScore: number;
  onRetry: () => void;
  onHome: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const pop = useRef(new Animated.Value(0)).current;
  const [shownScore, setShownScore] = useState(reducedMotion ? result.score : 0);
  useEffect(() => {
    if (reducedMotion) {
      pop.setValue(1);
      setShownScore(result.score);
      return;
    }
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 110, useNativeDriver: false }).start();
    const steps = Math.max(1, Math.min(20, result.score));
    let current = 0;
    const id = setInterval(() => {
      current += 1;
      setShownScore(Math.round((result.score * current) / steps));
      if (current >= steps) clearInterval(id);
    }, steps > 0 ? 42 : 1);
    return () => clearInterval(id);
  }, [pop, reducedMotion, result.score]);

  const shareResult = async () => {
    const msg = `Nazooで${result.score}問正解しました！\nあなたは何問解ける？`;
    try {
      if (Platform.OS === 'web') {
        const nav: any = typeof navigator !== 'undefined' ? navigator : null;
        if (nav?.share) await nav.share({ text: msg });
        else if (nav?.clipboard) {
          await nav.clipboard.writeText(msg);
          alert('結果をコピーしました！SNSに貼り付けてシェアしてね');
        } else alert(msg);
      } else {
        await Share.share({ message: msg });
      }
    } catch {
      // キャンセル時など
    }
  };

  // 到達した難易度（＝最後に居た動物園エリア）の動物を表示する
  const reachedD = Math.min(4, Math.floor(result.score / G.levelUpEvery) + 1);
  const mascot = LEVEL_MASCOTS[reachedD];
  const resultMood: MascotMood = result.isNewRecord ? 'celebrate' : result.score > 0 ? 'happy' : 'tired';
  const titleColor = result.isNewRecord ? COLORS.yellow : COLORS.primary;

  return (
    <View style={{ flex: 1, width: '100%' }}>
      {result.isNewRecord && (
        <OneShot key="rconf" source={CONFETTI} width={WIN.width} height={WIN.height} style={styles.confettiLayer} ms={5200} disabled={reducedMotion} />
      )}
      <ScrollView contentContainerStyle={rs.scroll}>
        <Animated.View style={{ transform: [{ scale: pop }], alignItems: 'center' }}>
          <Text style={[rs.title, { color: titleColor }]}>{result.isNewRecord ? 'しんきろく！' : 'おつかれさま！'}</Text>
        </Animated.View>

        <Animated.View style={{ opacity: pop, alignItems: 'center' }}>
          <AnimatedMascot animal={mascot.animal} size={150} mood={resultMood} reactionKey={1} />
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: pop }], width: '100%', alignItems: 'center' }}>
          <StickerCard style={rs.scoreCard}>
            {result.isNewRecord && (
              <View style={rs.newRecordTag}>
                <Text style={rs.newRecordText}>NEW RECORD</Text>
              </View>
            )}
            <CardTab label="せいかいすう" color={COLORS.primary} />
            <View style={rs.scoreRow}>
              <NzIcon name="crown" size={30} color={COLORS.yellow} />
              <Text style={rs.score}>
                {shownScore}
                <Text style={rs.scoreUnit}> もん</Text>
              </Text>
              <View style={{ transform: [{ scaleX: -1 }] }}>
                <NzIcon name="crown" size={30} color={COLORS.yellow} />
              </View>
            </View>
            <View style={rs.highRow}>
              <NzIcon name="crown" size={16} color={COLORS.inkSoft} />
              <Text style={rs.high}>ハイスコア {Math.max(highScore, result.score)} もん</Text>
            </View>
          </StickerCard>
        </Animated.View>

        {result.wrongs.length > 0 && (
          <StickerCard style={rs.reviewCard}>
            <CardTab label={`ふりかえり（${result.wrongs.length}もん）`} color={COLORS.purple} />
            {result.wrongs.map((w, i) => (
              <View key={i} style={[rs.reviewItem, i > 0 && rs.reviewDivider]}>
                <Text style={rs.reviewQ}>{w.text}</Text>
                <Text style={rs.reviewA}>
                  <Text style={rs.reviewALabel}>こたえ </Text>
                  <Text style={{ color: COLORS.primary }}>{w.answer}</Text>
                </Text>
              </View>
            ))}
          </StickerCard>
        )}

        <CandyButton onPress={onRetry} style={{ width: '100%' }}>
          <NzIcon name="retry" size={20} color="#fff" />
          <Text style={rs.btnText}>もういちど あそぶ</Text>
        </CandyButton>
        <CandyButton color={COLORS.teal} edge={COLORS.tealDark} height={52} onPress={shareResult} style={{ width: '100%' }}>
          <NzIcon name="share" size={19} color="#fff" />
          <Text style={rs.btnText}>けっかを シェア</Text>
        </CandyButton>
        <Pressable onPress={onHome} style={rs.homeLink}>
          <Text style={rs.homeLinkText}>ホームへ もどる</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const rs = StyleSheet.create({
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 22, paddingTop: 60, paddingBottom: 36, gap: 15 },
  title: { fontSize: 30, fontWeight: '900', fontFamily: FONTS.black, letterSpacing: 1, textShadowColor: '#fff', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 5 },
  scoreCard: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 20, alignItems: 'center', gap: 4 },
  newRecordTag: { position: 'absolute', top: -12, right: 14, zIndex: 3, transform: [{ rotate: '6deg' }], backgroundColor: COLORS.yellow, paddingHorizontal: 13, paddingVertical: 5, borderRadius: 999, shadowColor: COLORS.yellowDark, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  newRecordText: { color: COLORS.sunInk, fontSize: 12, fontWeight: '900', fontFamily: FONTS.black },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  score: { fontSize: 60, fontWeight: '900', fontFamily: FONTS.black, color: COLORS.primary, lineHeight: 64 },
  scoreUnit: { fontSize: 21, fontWeight: '900', fontFamily: FONTS.black, color: COLORS.primary },
  highRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  high: { fontSize: 14, fontWeight: '800', fontFamily: FONTS.exbold, color: COLORS.inkSoft },
  reviewCard: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 14, gap: 2 },
  reviewItem: { paddingTop: 9, paddingHorizontal: 6, paddingBottom: 5 },
  reviewDivider: { borderTopWidth: 2, borderTopColor: '#EFE9F5', borderStyle: 'dashed' },
  reviewQ: { fontSize: 13.5, fontWeight: '700', fontFamily: FONTS.bold, color: COLORS.ink, lineHeight: 20 },
  reviewA: { fontSize: 14.5, fontWeight: '900', fontFamily: FONTS.black, marginTop: 3 },
  reviewALabel: { color: COLORS.inkSoft, fontSize: 12, fontWeight: '800', fontFamily: FONTS.exbold },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '900', fontFamily: FONTS.black, letterSpacing: 1 },
  homeLink: { paddingVertical: 8, paddingHorizontal: 14 },
  homeLinkText: { fontSize: 14.5, fontWeight: '800', fontFamily: FONTS.exbold, color: COLORS.inkSoft, textDecorationLine: 'underline' },
});

// ───────────────────────── クレジット ─────────────────────────
type CreditEntry = { label: string; value: string; note?: string };
type CreditGroup = { tab: string; color: string; entries: CreditEntry[] };

const CREDIT_GROUPS: CreditGroup[] = [
  {
    tab: 'フォント',
    color: COLORS.purple,
    entries: [
      { label: 'M PLUS Rounded 1c', value: '© FONTWORKS Inc.', note: 'SIL Open Font License 1.1' },
    ],
  },
  {
    tab: 'えんしゅつ',
    color: COLORS.teal,
    entries: [
      { label: 'かみふぶきアニメ', value: 'LottieFiles', note: 'Lottie Simple License' },
    ],
  },
  {
    tab: 'オリジナル',
    color: COLORS.primary,
    entries: [
      { label: 'マスコット & アイコン', value: 'Nazoo オリジナル', note: 'すべてコードで作画' },
      { label: 'こうかおん', value: 'Nazoo オリジナル', note: 'アプリ内で自動生成' },
      { label: 'なぞなぞ問題', value: 'Nazoo セレクト', note: '名作なぞなぞを再構成' },
    ],
  },
  {
    tab: 'ぎじゅつ',
    color: COLORS.yellow,
    entries: [
      { label: 'アプリ基盤', value: 'React Native / Expo', note: 'オープンソース' },
      { label: 'グラフィック', value: 'react-native-svg ほか', note: 'オープンソース' },
    ],
  },
];

function CreditsScreen({ onBack }: { onBack: () => void }) {
  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={cs.scroll}>
        <MountMotion style={{ alignItems: 'center', gap: 8 }}>
          <View style={cs.heroIcon}>
            <NzIcon name="sparkle" size={30} color="#fff" />
          </View>
          <Text style={cs.title}>クレジット</Text>
          <Text style={cs.subtitle}>Nazoo をつくっている なかまたち</Text>
        </MountMotion>

        {CREDIT_GROUPS.map((g, gi) => (
          <MountMotion key={g.tab} delay={70 + gi * 60} style={{ width: '100%', alignItems: 'center' }}>
            <StickerCard style={cs.card}>
              <CardTab label={g.tab} color={g.color} />
              {g.entries.map((e, ei) => (
                <View key={ei} style={[cs.row, ei > 0 && cs.rowDivider]}>
                  <Text style={cs.rowLabel}>{e.label}</Text>
                  <Text style={cs.rowValue}>{e.value}</Text>
                  {!!e.note && <Text style={cs.rowNote}>{e.note}</Text>}
                </View>
              ))}
            </StickerCard>
          </MountMotion>
        ))}

        <MountMotion delay={70 + CREDIT_GROUPS.length * 60} style={{ width: '100%', alignItems: 'center', gap: 11 }}>
          <Text style={cs.legalLead}>きやく・プライバシー</Text>
          <CandyButton color={COLORS.teal} edge={COLORS.tealDark} height={52} onPress={() => openLink(SITE.terms)} style={{ width: '100%' }}>
            <NzIcon name="bulb" size={18} color="#fff" />
            <Text style={cs.legalBtnText}>利用規約</Text>
          </CandyButton>
          <CandyButton color={COLORS.purple} edge={COLORS.purpleDark} height={52} onPress={() => openLink(SITE.privacy)} style={{ width: '100%' }}>
            <NzIcon name="crown" size={18} color="#fff" />
            <Text style={cs.legalBtnText}>プライバシーポリシー</Text>
          </CandyButton>
        </MountMotion>

        <MountMotion delay={120 + CREDIT_GROUPS.length * 60} style={{ width: '100%', alignItems: 'center', gap: 14, marginTop: 4 }}>
          <Text style={cs.copyright}>© 2026 Nazoo</Text>
          <CandyButton onPress={onBack} style={{ width: '100%' }}>
            <NzIcon name="retry" size={19} color="#fff" />
            <Text style={cs.legalBtnText}>ホームへ もどる</Text>
          </CandyButton>
        </MountMotion>
      </ScrollView>
    </View>
  );
}

const cs = StyleSheet.create({
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 22, paddingTop: 64, paddingBottom: 40, gap: 14 },
  heroIcon: { width: 64, height: 64, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primaryDark, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  title: { fontSize: 28, fontWeight: '900', fontFamily: FONTS.black, color: COLORS.ink, letterSpacing: 1, textShadowColor: '#fff', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  subtitle: { fontSize: 13, fontWeight: '800', fontFamily: FONTS.exbold, color: COLORS.inkSoft },
  card: { width: '100%', paddingHorizontal: 18, paddingTop: 24, paddingBottom: 14 },
  row: { paddingVertical: 9 },
  rowDivider: { borderTopWidth: 2, borderTopColor: '#EFE9F5', borderStyle: 'dashed' },
  rowLabel: { fontSize: 12, fontWeight: '800', fontFamily: FONTS.exbold, color: COLORS.inkSoft, letterSpacing: 0.5 },
  rowValue: { fontSize: 16, fontWeight: '900', fontFamily: FONTS.black, color: COLORS.ink, marginTop: 1 },
  rowNote: { fontSize: 11.5, fontWeight: '700', fontFamily: FONTS.bold, color: COLORS.inkSoft, marginTop: 2 },
  legalLead: { fontSize: 13, fontWeight: '900', fontFamily: FONTS.black, color: COLORS.inkSoft, letterSpacing: 1, marginTop: 4 },
  legalBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', fontFamily: FONTS.black, letterSpacing: 1 },
  copyright: { fontSize: 12, fontWeight: '800', fontFamily: FONTS.exbold, color: COLORS.inkSoft, letterSpacing: 1 },
});

// ───────────────────────── スタイル ─────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  noPointerEvents: { pointerEvents: 'none' },
  muteBtn: { position: 'absolute', top: 14, right: 14, zIndex: 200, width: 40, height: 40, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.surfaceEdge, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  confettiLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 150, alignItems: 'center', justifyContent: 'flex-start' },

  // ゲーム枠
  gameRoot: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  gameTop: { flex: 1, alignItems: 'stretch', justifyContent: 'center', paddingHorizontal: 16, paddingTop: 24, gap: 11 },

  // フィードバック（せいかい/ざんねん スタンプ）
  fbOverlay: { position: 'absolute', top: '34%', left: 0, right: 0, alignItems: 'center' },
  fbWord: { fontSize: 40, fontWeight: '900', fontFamily: FONTS.black, letterSpacing: 2, textShadowColor: '#fff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 7 },
  fbPill: { marginTop: 6, paddingHorizontal: 17, paddingVertical: 5, borderRadius: 999, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  fbPillText: { color: '#fff', fontSize: 17, fontWeight: '900', fontFamily: FONTS.black },

  // 昇格演出
  promoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(50,40,75,0.42)' },
  promoCard: { width: 290, backgroundColor: COLORS.surface, borderRadius: 30, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 24, alignItems: 'center', gap: 8, overflow: 'hidden' },
  promoEyebrow: { color: COLORS.primary, fontSize: 13, fontWeight: '900', fontFamily: FONTS.black, letterSpacing: 3 },
  promoTitle: { color: COLORS.ink, fontSize: 23, fontWeight: '900', fontFamily: FONTS.black },
  promoBadge: { paddingHorizontal: 18, paddingVertical: 6, borderRadius: 999, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  promoBadgeText: { color: '#fff', fontSize: 14, fontWeight: '900', fontFamily: FONTS.black, letterSpacing: 1 },
  promoName: { color: COLORS.ink, fontSize: 15.5, fontWeight: '900', fontFamily: FONTS.black, textAlign: 'center', lineHeight: 23 },
});
