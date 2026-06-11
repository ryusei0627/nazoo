import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from './theme';

// 背景の紙吹雪・装飾レイヤー（固定位置・タップは透過）
type Piece = {
  top: string;
  left: string;
  color: string;
  size: number;
  rot: number;
  kind: 'rect' | 'dot' | 'ring' | 'q' | 'star';
};

const C = ['#FF8A4C', '#33C2B4', '#FFC23D', '#9B7EDE', '#FF8FB1', '#6BC5F5'];

const PIECES: Piece[] = [
  { top: '4%', left: '8%', color: C[3], size: 14, rot: 20, kind: 'q' },
  { top: '6%', left: '86%', color: C[1], size: 14, rot: -15, kind: 'q' },
  { top: '10%', left: '20%', color: C[2], size: 10, rot: 30, kind: 'rect' },
  { top: '12%', left: '72%', color: C[0], size: 9, rot: -20, kind: 'rect' },
  { top: '16%', left: '92%', color: C[4], size: 8, rot: 0, kind: 'dot' },
  { top: '22%', left: '5%', color: C[1], size: 9, rot: 40, kind: 'rect' },
  { top: '30%', left: '94%', color: C[2], size: 14, rot: 0, kind: 'star' },
  { top: '34%', left: '3%', color: C[3], size: 10, rot: 0, kind: 'ring' },
  { top: '44%', left: '90%', color: C[0], size: 9, rot: 25, kind: 'rect' },
  { top: '52%', left: '6%', color: C[4], size: 8, rot: 0, kind: 'dot' },
  { top: '60%', left: '93%', color: C[5], size: 9, rot: -30, kind: 'rect' },
  { top: '64%', left: '4%', color: C[2], size: 12, rot: 0, kind: 'star' },
  { top: '74%', left: '89%', color: C[3], size: 8, rot: 0, kind: 'dot' },
  { top: '78%', left: '10%', color: C[0], size: 10, rot: 35, kind: 'rect' },
  { top: '86%', left: '84%', color: C[1], size: 10, rot: 0, kind: 'ring' },
  { top: '90%', left: '16%', color: C[4], size: 9, rot: -25, kind: 'rect' },
];

function Shape({ p }: { p: Piece }) {
  const base = {
    position: 'absolute' as const,
    top: p.top as any,
    left: p.left as any,
    transform: [{ rotate: `${p.rot}deg` }],
  };
  if (p.kind === 'q') {
    return <Text style={[base, { color: p.color, fontSize: p.size + 6, fontWeight: '900' }]}>?</Text>;
  }
  if (p.kind === 'star') {
    return <Text style={[base, { color: p.color, fontSize: p.size + 4 }]}>✦</Text>;
  }
  if (p.kind === 'dot') {
    return <View style={[base, { width: p.size, height: p.size, borderRadius: p.size / 2, backgroundColor: p.color }]} />;
  }
  if (p.kind === 'ring') {
    return <View style={[base, { width: p.size, height: p.size, borderRadius: p.size / 2, borderWidth: 3, borderColor: p.color }]} />;
  }
  return <View style={[base, { width: p.size, height: p.size * 0.5, borderRadius: 2, backgroundColor: p.color }]} />;
}

export default function Decor() {
  return (
    <View style={styles.layer}>
      {PIECES.map((p, i) => (
        <Shape key={i} p={p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' },
});
