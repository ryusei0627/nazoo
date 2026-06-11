// コードだけで作る動物マスコット（SVG＋RN Animated）。
// プロの正攻法「ベクター図形＋コードでトゥイーン」方式。Web/iOS両対応、課金・外部素材不要。
// 動物を増やすときは ART に絵を1つ足すだけ（アニメ基盤＝浮遊・スクワッシュ・まばたきは共通）。
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, {
  Ellipse,
  Circle,
  Polygon,
  Path,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { MOTION, useReducedMotion } from './motion';

export type AnimalKey = 'penguin' | 'monkey' | 'elephant' | 'lion';
export type MascotMood = 'idle' | 'happy' | 'thinking' | 'wrong' | 'celebrate' | 'tired';

type ArtProps = { size: number; eyesShut: boolean; mood: MascotMood };

// ── 全動物で共通のパーツ（統一感のため）──
function Eyes({ lx, rx, y, eyesShut }: { lx: number; rx: number; y: number; eyesShut: boolean }) {
  if (eyesShut) {
    return (
      <>
        <Path d={`M${lx - 5} ${y} Q${lx} ${y + 4} ${lx + 5} ${y}`} stroke="#2A2320" strokeWidth="1.9" strokeLinecap="round" fill="none" />
        <Path d={`M${rx - 5} ${y} Q${rx} ${y + 4} ${rx + 5} ${y}`} stroke="#2A2320" strokeWidth="1.9" strokeLinecap="round" fill="none" />
      </>
    );
  }
  return (
    <>
      <Ellipse cx={lx} cy={y} rx="5" ry="5.6" fill="#231E1B" />
      <Ellipse cx={rx} cy={y} rx="5" ry="5.6" fill="#231E1B" />
      <Circle cx={lx + 2} cy={y - 2.4} r="1.9" fill="#FFFFFF" />
      <Circle cx={rx + 2} cy={y - 2.4} r="1.9" fill="#FFFFFF" />
      <Circle cx={lx - 1.7} cy={y + 2.4} r="1" fill="#FFFFFF" opacity="0.85" />
      <Circle cx={rx - 1.7} cy={y + 2.4} r="1" fill="#FFFFFF" opacity="0.85" />
    </>
  );
}

function Cheeks({ lx, rx, y, grad }: { lx: number; rx: number; y: number; grad: string }) {
  return (
    <>
      <Ellipse cx={lx} cy={y} rx="6.2" ry="4.1" fill={`url(#${grad})`} />
      <Ellipse cx={rx} cy={y} rx="6.2" ry="4.1" fill={`url(#${grad})`} />
    </>
  );
}

function Bowtie({ cx, cy }: { cx: number; cy: number }) {
  return (
    <>
      <Polygon points={`${cx},${cy} ${cx - 10.5},${cy - 5.5} ${cx - 10.5},${cy + 5.5}`} fill="#3094DC" />
      <Polygon points={`${cx},${cy} ${cx + 10.5},${cy - 5.5} ${cx + 10.5},${cy + 5.5}`} fill="#3094DC" />
      <Circle cx={cx} cy={cy} r="2.8" fill="#1F6FB0" />
    </>
  );
}

// ── ペンギン（owlと同じ青い蝶ネクタイで世界観を統一）──
function Penguin({ size, eyesShut }: ArtProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="pgBody" x1="0.3" y1="0" x2="0.7" y2="1">
          <Stop offset="0" stopColor="#52637B" />
          <Stop offset="0.55" stopColor="#3A485B" />
          <Stop offset="1" stopColor="#2A3543" />
        </LinearGradient>
        <LinearGradient id="pgWing" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#33414F" />
          <Stop offset="1" stopColor="#202B36" />
        </LinearGradient>
        <LinearGradient id="pgBelly" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#FBEDD8" />
        </LinearGradient>
        <LinearGradient id="pgBeak" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFC65E" />
          <Stop offset="1" stopColor="#EE9A2C" />
        </LinearGradient>
        <LinearGradient id="pgFoot" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F6AC3E" />
          <Stop offset="1" stopColor="#E08E26" />
        </LinearGradient>
        <RadialGradient id="pgCheek" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#F4A29B" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#F4A29B" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="pgHeadSheen" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#7686A0" stopOpacity="0.55" />
          <Stop offset="1" stopColor="#7686A0" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="pgBellySheen" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.75" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* 足（水かき・体の前にちょこんと） */}
      <Path d="M30 87 C24 88 22 93 25 96 C26.4 97.2 28 96.2 29 95.1 L30.6 96.6 C31.7 97.6 33.6 97.1 34.3 95.6 C35.6 92.5 34.2 88 30 87 Z" fill="url(#pgFoot)" />
      <Path d="M70 87 C76 88 78 93 75 96 C73.6 97.2 72 96.2 71 95.1 L69.4 96.6 C68.3 97.6 66.4 97.1 65.7 95.6 C64.4 92.5 65.8 88 70 87 Z" fill="url(#pgFoot)" />
      <Path d="M30.3 95.1 L30.6 92" stroke="#C97E22" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
      <Path d="M69.7 95.1 L69.4 92" stroke="#C97E22" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />

      {/* 羽（フリッパー・bodyに沿わせてなめらかに） */}
      <Path d="M25 44 C15 47 12 61 18 71 C22 68 27 58 30 51 C29 47 28 45 25 44 Z" fill="url(#pgWing)" />
      <Path d="M75 44 C85 47 88 61 82 71 C78 68 73 58 70 51 C71 47 72 45 75 44 Z" fill="url(#pgWing)" />
      {/* 羽の内側ハイライト */}
      <Path d="M27 48 C20 52 18 61 20 68" stroke="#4F5F72" strokeOpacity="0.55" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <Path d="M73 48 C80 52 82 61 80 68" stroke="#4F5F72" strokeOpacity="0.55" strokeWidth="1.3" strokeLinecap="round" fill="none" />

      {/* 体 */}
      <Ellipse cx="50" cy="54" rx="30" ry="38" fill="url(#pgBody)" />
      {/* 体の下部・接地アンビエント */}
      <Ellipse cx="50" cy="82" rx="25" ry="13" fill="#1F2A35" opacity="0.28" />
      {/* 左の淡いリムライト */}
      <Ellipse cx="28" cy="48" rx="4.5" ry="20" fill="#6E7F96" opacity="0.30" />
      {/* 頭のツヤ */}
      <Ellipse cx="40" cy="28" rx="15" ry="11" fill="url(#pgHeadSheen)" />

      {/* おなか／顔（白） */}
      <Path d="M50 31 C32 31 30 50 30 62 C30 80 39 90 50 90 C61 90 70 80 70 62 C70 50 68 31 50 31 Z" fill="url(#pgBelly)" />
      {/* おなかのツヤ（左上のグロス） */}
      <Ellipse cx="41" cy="62" rx="7" ry="10" fill="url(#pgBellySheen)" />

      {/* ほっぺ（ソフトぼかし） */}
      <Ellipse cx="34" cy="57" rx="6.2" ry="4.1" fill="url(#pgCheek)" />
      <Ellipse cx="66" cy="57" rx="6.2" ry="4.1" fill="url(#pgCheek)" />

      {/* 目（まばたきで open/close 切替） */}
      {eyesShut ? (
        <>
          <Path d="M38 46 Q43 50 48 46" stroke="#2A2320" strokeWidth="1.9" strokeLinecap="round" fill="none" />
          <Path d="M52 46 Q57 50 62 46" stroke="#2A2320" strokeWidth="1.9" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          {/* 瞳 */}
          <Ellipse cx="43" cy="46" rx="5" ry="5.6" fill="#231E1B" />
          <Ellipse cx="57" cy="46" rx="5" ry="5.6" fill="#231E1B" />
          {/* メインのキャッチライト */}
          <Circle cx="45" cy="43.6" r="1.9" fill="#FFFFFF" />
          <Circle cx="59" cy="43.6" r="1.9" fill="#FFFFFF" />
          {/* サブのキャッチライト */}
          <Circle cx="41.3" cy="48.4" r="1" fill="#FFFFFF" opacity="0.85" />
          <Circle cx="55.3" cy="48.4" r="1" fill="#FFFFFF" opacity="0.85" />
        </>
      )}

      {/* くちばし（丸み・二色＋陰影） */}
      <Path
        d="M50 51 C53.6 51 56 53.1 56 55.3 C56 58.1 53 60.9 50 61.6 C47 60.9 44 58.1 44 55.3 C44 53.1 46.4 51 50 51 Z"
        fill="url(#pgBeak)"
      />
      <Path d="M44.6 55.5 Q50 57.2 55.4 55.5" stroke="#D9871F" strokeWidth="0.9" strokeLinecap="round" fill="none" />
      <Circle cx="47.6" cy="54" r="0.9" fill="#FFE0A0" opacity="0.8" />

      {/* 青い蝶ネクタイ */}
      <Polygon points="50,70 39.5,64.5 39.5,75.5" fill="#3094DC" />
      <Polygon points="50,70 60.5,64.5 60.5,75.5" fill="#3094DC" />
      <Path d="M41 66 L41 74" stroke="#7FC2F0" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
      <Path d="M59 66 L59 74" stroke="#7FC2F0" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
      <Circle cx="50" cy="70" r="2.8" fill="#1F6FB0" />
    </Svg>
  );
}

