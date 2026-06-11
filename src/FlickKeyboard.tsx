import { useRef, useState } from 'react';
import { Animated, GestureResponderEvent, StyleSheet, Text, View } from 'react-native';
import { MOTION, useReducedMotion } from './motion';
import { COLORS, FONTS } from './theme';

type Dir = 'c' | 'l' | 'u' | 'r' | 'd';
type FlickMap = Partial<Record<Dir, string>> & { c: string };

// 各キーのフリック割り当て（c=タップ, l=左, u=上, r=右, d=下）
const KEYS: FlickMap[] = [
  { c: 'あ', l: 'い', u: 'う', r: 'え', d: 'お' },
  { c: 'か', l: 'き', u: 'く', r: 'け', d: 'こ' },
  { c: 'さ', l: 'し', u: 'す', r: 'せ', d: 'そ' },
  { c: 'た', l: 'ち', u: 'つ', r: 'て', d: 'と' },
  { c: 'な', l: 'に', u: 'ぬ', r: 'ね', d: 'の' },
  { c: 'は', l: 'ひ', u: 'ふ', r: 'へ', d: 'ほ' },
  { c: 'ま', l: 'み', u: 'む', r: 'め', d: 'も' },
  { c: 'や', u: 'ゆ', d: 'よ' },
  { c: 'ら', l: 'り', u: 'る', r: 'れ', d: 'ろ' },
  { c: 'わ', l: 'を', u: 'ん', r: 'ー' },
];

// フリック判定のしきい値（小さいほど軽く反応する）
const THRESHOLD = 10;

function pressDown(scale: Animated.Value, reducedMotion: boolean) {
  if (reducedMotion) return;
  Animated.timing(scale, { toValue: 0.94, duration: MOTION.fast, easing: MOTION.easeOut, useNativeDriver: false }).start();
}

function pressUp(scale: Animated.Value, reducedMotion: boolean) {
  if (reducedMotion) return;
  Animated.spring(scale, { toValue: 1, friction: 5, tension: 180, useNativeDriver: false }).start();
}

function dirOf(dx: number, dy: number): Dir {
  if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return 'c';
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'l' : 'r';
  return dy < 0 ? 'u' : 'd';
}

function FlickKey({ map, onChar }: { map: FlickMap; onChar: (ch: string) => void }) {
  const reducedMotion = useReducedMotion();
  const start = useRef({ x: 0, y: 0 });
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  const grant = (e: GestureResponderEvent) => {
    start.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
    setPressed(true);
    pressDown(scale, reducedMotion);
  };
  const release = (e: GestureResponderEvent) => {
    const d = dirOf(e.nativeEvent.pageX - start.current.x, e.nativeEvent.pageY - start.current.y);
    onChar(map[d] ?? map.c);
    setPressed(false);
    pressUp(scale, reducedMotion);
  };

  return (
    <Animated.View
      style={[styles.key, pressed && styles.keyPressed, { transform: [{ scale }] }]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={grant}
      onResponderRelease={release}
      onResponderTerminate={() => {
        setPressed(false);
        pressUp(scale, reducedMotion);
      }}
    >
      <Text style={styles.keyLabel}>{map.c}</Text>
    </Animated.View>
  );
}

function FuncKey({
  label,
  onPress,
  bg = '#FFE9C9',
  color = COLORS.primaryDark,
}: {
  label: string;
  onPress: () => void;
  bg?: string;
  color?: string;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);
  return (
    <Animated.View
      style={[styles.key, { backgroundColor: bg }, pressed && styles.keyPressed, { transform: [{ scale }] }]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={() => {
        setPressed(true);
        pressDown(scale, reducedMotion);
      }}
      onResponderRelease={() => {
        setPressed(false);
        pressUp(scale, reducedMotion);
        onPress();
      }}
      onResponderTerminate={() => {
        setPressed(false);
        pressUp(scale, reducedMotion);
      }}
    >
      <Text style={[styles.funcLabel, { color }]}>{label}</Text>
    </Animated.View>
  );
}

function SubmitKey({ onSubmit }: { onSubmit: () => void }) {
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  return (
    <Animated.View
      style={[styles.submit, pressed && styles.submitPressed, { transform: [{ scale }] }]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={() => {
        setPressed(true);
        pressDown(scale, reducedMotion);
      }}
      onResponderRelease={() => {
        setPressed(false);
        pressUp(scale, reducedMotion);
        onSubmit();
      }}
      onResponderTerminate={() => {
        setPressed(false);
        pressUp(scale, reducedMotion);
      }}
    >
      <Text style={styles.submitText}>こたえる</Text>
    </Animated.View>
  );
}

type Props = {
  onChar: (ch: string) => void;
  onCycle: () => void; // 小゛゜
  onDelete: () => void;
  onSubmit: () => void;
};

export default function FlickKeyboard({ onChar, onCycle, onDelete, onSubmit }: Props) {
  const rows = [KEYS.slice(0, 3), KEYS.slice(3, 6), KEYS.slice(6, 9)];
  return (
    <View style={styles.wrap}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((m) => (
            <FlickKey key={m.c} map={m} onChar={onChar} />
          ))}
        </View>
      ))}
      <View style={styles.row}>
        <FuncKey label="小゛゜" onPress={onCycle} />
        <FlickKey map={KEYS[9]} onChar={onChar} />
        <FuncKey label="⌫" onPress={onDelete} bg={COLORS.navy} color="#fff" />
      </View>
      <SubmitKey onSubmit={onSubmit} />
    </View>
  );
}

const KEY_H = 52;
const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: 440, alignSelf: 'center', paddingHorizontal: 8, paddingBottom: 10, gap: 7 },
  row: { flexDirection: 'row', gap: 7 },
  key: {
    flex: 1,
    height: KEY_H,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  keyPressed: { opacity: 0.72 },
  keyLabel: { fontSize: 24, fontWeight: '700', fontFamily: FONTS.bold, color: COLORS.ink },
  funcLabel: { fontSize: 18, fontWeight: '900', fontFamily: FONTS.black },
  submit: {
    height: KEY_H,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  submitPressed: { opacity: 0.86 },
  submitText: { color: '#fff', fontSize: 19, fontWeight: '900', fontFamily: FONTS.black, letterSpacing: 2 },
});
