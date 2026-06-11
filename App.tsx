import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
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
import { COLORS, DIFFICULTY_COLORS, LOGO_COLORS, FONTS, GAME_CONFIG as G } from './src/theme';
import FlickKeyboard from './src/FlickKeyboard';
import { cycleKana } from './src/kana';
import { sfx, setSfxEnabled } from './src/sfx';
import Decor from './src/Decor';
import LottieFX from './src/Lottie';
import AnimatedMascot, { AnimalKey, MascotMood } from './src/AnimatedMascot';
import { MOTION, useReducedMotion } from './src/motion';

const CONFETTI = require('./assets/lottie/confetti.json');
const LEVELUP = require('./assets/lottie/levelup.json');

// レベル（難易度1-4）ごとのマスコット動物 ＝「動物園コンプ」方式。
// 進むほど新しい動物に会える。マスコットはSVG＋コードアニメ（AnimatedMascot）で自作。
// 動物を増やす/絵を作り込むときは AnimatedMascot.tsx の ART に追加するだけ。
const LEVEL_MASCOTS: Record<number, { animal: AnimalKey; name: string }> = {
  1: { animal: 'penguin', name: 'ペンギン' },
  2: { animal: 'monkey', name: 'さる' },
  3: { animal: 'elephant', name: 'ぞう' },
  4: { animal: 'lion', name: 'ライオン' },
};
const WIN = Dimensions.get('window');

type Screen = 'home' | 'playing' | 'result';
type WrongItem = { text: string; answer: string };

const MAX_INPUT = 16;

// UIアイコン画像（Codex生成・透過PNG）
const ICON_TIMER = require('./assets/icons/icon_timer.png');
const ICON_HINT = require('./assets/icons/icon_hint.png');
const ICON_SKIP = require('./assets/icons/icon_skip.png');
const ICON_SOUND_ON = require('./assets/icons/icon_sound_on.png');
const ICON_SOUND_OFF = require('./assets/icons/icon_sound_off.png');
const ICON_INPUT = require('./assets/icons/icon_input.png');
const ICON_BONUS_TIME = require('./assets/icons/icon_bonus_time.png');
const ICON_LEVEL_UP = require('./assets/icons/icon_level_up.png');
const ICON_CROWN = require('./assets/icons/icon_crown.png');
const ICON_STAR = require('./assets/icons/icon_star.png');
const ICON_PLAY = require('./assets/icons/icon_play.png');
const ICON_RETRY = require('./assets/icons/icon_retry.png');
const ICON_SHARE = require('./assets/icons/icon_share.png');
const ICON_LAUREL = require('./assets/icons/icon_laurel.png');

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

function IconImage({ source, size = 22, style }: { source: number; size?: number; style?: any }) {
  return <Image source={source} style={[{ width: size, height: size }, style]} resizeMode="contain" />;
}

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
        <IconImage source={muted ? ICON_SOUND_OFF : ICON_SOUND_ON} size={30} />
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

      {screen === 'home' && <HomeScreen highScore={highScore} onStart={() => setScreen('playing')} />}
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

// ───────────────────────── 共通パーツ ─────────────────────────
function Ribbon({ label, color, tail }: { label: string; color: string; tail: string }) {
  return (
    <View style={styles.ribbonWrap}>
      <View style={[styles.ribbonTailL, { borderRightColor: tail }]} />
      <View style={[styles.ribbon, { backgroundColor: color }]}>
        <Text style={styles.ribbonText}>{label}</Text>
      </View>
      <View style={[styles.ribbonTailR, { borderLeftColor: tail }]} />
    </View>
  );
}

function Stars({ d, total = 5 }: { d: number; total?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {Array.from({ length: total }).map((_, i) => (
        <IconImage key={i} source={ICON_STAR} size={13} style={{ opacity: i < d ? 1 : 0.35 }} />
      ))}
    </View>
  );
}

