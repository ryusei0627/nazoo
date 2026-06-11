// 背景：空色グラデ ＋ ドリフトする雲 ＋ またたくキラキラ
// （キャンディポップ・ズー デザイン）
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from './theme';
import { useReducedMotion } from './motion';

const WIN = Dimensions.get('window');
const CLOUD = 'rgba(255,255,255,0.85)';

function Cloud({ top, w, h, dur, delay, reduced }: { top: string; w: number; h: number; dur: number; delay: number; reduced: boolean }) {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.timing(x, { toValue: 1, duration: dur * 1000, delay, easing: Easing.linear, useNativeDriver: false })
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, x, dur, delay]);
  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [-w - 40, WIN.width + 40] });
  return (
    <Animated.View style={{ position: 'absolute', top: top as any, left: 0, width: w, height: h, transform: [{ translateX }] }}>
      <View style={{ position: 'absolute', bottom: 0, left: 0, width: w, height: h, borderRadius: 999, backgroundColor: CLOUD }} />
      <View style={{ position: 'absolute', bottom: h * 0.18, left: w * 0.12, width: w * 0.55, height: h * 1.6, borderRadius: 999, backgroundColor: CLOUD }} />
      <View style={{ position: 'absolute', bottom: h * 0.24, right: w * 0.12, width: w * 0.42, height: h * 1.2, borderRadius: 999, backgroundColor: CLOUD }} />
    </Animated.View>
  );
}

function Spark({ top, left, right, s, delay, reduced }: { top: string; left?: string; right?: string; s: number; delay: number; reduced: boolean }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) {
      a.setValue(0.6);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 1400, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(a, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, a, delay]);
  const opacity = a.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.95] });
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  return (
    <Animated.View style={{ position: 'absolute', top: top as any, left: left as any, right: right as any, opacity, transform: [{ scale }] }}>
      <Svg width={s} height={s} viewBox="0 0 24 24">
        <Path
          d="M12 2 C 12.8 7.5 14.5 9.2 20 10 C 14.5 10.8 12.8 12.5 12 18 C 11.2 12.5 9.5 10.8 4 10 C 9.5 9.2 11.2 7.5 12 2 Z"
          fill="rgba(255,255,255,0.92)"
        />
      </Svg>
    </Animated.View>
  );
}

export default function Decor() {
  const reduced = useReducedMotion();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={[COLORS.bgTop, COLORS.bgBottom]} locations={[0, 0.78]} style={StyleSheet.absoluteFill} />
      <Cloud top="9%" w={110} h={30} dur={46} delay={0} reduced={reduced} />
      <Cloud top="22%" w={80} h={24} dur={38} delay={4000} reduced={reduced} />
      <Cloud top="48%" w={95} h={26} dur={52} delay={8000} reduced={reduced} />
      <Spark top="13%" left="12%" s={14} delay={0} reduced={reduced} />
      <Spark top="7%" right="18%" s={11} delay={1100} reduced={reduced} />
      <Spark top="30%" right="8%" s={13} delay={600} reduced={reduced} />
      <Spark top="40%" left="6%" s={10} delay={1800} reduced={reduced} />
    </View>
  );
}