// ── さる ──
function Monkey({ size, eyesShut }: ArtProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="mkBody" x1="0.3" y1="0" x2="0.7" y2="1">
          <Stop offset="0" stopColor="#A6724B" />
          <Stop offset="1" stopColor="#7B5031" />
        </LinearGradient>
        <RadialGradient id="mkCheek" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#E8908A" stopOpacity="0.85" />
          <Stop offset="1" stopColor="#E8908A" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* 足 */}
      <Ellipse cx="40" cy="92" rx="8" ry="4.5" fill="#7B5031" />
      <Ellipse cx="60" cy="92" rx="8" ry="4.5" fill="#7B5031" />
      {/* 手（体脇） */}
      <Ellipse cx="22" cy="64" rx="6" ry="11" fill="#8B5C3A" />
      <Ellipse cx="78" cy="64" rx="6" ry="11" fill="#8B5C3A" />
      {/* 耳 */}
      <Circle cx="19" cy="44" r="11" fill="#8B5C3A" />
      <Circle cx="81" cy="44" r="11" fill="#8B5C3A" />
      <Circle cx="19" cy="44" r="6.5" fill="#E8C9A2" />
      <Circle cx="81" cy="44" r="6.5" fill="#E8C9A2" />
      {/* 体・頭 */}
      <Ellipse cx="50" cy="56" rx="28" ry="35" fill="url(#mkBody)" />
      {/* 顔（ベージュ） */}
      <Path d="M50 34 C34 34 32 50 32 60 C32 75 40 83 50 83 C60 83 68 75 68 60 C68 50 66 34 50 34 Z" fill="#F1D5AE" />
      {/* 前髪のちょい毛 */}
      <Path d="M47 35 Q49 30 51 35" stroke="#7B5031" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <Path d="M51 35 Q53 30.5 55 35" stroke="#7B5031" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <Cheeks lx={37} rx={63} y={61} grad="mkCheek" />
      <Eyes lx={43} rx={57} y={50} eyesShut={eyesShut} />
      {/* 鼻・口（マズルの明るい楕円は無し＝顔に見えないように） */}
      <Ellipse cx="50" cy="59" rx="2" ry="1.5" fill="#B98B5E" opacity="0.7" />
      <Path d="M44 62.5 Q50 67 56 62.5" stroke="#6B4A30" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <Bowtie cx={50} cy={76} />
    </Svg>
  );
}

