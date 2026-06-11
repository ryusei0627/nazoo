// Nazoo — 新マスコット（ぷにぷにブロブ動物・SVG＋RN Animated）
// Lv1 ぴよ(chick) / Lv2 みみ(rabbit) / Lv3 らんらん(panda) / Lv4 はかせ(owl)
// （Claude Design「Nazoo UI Redesign」mascots.jsx を react-native-svg へ移植）
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { G, Path, Circle, Ellipse } from 'react-native-svg';

export type AnimalKey = 'chick' | 'rabbit' | 'panda' | 'owl';
export type MascotMood = 'idle' | 'happy' | 'thinking' | 'wrong' | 'celebrate' | 'tired';

type BodyProps = { mood: MascotMood };

// ── 表情（chick / rabbit 共通） ──
function MascotFace({ mood, cx = 60, cy = 62, gap = 15, ink = '#3D3A50', scale = 1 }: { mood: MascotMood; cx?: number; cy?: number; gap?: number; ink?: string; scale?: number }) {
  const lx = cx - gap;
  const rx = cx + gap;
  const s = scale;
  let eyes: React.ReactNode;
  if (mood === 'happy' || mood === 'celebrate') {
    eyes = (
      <G stroke={ink} strokeWidth={3.4 * s} strokeLinecap="round" fill="none">
        <Path d={`M ${lx - 5 * s} ${cy} q ${5 * s} ${-7 * s} ${10 * s} 0`} />
        <Path d={`M ${rx - 5 * s} ${cy} q ${5 * s} ${-7 * s} ${10 * s} 0`} />
      </G>
    );
  } else if (mood === 'wrong') {
    eyes = (
      <G stroke={ink} strokeWidth={3.2 * s} strokeLinecap="round" fill="none">
        <Path d={`M ${lx - 4.5 * s} ${cy - 4 * s} l ${9 * s} ${8 * s} M ${lx + 4.5 * s} ${cy - 4 * s} l ${-9 * s} ${8 * s}`} />
        <Path d={`M ${rx - 4.5 * s} ${cy - 4 * s} l ${9 * s} ${8 * s} M ${rx + 4.5 * s} ${cy - 4 * s} l ${-9 * s} ${8 * s}`} />
      </G>
    );
  } else if (mood === 'tired') {
    eyes = (
      <G stroke={ink} strokeWidth={3.2 * s} strokeLinecap="round" fill="none">
        <Path d={`M ${lx - 5 * s} ${cy} h ${10 * s}`} />
        <Path d={`M ${rx - 5 * s} ${cy} h ${10 * s}`} />
      </G>
    );
  } else if (mood === 'thinking') {
    eyes = (
      <G>
        <Circle cx={lx - 2 * s} cy={cy - 2 * s} r={4.4 * s} fill={ink} />
        <Circle cx={rx - 2 * s} cy={cy - 2 * s} r={4.4 * s} fill={ink} />
        <Circle cx={lx - 0.6 * s} cy={cy - 3.4 * s} r={1.5 * s} fill="#fff" />
        <Circle cx={rx - 0.6 * s} cy={cy - 3.4 * s} r={1.5 * s} fill="#fff" />
      </G>
    );
  } else {
    eyes = (
      <G>
        <Circle cx={lx} cy={cy} r={4.6 * s} fill={ink} />
        <Circle cx={rx} cy={cy} r={4.6 * s} fill={ink} />
        <Circle cx={lx + 1.6 * s} cy={cy - 1.6 * s} r={1.6 * s} fill="#fff" />
        <Circle cx={rx + 1.6 * s} cy={cy - 1.6 * s} r={1.6 * s} fill="#fff" />
      </G>
    );
  }

  const my = cy + 10 * s;
  let mouth: React.ReactNode;
  if (mood === 'happy') {
    mouth = <Path d={`M ${cx - 6 * s} ${my - 2 * s} q ${6 * s} ${7 * s} ${12 * s} 0`} stroke={ink} strokeWidth={3.2 * s} strokeLinecap="round" fill="none" />;
  } else if (mood === 'celebrate') {
    mouth = <Path d={`M ${cx - 7 * s} ${my - 3 * s} q ${7 * s} ${11 * s} ${14 * s} 0 z`} fill="#E0526E" stroke={ink} strokeWidth={2.6 * s} strokeLinejoin="round" />;
  } else if (mood === 'wrong') {
    mouth = <Path d={`M ${cx - 6 * s} ${my + 2 * s} q ${6 * s} ${-6 * s} ${12 * s} 0`} stroke={ink} strokeWidth={3.2 * s} strokeLinecap="round" fill="none" />;
  } else if (mood === 'tired') {
    mouth = <Ellipse cx={cx} cy={my + 1 * s} rx={3.6 * s} ry={4.4 * s} fill={ink} opacity={0.85} />;
  } else if (mood === 'thinking') {
    mouth = <Circle cx={cx} cy={my} r={2.4 * s} fill={ink} />;
  } else {
    mouth = <Path d={`M ${cx - 4.5 * s} ${my - 1.5 * s} q ${4.5 * s} ${4.5 * s} ${9 * s} 0`} stroke={ink} strokeWidth={3 * s} strokeLinecap="round" fill="none" />;
  }

  return (
    <G>
      {eyes}
      {mouth}
      <Ellipse cx={lx - 11 * s} cy={cy + 8 * s} rx={5.5 * s} ry={3.6 * s} fill="#FF9FB6" opacity={0.75} />
      <Ellipse cx={rx + 11 * s} cy={cy + 8 * s} rx={5.5 * s} ry={3.6 * s} fill="#FF9FB6" opacity={0.75} />
    </G>
  );
}

