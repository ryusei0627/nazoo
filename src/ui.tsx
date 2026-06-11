// Nazoo — 共通UI部品（キャンディポップ・ズー）
// 立体キャンディボタン / ステッカーカード / カードタブ / 線画アイコン
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View, ViewStyle, StyleProp } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { COLORS, DS, FONTS } from './theme';

// 昇格演出の回転サンバースト（レイ）
const RAY_PATHS: string[] = (() => {
  const cx = 240;
  const cy = 240;
  const r = 330;
  const half = 6;
  const out: string[] = [];
  for (let i = 0; i < 12; i++) {
    const a = i * 30;
    const a1 = ((a - half) * Math.PI) / 180;
    const a2 = ((a + half) * Math.PI) / 180;
    out.push(`M${cx} ${cy} L${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} L${cx + r * Math.cos(a2)} ${cy + r * Math.sin(a2)} Z`);
  }
  return out;
})();

export function PromoRays({ reduced }: { reduced: boolean }) {
  const r = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(Animated.timing(r, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, [reduced, r]);
  const rotate = r.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 480, height: 480, top: -130, left: '50%', marginLeft: -240, transform: [{ rotate }] }}>
      <Svg width={480} height={480} viewBox="0 0 480 480">
        {RAY_PATHS.map((d, i) => (
          <Path key={i} d={d} fill="#FFF1F4" />
        ))}
      </Svg>
    </Animated.View>
  );
}

// ── 線画アイコン ──
export function NzIcon({ name, size = 20, color = COLORS.ink }: { name: string; size?: number; color?: string }) {
  const sw = 2.4;
  const common = { width: size, height: size, viewBox: '0 0 24 24' } as const;
  switch (name) {
    case 'clock':
      return (
        <Svg {...common} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="13" r="8" />
          <Path d="M12 9.5 V 13 L 15 15" />
          <Path d="M9.5 3 h 5" />
        </Svg>
      );
    case 'bulb':
      return (
        <Svg {...common} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M9 18 h 6 M10 21 h 4" />
          <Path d="M12 3 a 6 6 0 0 1 3.5 10.9 c -0.8 0.6 -1 1.3 -1 2.1 h -5 c 0 -0.8 -0.2 -1.5 -1 -2.1 A 6 6 0 0 1 12 3 Z" />
        </Svg>
      );
    case 'skip':
      return (
        <Svg {...common} fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M5 5 L 12 12 L 5 19" />
          <Path d="M13 5 L 20 12 L 13 19" />
        </Svg>
      );
    case 'crown':
      return (
        <Svg {...common} fill={color}>
          <Path d="M3 8 L 7.5 12 L 12 5.5 L 16.5 12 L 21 8 L 19.4 17 a 1.6 1.6 0 0 1 -1.6 1.3 H 6.2 A 1.6 1.6 0 0 1 4.6 17 Z" />
        </Svg>
      );
    case 'play':
      return (
        <Svg {...common} fill={color}>
          <Path d="M7 4.8 C 7 3.6 8.3 2.9 9.3 3.5 L 19.5 10.7 c 1 0.6 1 2 0 2.6 L 9.3 20.5 C 8.3 21.1 7 20.4 7 19.2 Z" />
        </Svg>
      );
    case 'retry':
      return (
        <Svg {...common} fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 12 a 8 8 0 1 1 -2.5 -5.8" />
          <Path d="M20 3 v 4.5 h -4.5" />
        </Svg>
      );
    case 'share':
      return (
        <Svg {...common} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 14 V 3.5 M12 3.5 L 8 7.5 M12 3.5 L 16 7.5" />
          <Path d="M5 11 v 8 a 2 2 0 0 0 2 2 h 10 a 2 2 0 0 0 2 -2 v -8" />
        </Svg>
      );
    case 'pencil':
      return (
        <Svg {...common} fill="none" stroke={color} strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 20 l 1 -4.5 L 16.5 4 a 2.1 2.1 0 0 1 3 0 l 0.5 0.5 a 2.1 2.1 0 0 1 0 3 L 8.5 19 Z" />
        </Svg>
      );
    case 'bolt':
      return (
        <Svg {...common} fill={color}>
          <Path d="M13.5 2 L 4.5 13.5 H 11 L 10 22 L 19.5 10 H 13 Z" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...common} fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round">
          <Path d="M12 5 v 14 M5 12 h 14" />
        </Svg>
      );
    case 'soundOn':
      return (
        <Svg {...common} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 9.5 v 5 h 3.5 L 12 19 V 5 L 7.5 9.5 Z" fill={color} stroke="none" />
          <Path d="M15.5 9 a 4.2 4.2 0 0 1 0 6 M18 6.5 a 8 8 0 0 1 0 11" />
        </Svg>
      );
    case 'soundOff':
      return (
        <Svg {...common} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 9.5 v 5 h 3.5 L 12 19 V 5 L 7.5 9.5 Z" fill={color} stroke="none" />
          <Path d="M15.5 9.5 l 5 5 M20.5 9.5 l -5 5" />
        </Svg>
      );
    case 'sparkle':
      return (
        <Svg {...common} fill={color}>
          <Path d="M12 2 C 12.8 7.5 14.5 9.2 20 10 C 14.5 10.8 12.8 12.5 12 18 C 11.2 12.5 9.5 10.8 4 10 C 9.5 9.2 11.2 7.5 12 2 Z" />
        </Svg>
      );
    default:
      return null;
  }
}

