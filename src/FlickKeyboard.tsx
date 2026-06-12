// Nazoo — キャンディ・フリックキーボード（新デザイン）
// 3Dキー＋サブラベル＋フリック十字ポップアップ。4列グリッド・縦長こたえるキー。
import { useRef, useState } from 'react';
import { GestureResponderEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS, FONTS } from './theme';

type Dir = 'c' | 'l' | 'u' | 'r' | 'd';
type FlickMap = Partial<Record<Dir, string>> & { c: string };

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

const THRESHOLD = 12;
const KEY_H = 52;
const GAP = 7;

function dirOf(dx: number, dy: number): Dir {
  if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return 'c';
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'l' : 'r';
  return dy < 0 ? 'u' : 'd';
}

function FlickPopup({ map, dir }: { map: FlickMap; dir: Dir }) {
  const cell = (d: Dir, label: string | undefined, x: number, y: number) =>
    label ? (
      <View key={d} style={[styles.flickCell, { left: x, top: y }, dir === d && styles.flickCellActive]}>
        <Text style={[styles.flickCellText, dir === d && styles.flickCellTextActive]}>{label}</Text>
      </View>
    ) : null;
  return (
    <View style={styles.flickPopup} pointerEvents="none">
      {cell('u', map.u, 44, 0)}
      {cell('l', map.l, 0, 44)}
      {cell('c', map.c, 44, 44)}
      {cell('r', map.r, 88, 44)}
      {cell('d', map.d, 44, 88)}
    </View>
  );
}

function FlickKey({ map, onChar, onTap }: { map: FlickMap; onChar: (ch: string) => void; onTap?: () => void }) {
  const start = useRef({ x: 0, y: 0 });
  const [dir, setDir] = useState<Dir | null>(null);
  const sub = [map.l, map.u, map.r].filter(Boolean).join(' ');
  return (
    <View
      style={[styles.key, dir != null && styles.keyDown, { flex: 1, zIndex: dir != null ? 60 : 1 }]}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e: GestureResponderEvent) => {
        start.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        setDir('c');
        onTap?.();
      }}
      onResponderMove={(e: GestureResponderEvent) => {
        setDir(dirOf(e.nativeEvent.pageX - start.current.x, e.nativeEvent.pageY - start.current.y));
      }}
      onResponderRelease={(e: GestureResponderEvent) => {
        const d = dirOf(e.nativeEvent.pageX - start.current.x, e.nativeEvent.pageY - start.current.y);
        onChar(map[d] ?? map.c);
        setDir(null);
      }}
      onResponderTerminate={() => setDir(null)}
    >
      <Text style={styles.keyMain}>{map.c}</Text>
      {sub ? <Text style={styles.keySub}>{sub}</Text> : null}
      {dir != null && <FlickPopup map={map} dir={dir} />}
    </View>
  );
}

function FuncKey({
  variant,
  label,
  sub,
  onPress,
  disabled,
  children,
  style,
}: {
  variant: 'muted' | 'submit';
  label?: string;
  sub?: string;
  onPress: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  style?: any;
}) {
  const [down, setDown] = useState(false);
  const base = variant === 'submit' ? styles.submit : styles.funcMuted;
  const edgeColor = variant === 'submit' ? COLORS.primaryDark : COLORS.keyMutedEdge;
  return (
    <View
      style={[styles.key, base, { shadowColor: edgeColor }, down && !disabled && styles.keyDown, disabled && styles.keyDisabled, style]}
      onStartShouldSetResponder={() => !disabled}
      onResponderGrant={() => !disabled && setDown(true)}
      onResponderRelease={() => {
        if (disabled) return;
        setDown(false);
        onPress();
      }}
      onResponderTerminate={() => setDown(false)}
    >
      {children || (
        <>
          <Text style={[styles.funcMain, variant === 'submit' && styles.submitLabel]}>{label}</Text>
          {sub ? <Text style={styles.keySub}>{sub}</Text> : null}
        </>
      )}
    </View>
  );
}