function ChickBody({ mood }: BodyProps) {
  return (
    <G>
      <Ellipse cx="60" cy="104" rx="30" ry="6" fill="#000" opacity={0.07} />
      <Ellipse cx="48" cy="100" rx="8" ry="4.5" fill="#FF9D3B" />
      <Ellipse cx="72" cy="100" rx="8" ry="4.5" fill="#FF9D3B" />
      <Path d="M 60 22 C 86 22 98 44 98 66 C 98 90 81 100 60 100 C 39 100 22 90 22 66 C 22 44 34 22 60 22 Z" fill="#FFD84D" />
      <Path d="M 60 22 C 86 22 98 44 98 66 C 98 90 81 100 60 100 C 52 100 44.5 98.6 38.5 95.7 C 70 92 88 76 84 40 C 78 27 69 22 60 22 Z" fill="#F7C32E" opacity={0.55} />
      <Ellipse cx="25" cy="70" rx="9" ry="13" fill="#F7C32E" transform="rotate(14 25 70)" />
      <Ellipse cx="95" cy="70" rx="9" ry="13" fill="#F7C32E" transform="rotate(-14 95 70)" />
      <Path d="M 54 70 L 66 70 L 60 78 Z" fill="#FF9D3B" />
      <Path d="M 56 22 q 2 -10 8 -12 q -2 7 0 10 q 5 -6 10 -5 q -4 5 -5 9" stroke="#F7C32E" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <MascotFace mood={mood} cy={58} gap={16} />
    </G>
  );
}