// ── ぞう ──
function Elephant({ size, eyesShut }: ArtProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="elBody" x1="0.3" y1="0" x2="0.7" y2="1">
          <Stop offset="0" stopColor="#AEBBC8" />
          <Stop offset="1" stopColor="#8794A2" />
        </LinearGradient>
        <RadialGradient id="elCheek" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#E89A94" stopOpacity="0.8" />
          <Stop offset="1" stopColor="#E89A94" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* 足 */}
      <Ellipse cx="38" cy="92" rx="9" ry="5" fill="#8794A2" />
      <Ellipse cx="62" cy="92" rx="9" ry="5" fill="#8794A2" />
      {/* 耳（大きい） */}
      <Ellipse cx="17" cy="50" rx="14" ry="18" fill="#9DAAB7" />
      <Ellipse cx="83" cy="50" rx="14" ry="18" fill="#9DAAB7" />
      <Ellipse cx="20" cy="51" rx="8" ry="12" fill="#E7BDBD" opacity="0.75" />
      <Ellipse cx="80" cy="51" rx="8" ry="12" fill="#E7BDBD" opacity="0.75" />
      {/* 体・頭 */}
      <Ellipse cx="50" cy="55" rx="27" ry="35" fill="url(#elBody)" />
      <Cheeks lx={32} rx={68} y={56} grad="elCheek" />
      <Eyes lx={41} rx={59} y={46} eyesShut={eyesShut} />
      {/* 鼻（トランク）下→右へカール */}
      <Path d="M50 58 C49 65 47 72 53 73 C58 74 61 70 59 65" stroke="#9DAAB7" strokeWidth="9" strokeLinecap="round" fill="none" />
      <Ellipse cx="58.5" cy="65.5" rx="1" ry="1.3" fill="#5E6B79" />
      <Bowtie cx={50} cy={82} />
    </Svg>
  );
}