type Props = {
  onChar: (ch: string) => void;
  onCycle: () => void;
  onDelete: () => void;
  onSubmit: () => void;
  canSubmit?: boolean;
  onTap?: () => void;
};

export default function FlickKeyboard({ onChar, onCycle, onDelete, onSubmit, canSubmit = true, onTap }: Props) {
  const leftRows = [
    [KEYS[0], KEYS[1], KEYS[2]],
    [KEYS[3], KEYS[4], KEYS[5]],
    [KEYS[6], KEYS[7], KEYS[8]],
  ];
  return (
    <View style={styles.kbRoot}>
      <View style={{ flexDirection: 'row', gap: GAP }}>
        {/* 左：かな3列 */}
        <View style={{ flex: 3, gap: GAP }}>
          {leftRows.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', gap: GAP, height: KEY_H }}>
              {row.map((m) => (
                <FlickKey key={m.c} map={m} onChar={onChar} onTap={onTap} />
              ))}
            </View>
          ))}
          {/* 4行目：小゛゜ / わ / スペーサ（「ー」は「わ」の右フリックで入力） */}
          <View style={{ flexDirection: 'row', gap: GAP, height: KEY_H }}>
            <FuncKey variant="muted" label="小" sub="゛ ゜" onPress={onCycle} style={{ flex: 1 }} />
            <FlickKey map={KEYS[9]} onChar={onChar} onTap={onTap} />
            <View style={{ flex: 1 }} />
          </View>
        </View>
        {/* 右：削除 / こたえる（縦長） */}
        <View style={{ flex: 1, gap: GAP }}>
          <FuncKey variant="muted" onPress={onDelete} style={{ height: KEY_H }}>
            <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={COLORS.inkSoft} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 4 H20 a1.5 1.5 0 0 1 1.5 1.5 v13 A1.5 1.5 0 0 1 20 20 H9 L2.5 12 Z" />
              <Path d="M12 9.5 L17 14.5 M17 9.5 L12 14.5" />
            </Svg>
          </FuncKey>
          <FuncKey variant="submit" onPress={onSubmit} disabled={!canSubmit} style={{ flex: 1 }}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 13 L9 18 L20 6" />
            </Svg>
            <Text style={styles.submitLabel}>こたえる</Text>
          </FuncKey>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kbRoot: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 9,
    paddingTop: 9,
    paddingBottom: 10,
  },
  key: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.surfaceEdge,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  keyDown: { transform: [{ translateY: 4 }], shadowOpacity: 0, elevation: 0 },
  keyDisabled: { opacity: 0.4 },
  keyMain: { fontSize: 21, fontWeight: '900', fontFamily: FONTS.black, color: COLORS.ink, lineHeight: 23 },
  keySub: { fontSize: 8.5, fontWeight: '800', fontFamily: FONTS.exbold, color: COLORS.inkSoft, letterSpacing: 2, marginTop: 1 },
  funcMuted: { backgroundColor: COLORS.keyMuted },
  funcMain: { fontSize: 17, fontWeight: '900', fontFamily: FONTS.black, color: COLORS.ink },
  submit: { backgroundColor: COLORS.primary },
  submitLabel: { color: '#fff', fontSize: 14, fontWeight: '900', fontFamily: FONTS.black, letterSpacing: 1, marginTop: 3 },
  flickPopup: { position: 'absolute', left: '50%', top: '50%', width: 132, height: 132, marginLeft: -66, marginTop: -66, zIndex: 60 },
  flickCell: { position: 'absolute', width: 44, height: 44, borderRadius: 13, backgroundColor: COLORS.ink, alignItems: 'center', justifyContent: 'center', opacity: 0.92 },
  flickCellActive: { backgroundColor: COLORS.primary, opacity: 1, transform: [{ scale: 1.12 }] },
  flickCellText: { fontSize: 21, fontWeight: '900', fontFamily: FONTS.black, color: 'rgba(255,255,255,0.85)' },
  flickCellTextActive: { color: '#fff' },
});