// ── 星（難易度） ──
export function NzStar({ size = 12, filled = true, color = '#fff' }: { size?: number; filled?: boolean; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'rgba(255,255,255,0.35)'}>
      <Path d="M12 2.5 L 14.9 8.6 L 21.5 9.5 L 16.7 14.1 L 17.9 20.7 L 12 17.5 L 6.1 20.7 L 7.3 14.1 L 2.5 9.5 L 9.1 8.6 Z" />
    </Svg>
  );
}

// ── 立体キャンディボタン（押すと沈む） ──
export function CandyButton({
  color = COLORS.primary,
  edge = COLORS.primaryDark,
  height = 64,
  radius = 22,
  gap = 9,
  onPress,
  disabled,
  style,
  children,
}: {
  color?: string;
  edge?: string;
  height?: number;
  radius?: number;
  gap?: number;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const [down, setDown] = useState(false);
  const depth = DS.depth;
  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      onPress={onPress}
      style={[{ height: height + depth, borderRadius: radius }, style]}
    >
      {/* 下エッジ（厚み） */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: edge, borderRadius: radius, opacity: disabled ? 0.5 : 1 }} />
      {/* 面 */}
      <View
        style={{
          height,
          borderRadius: radius,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap,
          transform: [{ translateY: down ? depth : 0 }],
          opacity: disabled ? 0.55 : 1,
          overflow: 'hidden',
        }}
      >
        {/* 上のツヤ */}
        <View style={{ position: 'absolute', top: 5, left: 12, right: 12, height: '34%', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.32)' }} />
        {children}
      </View>
    </Pressable>
  );
}

// ── ステッカーカード（白・下エッジ＋ソフト影） ──
export function StickerCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={{
        alignSelf: 'stretch',
        backgroundColor: COLORS.surfaceEdge,
        borderRadius: DS.rLg,
        paddingBottom: DS.cardEdge,
        shadowColor: '#3D3A50',
        shadowOpacity: 0.1,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 10 },
        elevation: 4,
      }}
    >
      <View style={[{ backgroundColor: COLORS.surface, borderRadius: DS.rLg }, style]}>{children}</View>
    </View>
  );
}

// ── カードタブ（カード上部に食い込むリボン） ──
export function CardTab({ label, color, textColor = '#fff' }: { label: string; color: string; textColor?: string }) {
  return (
    <View
      style={{
        position: 'absolute',
        top: -13,
        alignSelf: 'center',
        zIndex: 2,
        paddingHorizontal: 18,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: color,
        transform: [{ rotate: '-2deg' }],
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 0,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      <NzCardTabText label={label} color={textColor} />
    </View>
  );
}

function NzCardTabText({ label, color }: { label: string; color: string }) {
  return <Text style={{ color, fontSize: 13, fontWeight: '900', fontFamily: FONTS.black, letterSpacing: 1 }}>{label}</Text>;
}