function RabbitBody({ mood }: BodyProps) {
  return (
    <G>
      <Ellipse cx="60" cy="106" rx="30" ry="6" fill="#000" opacity={0.07} />
      <Ellipse cx="44" cy="22" rx="10" ry="22" fill="#FFFFFF" stroke="#F3D9E3" strokeWidth="2" transform="rotate(-8 44 22)" />
      <Ellipse cx="44" cy="24" rx="5" ry="14" fill="#FFC2D4" transform="rotate(-8 44 24)" />
      <Ellipse cx="76" cy="22" rx="10" ry="22" fill="#FFFFFF" stroke="#F3D9E3" strokeWidth="2" transform="rotate(8 76 22)" />
      <Ellipse cx="76" cy="24" rx="5" ry="14" fill="#FFC2D4" transform="rotate(8 76 24)" />
      <Path d="M 60 34 C 86 34 99 53 99 72 C 99 93 82 102 60 102 C 38 102 21 93 21 72 C 21 53 34 34 60 34 Z" fill="#FFFFFF" stroke="#F3D9E3" strokeWidth="2" />
      <Ellipse cx="34" cy="84" rx="9" ry="7" fill="#FFFFFF" stroke="#F3D9E3" strokeWidth="2" />
      <Ellipse cx="86" cy="84" rx="9" ry="7" fill="#FFFFFF" stroke="#F3D9E3" strokeWidth="2" />
      <Path d="M 56.5 76 L 63.5 76 L 60 81 Z" fill="#FF8FAB" />
      <MascotFace mood={mood} cy={66} gap={15} />
    </G>
  );
}

function PandaFace({ mood }: BodyProps) {
  const ink = '#FFFFFF';
  const lx = 45;
  const rx = 75;
  const cy = 60;
  let eyes: React.ReactNode;
  if (mood === 'happy' || mood === 'celebrate') {
    eyes = (
      <G stroke={ink} strokeWidth="3.2" strokeLinecap="round" fill="none">
        <Path d={`M ${lx - 4.5} ${cy} q 4.5 -6 9 0`} />
        <Path d={`M ${rx - 4.5} ${cy} q 4.5 -6 9 0`} />
      </G>
    );
  } else if (mood === 'wrong') {
    eyes = (
      <G stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none">
        <Path d={`M ${lx - 4} ${cy - 3.5} l 8 7 M ${lx + 4} ${cy - 3.5} l -8 7`} />
        <Path d={`M ${rx - 4} ${cy - 3.5} l 8 7 M ${rx + 4} ${cy - 3.5} l -8 7`} />
      </G>
    );
  } else if (mood === 'tired') {
    eyes = (
      <G stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none">
        <Path d={`M ${lx - 4.5} ${cy} h 9`} />
        <Path d={`M ${rx - 4.5} ${cy} h 9`} />
      </G>
    );
  } else {
    eyes = (
      <G>
        <Circle cx={lx} cy={cy} r="4.2" fill="#fff" />
        <Circle cx={rx} cy={cy} r="4.2" fill="#fff" />
        <Circle cx={lx + 1.3} cy={cy - 1.3} r="1.6" fill="#3D3A50" />
        <Circle cx={rx + 1.3} cy={cy - 1.3} r="1.6" fill="#3D3A50" />
      </G>
    );
  }
  const my = 86;
  const mouth =
    mood === 'celebrate' ? (
      <Path d={`M 53.5 ${my - 3} q 6.5 10 13 0 z`} fill="#E0526E" stroke="#3D3A50" strokeWidth="2.4" strokeLinejoin="round" />
    ) : mood === 'wrong' ? (
      <Path d={`M 54.5 ${my + 1} q 5.5 -5.5 11 0`} stroke="#3D3A50" strokeWidth="3" strokeLinecap="round" fill="none" />
    ) : (
      <Path d={`M 55 ${my - 2} q 5 5 10 0`} stroke="#3D3A50" strokeWidth="3" strokeLinecap="round" fill="none" />
    );
  return (
    <G>
      {eyes}
      {mouth}
      <Ellipse cx="32" cy="70" rx="5.5" ry="3.6" fill="#FF9FB6" opacity={0.8} />
      <Ellipse cx="88" cy="70" rx="5.5" ry="3.6" fill="#FF9FB6" opacity={0.8} />
    </G>
  );
}