// ── ライオン ──
const LION_MANE: [number, number][] = [
  [78, 48], [74.2, 62], [64, 72.2], [50, 76], [36, 72.2], [25.8, 62],
  [22, 48], [25.8, 34], [36, 23.8], [50, 20], [64, 23.8], [74.2, 34],
];
function Lion({ size, eyesShut }: ArtProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="liMane" x1="0.3" y1="0" x2="0.7" y2="1">
          <Stop offset="0" stopColor="#F0A24A" />
          <Stop offset="1" stopColor="#D77C29" />
        </LinearGradient>
        <RadialGradient id="liCheek" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#E8908A" stopOpacity="0.85" />
          <Stop offset="1" stopColor="#E8908A" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* 足 */}
      <Ellipse cx="40" cy="93" rx="7.5" ry="4.5" fill="#EBC388" />
      <Ellipse cx="60" cy="93" rx="7.5" ry="4.5" fill="#EBC388" />
      {/* たてがみ（円を放射状に） */}
      {LION_MANE.map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r="10" fill="url(#liMane)" />
      ))}
      {/* 体（マネの下） */}
      <Ellipse cx="50" cy="80" rx="17" ry="14" fill="#F2CE92" />
      {/* 腕（小さなお手て・他の動物と揃える） */}
      <Ellipse cx="32" cy="82" rx="5.5" ry="9" fill="#EBC388" transform="rotate(14 32 82)" />
      <Ellipse cx="68" cy="82" rx="5.5" ry="9" fill="#EBC388" transform="rotate(-14 68 82)" />
      {/* 耳 */}
      <Circle cx="34" cy="28" r="6" fill="#E2A85A" />
      <Circle cx="66" cy="28" r="6" fill="#E2A85A" />
      {/* 顔 */}
      <Circle cx="50" cy="48" r="23" fill="#F4D9A6" />
      <Circle cx="34" cy="28" r="3" fill="#F6E0B4" />
      <Circle cx="66" cy="28" r="3" fill="#F6E0B4" />
      <Cheeks lx={33} rx={67} y={52} grad="liCheek" />
      <Eyes lx={42} rx={58} y={46} eyesShut={eyesShut} />
      {/* マズル */}
      <Ellipse cx="50" cy="56" rx="12" ry="8.5" fill="#FBEBD0" />
      <Path d="M46.5 53 L53.5 53 L50 56.5 Z" fill="#7A5230" />
      <Path d="M50 56.5 L50 59" stroke="#7A5230" strokeWidth="1.3" strokeLinecap="round" />
      <Path d="M50 59 Q46 61 44 58.5" stroke="#7A5230" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <Path d="M50 59 Q54 61 56 58.5" stroke="#7A5230" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <Bowtie cx={50} cy={80} />
    </Svg>
  );
}