function Caret() {
  const reducedMotion = useReducedMotion();
  const op = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reducedMotion) {
      op.setValue(0.75);
      return;
    }
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 0, duration: 500, useNativeDriver: false }),
        Animated.timing(op, { toValue: 1, duration: 500, useNativeDriver: false }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [op, reducedMotion]);
  return <Animated.View style={[styles.caret, { opacity: op }]} />;
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
function HomeScreen({ highScore, onStart }: { highScore: number; onStart: () => void }) {
  const reducedMotion = useReducedMotion();
  const rules: { icon: number; color: string; title: React.ReactNode; sub: string }[] = [
    { icon: ICON_TIMER, color: COLORS.teal, title: '時間内に こたえよう！', sub: '制限時間がなくなるとゲームオーバー！' },
    { icon: ICON_INPUT, color: COLORS.pink, title: 'ひらがなで こたえを入力！', sub: 'なぞなぞをよく読んで考えよう！' },
    { icon: ICON_BONUS_TIME, color: COLORS.yellow, title: <>正解すると <Text style={{ color: COLORS.primary }}>+{G.correctBonus}秒</Text>！</>, sub: 'どんどん時間がふえるよ！' },
    { icon: ICON_LEVEL_UP, color: COLORS.purple, title: `${G.levelUpEvery}問ごとに難易度アップ！`, sub: 'よりむずかしい なぞなぞが出題！' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.homeScroll}>
      <MountMotion style={styles.heroStage}>
        <AnimatedMascot animal="penguin" size={170} mood="happy" reactionKey={reducedMotion ? 0 : 1} />
      </MountMotion>

      <MountMotion delay={90} style={styles.logoBlock}>
        <View style={styles.logoRow}>
          {'Nazoo'.split('').map((ch, i) => (
            <Text key={i} style={[styles.logoLetter, { color: LOGO_COLORS[i] }]}>
              {ch}
            </Text>
          ))}
        </View>
        <Ribbon label="エンドレスなぞなぞ" color={COLORS.primary} tail={COLORS.primaryDark} />
      </MountMotion>

      <MountMotion delay={160} style={{ width: '100%', alignItems: 'center' }}>
        <View style={styles.howCard}>
          <View style={styles.howTab}>
            <Text style={styles.howTabText}>あそびかた</Text>
          </View>
          {rules.map((r, i) => (
            <View key={i} style={styles.ruleRow}>
              <View style={[styles.ruleIcon, { backgroundColor: r.color }]}>
                <IconImage source={r.icon} size={31} style={styles.ruleIconImage} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ruleTitle}>{r.title}</Text>
                <Text style={styles.ruleSub}>{r.sub}</Text>
              </View>
            </View>
          ))}
        </View>
      </MountMotion>

      <MountMotion delay={230}>
        <View style={styles.highPill}>
          <IconImage source={ICON_CROWN} size={28} style={styles.highIcon} />
          <Text style={styles.highLabel}>ハイスコア</Text>
          <Text style={styles.highValue}>{highScore}</Text>
          <Text style={styles.highUnit}>問</Text>
        </View>
      </MountMotion>

      <MountMotion delay={290} style={{ width: '100%', alignItems: 'center' }}>
        <BigButton label="スタート" icon={ICON_PLAY} color={COLORS.primary} onPress={onStart} />
      </MountMotion>
    </ScrollView>
  );
}