function PandaBody({ mood }: BodyProps) {
  return (
    <G>
      <Ellipse cx="60" cy="106" rx="32" ry="6" fill="#000" opacity={0.07} />
      <Circle cx="32" cy="32" r="12" fill="#3D3A50" />
      <Circle cx="88" cy="32" r="12" fill="#3D3A50" />
      <Path d="M 60 22 C 88 22 100 46 100 68 C 100 91 82 102 60 102 C 38 102 20 91 20 68 C 20 46 32 22 60 22 Z" fill="#FFFFFF" stroke="#E7E2EE" strokeWidth="2" />
      <Ellipse cx="44" cy="60" rx="11" ry="13" fill="#3D3A50" transform="rotate(-12 44 60)" />
      <Ellipse cx="76" cy="60" rx="11" ry="13" fill="#3D3A50" transform="rotate(12 76 60)" />
      <Ellipse cx="30" cy="86" rx="11" ry="8" fill="#3D3A50" />
      <Ellipse cx="90" cy="86" rx="11" ry="8" fill="#3D3A50" />
      <Ellipse cx="60" cy="76" rx="4.5" ry="3.4" fill="#3D3A50" />
      <PandaFace mood={mood} />
    </G>
  );
}

function OwlEyes({ mood }: BodyProps) {
  const ink = '#3D3A50';
  const lx = 44;
  const rx = 76;
  const cy = 48;
  if (mood === 'happy' || mood === 'celebrate') {
    return (
      <G stroke={ink} strokeWidth="3.4" strokeLinecap="round" fill="none">
        <Path d={`M ${lx - 5} ${cy + 1} q 5 -7 10 0`} />
        <Path d={`M ${rx - 5} ${cy + 1} q 5 -7 10 0`} />
      </G>
    );
  }
  if (mood === 'wrong') {
    return (
      <G stroke={ink} strokeWidth="3.2" strokeLinecap="round" fill="none">
        <Path d={`M ${lx - 4.5} ${cy - 4} l 9 8 M ${lx + 4.5} ${cy - 4} l -9 8`} />
        <Path d={`M ${rx - 4.5} ${cy - 4} l 9 8 M ${rx + 4.5} ${cy - 4} l -9 8`} />
      </G>
    );
  }
  if (mood === 'tired') {
    return (
      <G stroke={ink} strokeWidth="3.2" strokeLinecap="round" fill="none">
        <Path d={`M ${lx - 5} ${cy} h 10`} />
        <Path d={`M ${rx - 5} ${cy} h 10`} />
      </G>
    );
  }
  const dx = mood === 'thinking' ? -2 : 0;
  const dy = mood === 'thinking' ? -2 : 0;
  return (
    <G>
      <Circle cx={lx + dx} cy={cy + dy} r="5" fill={ink} />
      <Circle cx={rx + dx} cy={cy + dy} r="5" fill={ink} />
      <Circle cx={lx + dx + 1.7} cy={cy + dy - 1.7} r="1.7" fill="#fff" />
      <Circle cx={rx + dx + 1.7} cy={cy + dy - 1.7} r="1.7" fill="#fff" />
    </G>
  );
}

function OwlBody({ mood }: BodyProps) {
  return (
    <G>
      <Ellipse cx="60" cy="106" rx="30" ry="6" fill="#000" opacity={0.07} />
      <Path d="M 33 28 q -3 -12 4 -18 q 4 9 10 12 Z" fill="#8E7CE0" />
      <Path d="M 87 28 q 3 -12 -4 -18 q -4 9 -10 12 Z" fill="#8E7CE0" />
      <Path d="M 60 18 C 88 18 100 44 100 68 C 100 91 82 102 60 102 C 38 102 20 91 20 68 C 20 44 32 18 60 18 Z" fill="#8E7CE0" />
      <Path d="M 38 70 q 4 -16 22 -16 q 18 0 22 16 q 2 20 -22 24 q -24 -4 -22 -24 Z" fill="#F4EFFF" />
      <G stroke="#D9CCF5" strokeWidth="2" fill="none" strokeLinecap="round">
        <Path d="M 46 72 q 4 5 8 0 q 4 5 8 0 q 4 5 8 0" />
        <Path d="M 50 81 q 4 5 8 0 q 4 5 8 0" />
      </G>
      <Ellipse cx="25" cy="72" rx="9" ry="15" fill="#7765C9" transform="rotate(12 25 72)" />
      <Ellipse cx="95" cy="72" rx="9" ry="15" fill="#7765C9" transform="rotate(-12 95 72)" />
      <G fill="#FFFFFF" stroke="#5E4DB2" strokeWidth="3">
        <Circle cx="44" cy="48" r="13" />
        <Circle cx="76" cy="48" r="13" />
        <Path d="M 57 48 h 6" fill="none" />
      </G>
      <Path d="M 55 62 L 65 62 L 60 71 Z" fill="#FFB13B" />
      <OwlEyes mood={mood} />
      <Ellipse cx="30" cy="58" rx="5.5" ry="3.6" fill="#FF9FB6" opacity={0.7} />
      <Ellipse cx="90" cy="58" rx="5.5" ry="3.6" fill="#FF9FB6" opacity={0.7} />
    </G>
  );
}