const ART: Record<AnimalKey, (p: ArtProps) => React.ReactElement> = {
  penguin: Penguin,
  monkey: Monkey,
  elephant: Elephant,
  lion: Lion,
};

function MoodMarks({ mood, size, active }: { mood: MascotMood; size: number; active: Animated.Value }) {
  const pop = active.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });
  const lift = active.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  if (mood === 'happy' || mood === 'celebrate') {
    return (
      <Animated.View
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          top: size * 0.06,
          right: size * 0.06,
          opacity: active,
          transform: [{ translateY: lift }, { scale: pop }, { rotate: '-9deg' }],
        }}
      >
        <Text style={{ color: '#FFC23D', fontSize: Math.max(18, size * 0.18), fontWeight: '900' }}>✦</Text>
      </Animated.View>
    );
  }

  if (mood === 'thinking') {
    return (
      <Animated.View
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          top: size * 0.04,
          right: size * 0.06,
          opacity: active,
          transform: [{ translateY: lift }, { scale: pop }],
        }}
      >
        <View
          style={{
            minWidth: size * 0.22,
            height: size * 0.22,
            borderRadius: size * 0.11,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <Text style={{ color: '#9B7EDE', fontSize: Math.max(15, size * 0.14), fontWeight: '900' }}>?</Text>
        </View>
      </Animated.View>
    );
  }

  if (mood === 'wrong' || mood === 'tired') {
    return (
      <Animated.View
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          top: size * 0.1,
          left: size * 0.05,
          opacity: active,
          transform: [{ translateY: lift }, { scale: pop }, { rotate: '11deg' }],
        }}
      >
        <Text style={{ color: '#6BC5F5', fontSize: Math.max(17, size * 0.16), fontWeight: '900' }}>…</Text>
      </Animated.View>
    );
  }

  return null;
}