// ───────────────────────── ゲーム ─────────────────────────
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

  const [input, setInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'correct' | 'wrong'; delta: number } | null>(null);
  const [burst, setBurst] = useState(0);
  const [levelKey, setLevelKey] = useState(0);
  const [questionKey, setQuestionKey] = useState(0);
  const [mascotMood, setMascotMood] = useState<MascotMood>('thinking');
  const [mascotReaction, setMascotReaction] = useState(0);

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
    timeRef.current += G.correctBonus;
    solvedRef.current += 1;
    sfx.correct();
    setBurst((b) => b + 1);
    const leveledUp = solvedRef.current % G.levelUpEvery === 0;
    setMascotMood(leveledUp ? 'celebrate' : 'happy');
    setMascotReaction((k) => k + 1);
    if (solvedRef.current % G.levelUpEvery === 0) {
      setLevelKey((k) => k + 1);
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
    if (!q || endedRef.current) return;
    if (input.trim().length === 0) return;
    if (isCorrect(input, q.accept, q.answer)) doCorrect();
    else doWrong();
  };

  const skip = () => {
    const q = currentRef.current;
    if (!q || endedRef.current) return;
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
  const qTranslateY = questionIntro.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const qScale = questionIntro.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] });
  const hintTranslateY = hintIntro.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] });
  const fbTranslateY = fbAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  return (
    <View style={styles.gameRoot}>
      <View style={styles.gameTop}>
        {/* HUD */}
        <View style={styles.hud}>
          <View style={styles.hudCard}>
            <View style={[styles.hudTab, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.hudTabText}>正解</Text>
            </View>
            <Text style={styles.hudValue}>
              {solvedRef.current}
              <Text style={styles.hudUnit}>問</Text>
            </Text>
          </View>

          <View style={[styles.hudLevel, { backgroundColor: dColor }]}>
            <Text style={styles.hudLevelText}>Lv.{d} {DIFFICULTY_LABELS[d]}</Text>
            <Stars d={d} />
            {levelKey > 0 && (
              <OneShot key={'lv' + levelKey} source={LEVELUP} width={130} height={130} style={styles.levelupBadge} ms={2200} disabled={reducedMotion} />
            )}
          </View>

          <View style={styles.hudCard}>
            <View style={[styles.hudTab, { backgroundColor: COLORS.yellow }]}>
              <Text style={[styles.hudTabText, { color: '#7A5A00' }]}>のこり時間</Text>
            </View>
            <Text style={[styles.hudValue, lowTime && { color: COLORS.danger }]}>
              {timeRef.current.toFixed(1)}
              <Text style={styles.hudUnit}>秒</Text>
            </Text>
          </View>
        </View>

        {/* 時間バー */}
        <View style={styles.barRow}>
          <IconImage source={ICON_TIMER} size={22} />
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${barPct * 100}%`, backgroundColor: lowTime ? COLORS.danger : COLORS.teal }]} />
          </View>
        </View>

        {/* 問題カード */}
        <Animated.View
          style={[
            styles.qCard,
            {
              opacity: questionIntro,
              transform: [
                { scale: pop },
                { scale: qScale },
                { translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) },
                { translateY: qTranslateY },
              ],
            },
          ]}
        >
          <View style={styles.qBadge}>
            <Text style={styles.qBadgeText}>Q</Text>
          </View>
          <Text style={styles.qText}>{q?.text}</Text>
          {showHint && q && (
            <Animated.View style={[styles.hintBox, { opacity: hintIntro, transform: [{ translateY: hintTranslateY }] }]}>
              <View style={styles.hintContent}>
                <IconImage source={ICON_HINT} size={22} />
                <Text style={styles.hintText}>{q.hint}</Text>
              </View>
            </Animated.View>
          )}
          <View style={[styles.peekMascot, styles.noPointerEvents]}>
            <AnimatedMascot animal={mascot.animal} size={72} mood={mascotMood} reactionKey={mascotReaction} />
          </View>
        </Animated.View>

        {/* 入力表示 */}
        <View style={styles.inputBox}>
          {input.length > 0 ? <Text style={styles.inputText}>{input}</Text> : <Text style={styles.inputPlaceholder}>ひらがなで こたえてね</Text>}
          <Caret />
        </View>

        {/* 補助ボタン */}
        <View style={styles.subRow}>
          <Pressable
            style={({ pressed }) => [styles.hintBtn, pressed && !reducedMotion && styles.subBtnPressed, (hintsRef.current <= 0 || showHint) && styles.subBtnDisabled]}
            onPress={useHint}
          >
            <IconImage source={ICON_HINT} size={24} style={styles.subBtnIcon} />
            <Text style={styles.hintBtnText}>ヒント</Text>
            <View style={styles.hintCount}>
              <Text style={styles.hintCountText}>{hintsRef.current}</Text>
            </View>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.skipBtn, pressed && !reducedMotion && styles.subBtnPressed]} onPress={skip}>
            <IconImage source={ICON_SKIP} size={24} style={styles.subBtnIcon} />
            <Text style={styles.skipBtnText}>スキップ</Text>
            <Text style={styles.skipPenaltyText}>−{G.skipPenalty}秒</Text>
          </Pressable>
        </View>
      </View>

      {/* キーボード */}
      <FlickKeyboard onChar={pressKey} onCycle={onCycle} onDelete={onDel} onSubmit={submit} />

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
          <View style={[styles.fbBubble, { backgroundColor: feedback.kind === 'correct' ? COLORS.success : COLORS.danger }]}>
            <Text style={styles.fbText}>{feedback.kind === 'correct' ? 'せいかい！' : 'ざんねん…'}</Text>
            <Text style={styles.fbDelta}>{feedback.delta > 0 ? `+${feedback.delta}` : feedback.delta}秒</Text>
          </View>
        </Animated.View>
      )}

      {/* 紙吹雪（正解のたびに再生・終わったら消える） */}
      {burst > 0 && (
        <OneShot key={'c' + burst} source={CONFETTI} width={WIN.width} height={WIN.height} style={styles.confettiLayer} ms={5200} disabled={reducedMotion} />
      )}
    </View>
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

  return (
    <View style={{ flex: 1, width: '100%' }}>
      {result.isNewRecord && (
        <OneShot key="rconf" source={CONFETTI} width={WIN.width} height={WIN.height} style={styles.confettiLayer} ms={5200} disabled={reducedMotion} />
      )}
      <ScrollView contentContainerStyle={styles.resultScroll}>
        <Animated.View style={{ transform: [{ scale: pop }], alignItems: 'center', width: '100%' }}>
          <Text style={styles.resultTitle}>{result.isNewRecord ? '新記録！' : 'おつかれさま！'}</Text>
        </Animated.View>

        <Animated.View style={{ opacity: pop, alignItems: 'center', width: '100%' }}>
          <AnimatedMascot animal={mascot.animal} size={160} mood={resultMood} reactionKey={1} />
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: pop }], alignItems: 'center', width: '100%' }}>
          <View style={styles.resultScoreCard}>
            <Ribbon label="正解数" color={COLORS.primary} tail={COLORS.primaryDark} />
            <View style={styles.scoreRow}>
              <IconImage source={ICON_LAUREL} size={38} style={styles.scoreLaurel} />
              <Text style={styles.resultScore}>
                {shownScore}
                <Text style={styles.resultScoreUnit}>問</Text>
              </Text>
              <IconImage source={ICON_LAUREL} size={38} style={[styles.scoreLaurel, { transform: [{ scaleX: -1 }] }]} />
            </View>
            <View style={styles.resultHighRow}>
              <IconImage source={ICON_CROWN} size={24} style={styles.resultHighIcon} />
              <Text style={styles.resultHigh}>ハイスコア {Math.max(highScore, result.score)}問</Text>
            </View>
          </View>
        </Animated.View>

        {result.wrongs.length > 0 && (
          <View style={styles.reviewBox}>
            <Ribbon label="ふりかえり" color={COLORS.purple} tail="#7B5FC0" />
            <View style={styles.reviewTagRow}>
              <View style={styles.reviewTag}>
                <Text style={styles.reviewTagText}>スキップした問題（{result.wrongs.length}問）</Text>
              </View>
            </View>
            {result.wrongs.map((w, i) => (
              <View key={i} style={[styles.reviewItem, i > 0 && styles.reviewItemDivider]}>
                <Text style={styles.reviewQ}>{w.text}</Text>
                <Text style={styles.reviewA}>
                  こたえ：<Text style={{ color: COLORS.primary }}>{w.answer}</Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        <BigButton label="もう一度あそぶ" icon={ICON_RETRY} color={COLORS.primary} onPress={onRetry} />
        <BigButton label="結果をシェア" icon={ICON_SHARE} color={COLORS.teal} onPress={shareResult} />
        <Pressable onPress={onHome} style={styles.homeLink}>
          <Text style={styles.homeLinkText}>ホームへもどる</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ───────────────────────── 共通ボタン ─────────────────────────
function BigButton({ label, color, icon, onPress }: { label: string; color: string; icon?: number; onPress: () => void }) {
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => {
        if (!reducedMotion) Animated.spring(scale, { toValue: 0.96, useNativeDriver: false }).start();
      }}
      onPressOut={() => {
        if (!reducedMotion) Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: false }).start();
      }}
      onPress={onPress}
      style={{ width: '100%', maxWidth: 420 }}
    >
      <Animated.View style={[styles.bigBtn, { backgroundColor: color, transform: [{ scale }] }]}>
        <Text style={styles.bigBtnText}>{label}</Text>
        {icon ? <IconImage source={icon} size={24} style={styles.bigBtnIcon} /> : null}
      </Animated.View>
    </Pressable>
  );
}

// ───────────────────────── スタイル ─────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  noPointerEvents: { pointerEvents: 'none' },
  muteBtn: { position: 'absolute', top: 10, right: 12, zIndex: 200, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  confettiLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 150, alignItems: 'center', justifyContent: 'flex-start' },
  levelupBadge: { position: 'absolute', top: -52, left: 0, right: 0, alignItems: 'center', zIndex: 50 },

  // 共通：リボン
  ribbonWrap: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center' },
  ribbon: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 8 },
  ribbonText: { color: '#fff', fontWeight: '900', fontFamily: FONTS.black, fontSize: 14, letterSpacing: 0.5 },
  ribbonTailL: { width: 0, height: 0, borderTopWidth: 10, borderBottomWidth: 10, borderRightWidth: 10, borderTopColor: 'transparent', borderBottomColor: 'transparent', marginRight: -3 },
  ribbonTailR: { width: 0, height: 0, borderTopWidth: 10, borderBottomWidth: 10, borderLeftWidth: 10, borderTopColor: 'transparent', borderBottomColor: 'transparent', marginLeft: -3 },

  // ホーム
  homeScroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 26, paddingHorizontal: 22, gap: 12, width: '100%', maxWidth: 460, alignSelf: 'center' },
  heroStage: { width: 190, height: 176, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  logoBlock: { alignItems: 'center', gap: 6 },
  logoRow: { flexDirection: 'row', marginTop: 2 },
  logoLetter: { fontSize: 58, fontWeight: '900', fontFamily: FONTS.black, letterSpacing: -1, textShadowColor: 'rgba(0,0,0,0.12)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 2 },
  howCard: {
    backgroundColor: COLORS.card, borderRadius: 24, paddingHorizontal: 18, paddingTop: 26, paddingBottom: 18, width: '100%', maxWidth: 420, gap: 12, marginTop: 8,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 3,
  },
  howTab: { position: 'absolute', top: -14, alignSelf: 'center', backgroundColor: '#F6D9A8', paddingHorizontal: 18, paddingVertical: 5, borderRadius: 14 },
  howTabText: { fontWeight: '900', fontFamily: FONTS.black, color: '#9A6A2A', fontSize: 13 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ruleIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  ruleIconImage: { marginVertical: -3 },
  ruleTitle: { fontSize: 15, fontWeight: '900', fontFamily: FONTS.black, color: COLORS.ink },
  ruleSub: { fontSize: 11.5, fontWeight: '600', fontFamily: FONTS.medium, color: COLORS.inkSoft, marginTop: 1 },

  highPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFDF7', borderRadius: 18, paddingHorizontal: 22, paddingVertical: 12, marginTop: 4,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  highLabel: { fontSize: 14, color: COLORS.inkSoft, fontWeight: '800', fontFamily: FONTS.exbold },
  highIcon: { marginVertical: -5 },
  highValue: { fontSize: 24, color: COLORS.primary, fontWeight: '900', fontFamily: FONTS.black, marginLeft: 4 },
  highUnit: { fontSize: 14, color: COLORS.primary, fontWeight: '900', fontFamily: FONTS.black },

  // ゲーム
  gameRoot: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  gameTop: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingTop: 24, gap: 11 },

  hud: { flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-between', width: '100%', maxWidth: 430, gap: 8 },
  hudCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 16, paddingTop: 18, paddingBottom: 8, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  hudTab: { position: 'absolute', top: -9, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10 },
  hudTabText: { color: '#fff', fontWeight: '900', fontFamily: FONTS.black, fontSize: 11 },
  hudValue: { fontSize: 24, color: COLORS.ink, fontWeight: '900', fontFamily: FONTS.black },
  hudUnit: { fontSize: 12, fontWeight: '900', fontFamily: FONTS.black },
  hudLevel: {
    flex: 1.15, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 3,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  hudLevelText: { color: '#fff', fontWeight: '900', fontFamily: FONTS.black, fontSize: 13 },

  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '100%', maxWidth: 430 },
  barTrack: { flex: 1, height: 12, backgroundColor: COLORS.track, borderRadius: 7, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 7 },

  qCard: {
    backgroundColor: COLORS.card, borderRadius: 22, paddingHorizontal: 22, paddingVertical: 26, width: '100%', maxWidth: 430, minHeight: 120, justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  qBadge: { position: 'absolute', top: -12, left: 16, width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.teal, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: COLORS.bg },
  qBadgeText: { color: '#fff', fontWeight: '900', fontFamily: FONTS.black, fontSize: 15 },
  qText: { fontSize: 20, lineHeight: 30, fontWeight: '800', fontFamily: FONTS.exbold, color: COLORS.ink, textAlign: 'center' },
  hintBox: { marginTop: 14, backgroundColor: '#FFF6D6', borderRadius: 14, padding: 12 },
  hintContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  hintText: { flex: 1, fontSize: 14, color: '#9A7B00', fontWeight: '700', fontFamily: FONTS.bold, textAlign: 'center' },
  peekOwl: { position: 'absolute', right: 4, bottom: -14, width: 58, height: 58 },
  peekMascot: { position: 'absolute', right: -4, bottom: -20, width: 78, height: 78, alignItems: 'center', justifyContent: 'center' },

  inputBox: {
    width: '100%', maxWidth: 430, minHeight: 52, backgroundColor: '#fff', borderRadius: 16, borderWidth: 2, borderColor: COLORS.track,
    paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  inputText: { fontSize: 23, fontWeight: '800', fontFamily: FONTS.exbold, color: COLORS.ink, letterSpacing: 1 },
  inputPlaceholder: { fontSize: 17, fontWeight: '700', fontFamily: FONTS.bold, color: COLORS.inkSoft },
  caret: { width: 2, height: 24, backgroundColor: COLORS.primary, marginLeft: 3, borderRadius: 1 },

  subRow: { flexDirection: 'row', gap: 10, width: '100%', maxWidth: 430 },
  hintBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.yellow, borderRadius: 14, paddingVertical: 11 },
  subBtnIcon: { marginVertical: -4 },
  hintBtnText: { fontWeight: '900', fontFamily: FONTS.black, color: '#fff', fontSize: 14 },
  hintCount: { backgroundColor: '#7A5A00', minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  hintCountText: { color: '#fff', fontWeight: '900', fontFamily: FONTS.black, fontSize: 12 },
  skipBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.danger, borderRadius: 14, paddingVertical: 11 },
  skipBtnText: { fontWeight: '900', fontFamily: FONTS.black, color: '#fff', fontSize: 14 },
  skipPenaltyText: { fontWeight: '900', fontFamily: FONTS.black, color: '#fff', fontSize: 12, opacity: 0.85 },
  subBtnDisabled: { opacity: 0.45 },
  subBtnPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },

  bigBtn: { borderRadius: 18, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, width: '100%', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  bigBtnText: { color: '#fff', fontSize: 19, fontWeight: '900', fontFamily: FONTS.black, letterSpacing: 1 },
  bigBtnIcon: { marginVertical: -4 },

  // フィードバック
  fbOverlay: { position: 'absolute', top: '30%', left: 0, right: 0, alignItems: 'center' },
  fbBubble: { paddingHorizontal: 30, paddingVertical: 16, borderRadius: 22, alignItems: 'center' },
  fbText: { color: '#fff', fontSize: 26, fontWeight: '900', fontFamily: FONTS.black },
  fbDelta: { color: '#fff', fontSize: 17, fontWeight: '800', fontFamily: FONTS.exbold, marginTop: 2 },

  // 結果
  resultScroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 36, paddingHorizontal: 22, gap: 14, width: '100%', maxWidth: 460, alignSelf: 'center' },
  resultTitle: { fontSize: 32, fontWeight: '900', fontFamily: FONTS.black, color: COLORS.primary, textShadowColor: 'rgba(0,0,0,0.12)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 2, marginBottom: 4 },
  resultScoreCard: {
    backgroundColor: COLORS.card, borderRadius: 24, paddingVertical: 22, paddingHorizontal: 40, alignItems: 'center', marginTop: 8, gap: 6,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreLaurel: { marginHorizontal: -4 },
  resultScore: { fontSize: 64, fontWeight: '900', fontFamily: FONTS.black, color: COLORS.primary, lineHeight: 70 },
  resultScoreUnit: { fontSize: 24 },
  resultHighRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  resultHighIcon: { marginVertical: -5 },
  resultHigh: { fontSize: 15, color: COLORS.inkSoft, fontWeight: '800', fontFamily: FONTS.exbold },

  reviewBox: {
    backgroundColor: COLORS.card, borderRadius: 20, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 16, width: '100%', maxWidth: 420, gap: 8,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3,
  },
  reviewTagRow: { flexDirection: 'row' },
  reviewTag: { backgroundColor: '#EDEAF6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  reviewTagText: { fontSize: 11, fontWeight: '800', fontFamily: FONTS.exbold, color: COLORS.purple },
  reviewItem: { gap: 2 },
  reviewItemDivider: { borderTopWidth: 1, borderTopColor: '#EFEDF5', paddingTop: 9, marginTop: 1 },
  reviewQ: { fontSize: 14, color: COLORS.ink, fontWeight: '700', fontFamily: FONTS.bold, lineHeight: 21 },
  reviewA: { fontSize: 15, color: COLORS.ink, fontWeight: '800', fontFamily: FONTS.exbold },
  reviewMore: { fontSize: 12, color: COLORS.inkSoft, fontWeight: '700', fontFamily: FONTS.bold, marginTop: 2 },

  homeLink: { paddingVertical: 8 },
  homeLinkText: { color: COLORS.inkSoft, fontWeight: '800', fontFamily: FONTS.exbold, fontSize: 15 },
});