const ART: Record<AnimalKey, (p: BodyProps) => React.ReactElement> = {
  chick: ChickBody,
  rabbit: RabbitBody,
  panda: PandaBody,
  owl: OwlBody,
};

export default function AnimatedMascot({
  animal,
  mood = 'idle',
  size = 120,
  reactionKey = 0,
}: {
  animal: AnimalKey;
  mood?: MascotMood;
  size?: number;
  reactionKey?: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  const Body = ART[animal] || ChickBody;

  useEffect(() => {
    v.setValue(0);
    const pp = (d: number) =>
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: d / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(v, { toValue: 0, duration: d / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]);
    let anim: Animated.CompositeAnimation;
    if (mood === 'happy') anim = Animated.sequence([pp(550), pp(550)]);
    else if (mood === 'wrong') anim = Animated.timing(v, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.ease), useNativeDriver: false });
    else {
      const d = mood === 'celebrate' ? 700 : mood === 'thinking' ? 2400 : mood === 'tired' ? 3000 : 2600;
      anim = Animated.loop(pp(d));
    }
    anim.start();
    return () => v.stopAnimation();
  }, [mood, reactionKey, v]);

  const ty = (a: number, b: number) => v.interpolate({ inputRange: [0, 1], outputRange: [a, b] });
  const rt = (a: string, b: string) => v.interpolate({ inputRange: [0, 1], outputRange: [a, b] });
  let transform: any[];
  if (mood === 'thinking') transform = [{ translateY: ty(0, -2) }, { rotate: rt('0deg', '-5deg') }];
  else if (mood === 'tired') transform = [{ translateY: ty(0, 3) }, { rotate: rt('0deg', '-2deg') }];
  else if (mood === 'celebrate') transform = [{ translateY: ty(0, -15) }, { rotate: rt('-4deg', '4deg') }, { scaleX: ty(1, 0.96) }, { scaleY: ty(1, 1.05) }];
  else if (mood === 'happy') transform = [{ translateY: ty(0, -12) }, { scaleX: ty(1, 0.97) }, { scaleY: ty(1, 1.04) }];
  else if (mood === 'wrong')
    transform = [
      { translateX: v.interpolate({ inputRange: [0, 0.2, 0.45, 0.7, 1], outputRange: [0, -7, 7, -4, 0] }) },
      { rotate: v.interpolate({ inputRange: [0, 0.2, 0.45, 0.7, 1], outputRange: ['0deg', '-3deg', '3deg', '-2deg', '0deg'] }) },
    ];
  else transform = [{ translateY: ty(0, -3) }, { scaleX: ty(1, 0.996) }, { scaleY: ty(1, 1.012) }];

  const h = size * (116 / 120);
  return (
    <Animated.View style={{ width: size, height: h, alignItems: 'center', justifyContent: 'center', transform }}>
      <Svg width={size} height={h} viewBox="0 0 120 116">
        <Body mood={mood} />
      </Svg>
    </Animated.View>
  );
}