export default function AnimatedMascot({
  animal,
  size = 160,
  mood = 'idle',
  reactionKey = 0,
}: {
  animal: AnimalKey;
  size?: number;
  mood?: MascotMood;
  reactionKey?: number;
}) {
  const reducedMotion = useReducedMotion();
  const bob = useRef(new Animated.Value(0)).current;
  const intro = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const react = useRef(new Animated.Value(0)).current;
  const lean = useRef(new Animated.Value(0)).current;
  const mark = useRef(new Animated.Value(mood === 'idle' ? 0 : 1)).current;
  const [eyesShut, setEyesShut] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      bob.setValue(0);
      return;
    }
    // ふわふわ上下（RNWはループ＋useNativeDriver:trueでフリーズするので false）
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(bob, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    );
    float.start();
    return () => float.stop();
  }, [bob, reducedMotion]);

  useEffect(() => {
    // ときどきまばたき（state切替・SVGの再描画のみ）
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setEyesShut(true);
        t = setTimeout(() => {
          setEyesShut(false);
          loop();
        }, 110);
      }, 2600);
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // 登場でぴょこっ（スプリングの行き過ぎでバウンド感）
    if (reducedMotion) {
      intro.setValue(1);
      return;
    }
    Animated.spring(intro, { toValue: 1, friction: 5, tension: 130, useNativeDriver: false }).start();
    // ときどき嬉しそうにジャンプ（着地はバウンド）
    const jump = Animated.loop(
      Animated.sequence([
        Animated.delay(mood === 'celebrate' ? 1500 : 3600),
        Animated.timing(hop, { toValue: 1, duration: 210, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(hop, { toValue: 0, duration: 360, easing: Easing.bounce, useNativeDriver: false }),
      ])
    );
    jump.start();
    return () => jump.stop();
  }, [intro, hop, mood, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || reactionKey === 0) return;
    react.stopAnimation();
    lean.stopAnimation();
    mark.stopAnimation();
    react.setValue(0);
    lean.setValue(0);
    mark.setValue(0);

    const reactAnim =
      mood === 'wrong' || mood === 'tired'
        ? Animated.sequence([
            Animated.timing(lean, { toValue: 1, duration: 90, easing: MOTION.easeOut, useNativeDriver: false }),
            Animated.timing(lean, { toValue: -1, duration: 120, easing: MOTION.easeInOut, useNativeDriver: false }),
            Animated.timing(lean, { toValue: 0.35, duration: 110, easing: MOTION.easeInOut, useNativeDriver: false }),
            Animated.spring(lean, { toValue: 0, friction: 5, tension: 110, useNativeDriver: false }),
          ])
        : Animated.sequence([
            Animated.timing(react, { toValue: 1, duration: 180, easing: MOTION.playful, useNativeDriver: false }),
            Animated.spring(react, { toValue: 0, friction: 5, tension: 120, useNativeDriver: false }),
          ]);

    Animated.parallel([
      reactAnim,
      Animated.sequence([
        Animated.timing(mark, { toValue: 1, duration: 130, easing: MOTION.easeOut, useNativeDriver: false }),
        Animated.delay(mood === 'thinking' ? 900 : 520),
        Animated.timing(mark, { toValue: 0, duration: 240, easing: MOTION.easeInOut, useNativeDriver: false }),
      ]),
    ]).start();
  }, [lean, mark, mood, react, reactionKey, reducedMotion]);

  useEffect(() => {
    if (mood === 'idle' || reducedMotion) {
      mark.setValue(0);
      return;
    }
    mark.setValue(mood === 'thinking' ? 0.85 : 0.55);
  }, [mark, mood, reducedMotion]);

  const introScale = intro.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const hopY = hop.interpolate({ inputRange: [0, 1], outputRange: [0, mood === 'celebrate' ? -18 : -10] });
  const shadowScale = hop.interpolate({ inputRange: [0, 1], outputRange: [1, 0.72] });
  const shadowOpacity = hop.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] });
  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [3, mood === 'thinking' ? -4 : -6] });
  // 浮遊に合わせた軽い伸び縮み（単一軸変換のみ＝RNW安全）
  const scaleY = bob.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.03] });
  const scaleX = bob.interpolate({ inputRange: [0, 1], outputRange: [1.02, 0.99] });
  const reactionY = react.interpolate({ inputRange: [0, 1], outputRange: [0, mood === 'celebrate' ? -22 : -14] });
  const reactionScale = react.interpolate({ inputRange: [0, 1], outputRange: [1, mood === 'thinking' ? 1.02 : 1.1] });
  const leanRotate = lean.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-8deg', mood === 'thinking' ? '4deg' : '0deg', '8deg'] });
  const moodRotate = mood === 'thinking' ? '4deg' : mood === 'wrong' || mood === 'tired' ? '-3deg' : '0deg';

  const Art = ART[animal] ?? Penguin;

  return (
    <View style={{ width: size, height: size }}>
      {/* 接地のソフト影（ジャンプで縮む＝立体感） */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: size * 0.05,
          alignItems: 'center',
          opacity: shadowOpacity,
          transform: [{ scaleX: shadowScale }],
        }}
      >
        <Svg width={size * 0.6} height={size * 0.14} viewBox="0 0 100 24">
          <Defs>
            <RadialGradient id="mascotShadow" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor="#39455A" stopOpacity="0.26" />
              <Stop offset="1" stopColor="#39455A" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx="50" cy="12" rx="48" ry="10" fill="url(#mascotShadow)" />
        </Svg>
      </Animated.View>

      {/* 登場ぴょこっ → 定期ジャンプ → ふだんの浮遊＋伸び縮み（入れ子で各1変換＝RNW安全） */}
      <MoodMarks mood={mood} size={size} active={mark} />

      <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, transform: [{ scale: introScale }] }}>
        <Animated.View style={{ width: size, height: size, transform: [{ translateY: reactionY }, { scale: reactionScale }, { rotate: leanRotate }] }}>
        <Animated.View style={{ width: size, height: size, transform: [{ translateY: hopY }, { rotate: moodRotate }] }}>
          <Animated.View
            style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', transform: [{ translateY }, { scaleX }, { scaleY }] }}
          >
            <Art size={size} eyesShut={eyesShut || mood === 'happy' || mood === 'celebrate'} mood={mood} />
          </Animated.View>
        </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
