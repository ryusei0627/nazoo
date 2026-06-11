import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from './theme';

// 五十音グリッド（5段 × 10行）。'' は空きマス
const GRID: string[][] = [
  ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ'],
  ['い', 'き', 'し', 'ち', 'に', 'ひ', 'み', '', 'り', 'を'],
  ['う', 'く', 'す', 'つ', 'ぬ', 'ふ', 'む', 'ゆ', 'る', 'ん'],
  ['え', 'け', 'せ', 'て', 'ね', 'へ', 'め', '', 'れ', ''],
  ['お', 'こ', 'そ', 'と', 'の', 'ほ', 'も', 'よ', 'ろ', 'ー'],
];

type Props = {
  onKey: (ch: string) => void;
  onMark: () => void; // ゛゜（清音→濁音→半濁音）
  onSmall: () => void; // 大⇄小
  onDelete: () => void;
  onSubmit: () => void;
};

function Key({
  label,
  onPress,
  flex = 1,
  bg = COLORS.card,
  color = COLORS.ink,
  big = false,
}: {
  label: string;
  onPress: () => void;
  flex?: number;
  bg?: string;
  color?: string;
  big?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        { flex, backgroundColor: bg, opacity: pressed ? 0.55 : 1 },
      ]}
    >
      <Text style={[styles.keyLabel, { color }, big && styles.keyLabelBig]}>{label}</Text>
    </Pressable>
  );
}

export default function KanaKeyboard({ onKey, onMark, onSmall, onDelete, onSubmit }: Props) {
  return (
    <View style={styles.wrap}>
      {GRID.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((ch, ci) =>
            ch === '' ? (
              <View key={ci} style={styles.spacer} />
            ) : (
              <Key key={ci} label={ch} onPress={() => onKey(ch)} />
            )
          )}
        </View>
      ))}

      {/* コントロール行 */}
      <View style={styles.row}>
        <Key label="゛゜" onPress={onMark} flex={1.4} bg="#FFE9C9" color={COLORS.primaryDark} />
        <Key label="小" onPress={onSmall} flex={1.4} bg="#FFE9C9" color={COLORS.primaryDark} />
        <Key label="⌫" onPress={onDelete} flex={1.6} bg="#FFD8D8" color={COLORS.danger} big />
        <Key label="こたえる" onPress={onSubmit} flex={4} bg={COLORS.primary} color="#fff" big />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 6, paddingBottom: 8, gap: 6 },
  row: { flexDirection: 'row', gap: 5 },
  key: {
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  keyLabel: { fontSize: 20, fontWeight: '700' },
  keyLabelBig: { fontSize: 16, fontWeight: '900' },
  spacer: { flex: 1 },
});
